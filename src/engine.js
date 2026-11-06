// ---- QR Studio engine: pure functions, no DOM. Works in browsers and Node. ----
var QRStudio = (function (qrcode) {
  var f = function (v) { return Math.round(v * 1000) / 1000; };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); };

  if (qrcode.stringToBytesFuncs && qrcode.stringToBytesFuncs["UTF-8"]) qrcode.stringToBytes = qrcode.stringToBytesFuncs["UTF-8"];

  var PRESETS = {
    "Sunset":  { fillMode: "gradient", c1: "#b0124f", c2: "#d2380f", c3: "#b45309", angle: 45,  bg: "#fff8f0", eyeOuter: "#8e0038", eyeInner: "#d2380f" },
    "Ocean":   { fillMode: "gradient", c1: "#0f4c81", c2: "#0e7490", c3: "#0f766e", angle: 135, bg: "#f0fbff", eyeOuter: "#0b2e5a", eyeInner: "#0e7490" },
    "Candy":   { fillMode: "gradient", c1: "#be1c8a", c2: "#7c3aed", c3: "#2563eb", angle: 60,  bg: "#fff5fb", eyeOuter: "#7c3aed", eyeInner: "#d6249f" },
    "Forest":  { fillMode: "gradient", c1: "#14532d", c2: "#15803d", c3: "#3f6212", angle: 90,  bg: "#f4fbea", eyeOuter: "#14532d", eyeInner: "#15803d" },
    "Lava":    { fillMode: "gradient", c1: "#7f1d1d", c2: "#c62828", c3: "#c2410c", angle: 120, bg: "#fffaf5", eyeOuter: "#7f1d1d", eyeInner: "#c62828" },
    "Ink":     { fillMode: "solid",    c1: "#111827", c2: "#111827", c3: "",        angle: 0,   bg: "#ffffff", eyeOuter: "#111827", eyeInner: "#111827" },
    "Neon":    { fillMode: "gradient", c1: "#5cf2c2", c2: "#7dd3fc", c3: "#c084fc", angle: 45,  bg: "#0b1020", eyeOuter: "#5cf2c2", eyeInner: "#c084fc" }
  };

  var DEFAULTS = {
    text: "", shape: "rounded", dotScale: 0.94, eyeShape: "rounded", eyeMatch: false,
    pad: 4, bgRadius: 2, transparent: false, logoType: "none", logoValue: "", logoScale: 0.2, caption: "", ec: "auto"
  };
  function withDefaults(o) {
    var r = {}, k, p = PRESETS.Candy;
    for (k in DEFAULTS) r[k] = DEFAULTS[k];
    for (k in p) r[k] = p[k];
    for (k in (o || {})) if (o[k] !== undefined) r[k] = o[k];
    return r;
  }


  // ---- payload builders for the content modes ----
  function wifiEsc(v) { return String(v || "").replace(/([\\;,:"])/g, "\\$1"); }
  function vcardEsc(v) { return String(v || "").replace(/([\\;,])/g, "\\$1").replace(/\n/g, "\\n"); }
  function payload(mode, fld) {
    fld = fld || {};
    if (mode === "wifi") {
      var sec = fld.security || "WPA";
      return "WIFI:T:" + (sec === "nopass" ? "nopass" : sec) + ";S:" + wifiEsc(fld.ssid) + ";" + (sec === "nopass" ? "" : "P:" + wifiEsc(fld.password) + ";") + (fld.hidden ? "H:true;" : "") + ";";
    }
    if (mode === "contact") {
      var L = ["BEGIN:VCARD", "VERSION:3.0"];
      var first = (fld.first || "").trim(), last = (fld.last || "").trim();
      L.push("N:" + vcardEsc(last) + ";" + vcardEsc(first) + ";;;");
      L.push("FN:" + vcardEsc((first + " " + last).trim()));
      if (fld.org) L.push("ORG:" + vcardEsc(fld.org));
      if (fld.title) L.push("TITLE:" + vcardEsc(fld.title));
      if (fld.phone) L.push("TEL;TYPE=CELL:" + vcardEsc(fld.phone));
      if (fld.email) L.push("EMAIL:" + vcardEsc(fld.email));
      if (fld.url) L.push("URL:" + vcardEsc(fld.url));
      L.push("END:VCARD");
      return L.join("\r\n");
    }
    if (mode === "email") {
      var q = [];
      if (fld.subject) q.push("subject=" + encodeURIComponent(fld.subject));
      if (fld.body) q.push("body=" + encodeURIComponent(fld.body));
      return "mailto:" + (fld.to || "").trim() + (q.length ? "?" + q.join("&") : "");
    }
    return fld.text || "";
  }

  function rr(x, y, w, h, r) {
    var a = r[0], b = r[1], c = r[2], d = r[3];
    var s = "M" + f(x + a) + " " + f(y) + "H" + f(x + w - b);
    if (b) s += "A" + f(b) + " " + f(b) + " 0 0 1 " + f(x + w) + " " + f(y + b);
    s += "V" + f(y + h - c);
    if (c) s += "A" + f(c) + " " + f(c) + " 0 0 1 " + f(x + w - c) + " " + f(y + h);
    s += "H" + f(x + d);
    if (d) s += "A" + f(d) + " " + f(d) + " 0 0 1 " + f(x) + " " + f(y + h - d);
    s += "V" + f(y + a);
    if (a) s += "A" + f(a) + " " + f(a) + " 0 0 1 " + f(x + a) + " " + f(y);
    return s + "Z";
  }

  function matrix(text, ec) {
    var qr = qrcode(0, ec);
    qr.addData(text);
    qr.make();
    var n = qr.getModuleCount(), m = [];
    for (var r = 0; r < n; r++) { m.push([]); for (var c = 0; c < n; c++) m[r].push(qr.isDark(r, c)); }
    return m;
  }

  function lum(hex) {
    var h = hex.replace("#", ""); if (h.length === 3) h = h.replace(/./g, "$&$&");
    var v = [0, 2, 4].map(function (i) { var c = parseInt(h.substr(i, 2), 16) / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  }
  function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }

  function check(o) {
    o = withDefaults(o);
    var notes = [], level = "good";
    var fills = [o.c1]; if (o.fillMode === "gradient") { fills.push(o.c2); if (o.c3) fills.push(o.c3); }
    if (!o.transparent) {
      var worst = Math.min.apply(null, fills.map(function (c) { return contrast(c, o.bg); }));
      if (fills.some(function (c) { return lum(c) > lum(o.bg); })) { notes.push("Light code on a dark background: looks great, but some scanner apps can't read inverted codes."); level = "warn"; }
      else if (worst < 2.5) { notes.push("Low contrast (" + worst.toFixed(1) + ":1). Make the dots darker or the background lighter."); level = "bad"; }
      else if (worst < 3.5) { notes.push("Contrast is a bit low (" + worst.toFixed(1) + ":1). Test it with your phone."); level = "warn"; }
    } else notes.push("Transparent background: make sure it sits on a plain, light surface.");
    if (o.pad < 3) { notes.push("Small border: some scanners need at least 3-4 modules of quiet space."); if (level === "good") level = "warn"; }
    if (o.shape !== "square" && o.dotScale < 0.75) { notes.push("Small dots are harder to scan."); if (level === "good") level = "warn"; }
    if (!notes.length) notes.push("Looks scannable. Still, always test with your phone before printing.");
    return { level: level, notes: notes };
  }

  function render(opts) {
    var o = withDefaults(opts);
    var text = String(o.text || "").trim() || "https://example.com";
    var hasLogo = o.logoType !== "none" && o.logoValue;
    var ec = o.ec === "auto" ? (hasLogo ? "H" : "M") : o.ec;
    if (hasLogo && ec !== "H" && ec !== "Q") ec = "H";
    var m = matrix(text, ec), n = m.length, pad = o.pad;
    var W = n + 2 * pad, cap = o.caption ? 4 : 0, H = W + cap;

    // logo hole
    var hole = null;
    if (hasLogo) {
      var s = Math.max(3, Math.round(n * o.logoScale)); if (s % 2 === 0) s += 1;
      var lo = Math.floor((n - s) / 2); hole = { lo: lo, hi: lo + s, s: s };
    }
    var inEye = function (r, c) { return (r < 8 && c < 8) || (r < 8 && c >= n - 8) || (r >= n - 8 && c < 8); };

    var d = [], scale = o.shape === "square" ? 1 : o.dotScale, mg = (1 - scale) / 2;
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) {
      if (!m[r][c] || inEye(r, c)) continue;
      if (hole && r >= hole.lo && r < hole.hi && c >= hole.lo && c < hole.hi) continue;
      var x = c + pad, y = r + pad;
      if (o.shape === "square") d.push("M" + x + " " + y + "h1v1h-1z");
      else if (o.shape === "rounded") d.push(rr(x + mg, y + mg, scale, scale, [scale * 0.32, scale * 0.32, scale * 0.32, scale * 0.32]));
      else if (o.shape === "dots") { var rad = scale / 2, cx = x + 0.5, cy = y + 0.5; d.push("M" + f(cx - rad) + " " + f(cy) + "a" + f(rad) + " " + f(rad) + " 0 1 0 " + f(2 * rad) + " 0a" + f(rad) + " " + f(rad) + " 0 1 0 " + f(-2 * rad) + " 0z"); }
      else if (o.shape === "diamond") { var hh = scale * 0.66, cx2 = x + 0.5, cy2 = y + 0.5; d.push("M" + f(cx2) + " " + f(cy2 - hh) + "L" + f(cx2 + hh) + " " + f(cy2) + "L" + f(cx2) + " " + f(cy2 + hh) + "L" + f(cx2 - hh) + " " + f(cy2) + "Z"); }
    }

    var fillRef = "url(#g)";
    var defs = "";
    if (o.fillMode === "gradient") {
      var a = (o.angle || 0) * Math.PI / 180, dx = Math.cos(a) / 2, dy = Math.sin(a) / 2;
      var stops = [o.c1, o.c2].concat(o.c3 ? [o.c3] : []);
      defs = '<linearGradient id="g" gradientUnits="userSpaceOnUse" x1="' + f(W / 2 - dx * W) + '" y1="' + f(H / 2 - dy * W) + '" x2="' + f(W / 2 + dx * W) + '" y2="' + f(H / 2 + dy * W) + '">' +
        stops.map(function (c, i) { return '<stop offset="' + f(i / (stops.length - 1)) + '" stop-color="' + esc(c) + '"/>'; }).join("") + "</linearGradient>";
    } else fillRef = esc(o.c1);

    var R = { square: [[0,0,0,0],[0,0,0,0]], rounded: [[2,2,2,2],[1,1,1,1]], circle: [[3.5,3.5,3.5,3.5],[1.5,1.5,1.5,1.5]], leaf: [[3.2,0,3.2,0],[1.5,0,1.5,0]] }[o.eyeShape] || [[0,0,0,0],[0,0,0,0]];
    var outerC = o.eyeMatch ? fillRef : esc(o.eyeOuter), innerC = o.eyeMatch ? fillRef : esc(o.eyeInner);
    var eyes = [[0, 0], [n - 7, 0], [0, n - 7]], eo = "", ei = "";
    eyes.forEach(function (p) {
      var X = p[0] + pad, Y = p[1] + pad;
      eo += rr(X, Y, 7, 7, R[0]) + rr(X + 1, Y + 1, 5, 5, R[0].map(function (v) { return Math.max(0, v - 1); }));
      ei += rr(X + 2, Y + 2, 3, 3, R[1]);
    });

    var svg = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ' + W + " " + H + '" width="' + (W * 10) + '" height="' + (H * 10) + '">';
    if (defs) svg += "<defs>" + defs + "</defs>";
    if (!o.transparent) svg += '<rect width="' + W + '" height="' + H + '" rx="' + f(o.bgRadius) + '" fill="' + esc(o.bg) + '"/>';
    svg += '<path d="' + d.join("") + '" fill="' + fillRef + '"' + (o.shape === "square" ? ' shape-rendering="crispEdges"' : "") + "/>";
    svg += '<path d="' + eo + '" fill="' + outerC + '" fill-rule="evenodd"/>';
    svg += '<path d="' + ei + '" fill="' + innerC + '"/>';
    if (hole) {
      var X0 = pad + hole.lo, S = hole.s;
      svg += '<rect x="' + f(X0 + 0.15) + '" y="' + f(X0 + 0.15) + '" width="' + f(S - 0.3) + '" height="' + f(S - 0.3) + '" rx="' + f(S * 0.22) + '" fill="' + (o.transparent ? "#ffffff" : esc(o.bg)) + '"/>';
      if (o.logoType === "emoji") svg += '<text x="' + f(X0 + S / 2) + '" y="' + f(X0 + S / 2) + '" font-size="' + f(S * 0.62) + '" text-anchor="middle" dominant-baseline="central" font-family="Apple Color Emoji,Segoe UI Emoji,Noto Color Emoji,sans-serif">' + esc(o.logoValue) + "</text>";
      else if (o.logoType === "image") svg += '<image href="' + esc(o.logoValue) + '" xlink:href="' + esc(o.logoValue) + '" x="' + f(X0 + S * 0.12) + '" y="' + f(X0 + S * 0.12) + '" width="' + f(S * 0.76) + '" height="' + f(S * 0.76) + '" preserveAspectRatio="xMidYMid meet"/>';
    }
    if (o.caption) {
      var len = Array.from(o.caption).length, size = Math.min(2.4, (W * 0.88) / (len * 0.62));
      svg += '<text x="' + f(W / 2) + '" y="' + f(W + 1.9) + '" font-size="' + f(size) + '" font-weight="800" text-anchor="middle" dominant-baseline="central" letter-spacing="0.05" font-family="system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif" fill="' + fillRef + '">' + esc(o.caption) + "</text>";
    }
    return svg + "</svg>";
  }

  return { payload: payload, render: render, check: check, PRESETS: PRESETS, DEFAULTS: DEFAULTS, withDefaults: withDefaults, contrast: contrast, matrix: matrix };
})(typeof qrcode !== "undefined" ? qrcode : require("./qrcode.js"));
if (typeof module !== "undefined") module.exports = QRStudio;
