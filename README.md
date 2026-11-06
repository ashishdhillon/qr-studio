# QR Studio ✨

Colourful, shareable QR codes from any link. One HTML file, no server, no tracking: everything runs in your browser.

- Gradient or solid dots, seven colour presets, custom background (or transparent)
- Dot shapes (square, rounded, dots, diamond) and corner-eye shapes (square, rounded, circle, leaf)
- Emoji or image in the centre, and a caption such as "SCAN ME"
- Live scannability check (contrast, border, dot size)
- Download PNG (2048 px) or SVG; copy a link that restores your exact style
- "Surprise me" for a random look

Open `index.html`, or host the folder on GitHub Pages.

## Develop

`src/engine.js` is the pure renderer (works in Node and the browser), `src/template.html` is the UI. `python3 build.py` inlines the engine and the QR library into one `index.html`.

## Tested

Sample styles in every shape, preset, centre-badge and caption combination are rendered and decoded with a real decoder (zxing-cpp), also at 220 px with blur (`tests/`). A decoder in a lab is not a phone: always test your own code before printing it.

## Licence

MIT. QR encoding uses [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) (MIT, Kazuhiko Arase). "QR Code" is a registered trademark of DENSO WAVE INCORPORATED.
