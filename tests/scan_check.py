"""Render sample styles, rasterise them and check that a real decoder reads them.
Needs: node, rsvg-convert, and `pip install zxing-cpp opencv-python`.
Run from the repo root:  node tests/make_samples.js && python3 tests/scan_check.py
"""
import glob, os, subprocess, sys
import cv2, zxingcpp

OUT = "/tmp/qrout"
bad = []
for svg in sorted(glob.glob(OUT + "/*.svg")):
    png = svg[:-4] + ".png"
    subprocess.run(["rsvg-convert", "-w", "900", "-b", "white", svg, "-o", png], check=True)
    im = cv2.imread(png)
    small = cv2.GaussianBlur(cv2.resize(im, (220, int(im.shape[0] * 220 / im.shape[1])), interpolation=cv2.INTER_AREA), (3, 3), 0)
    if not zxingcpp.read_barcodes(im) or not zxingcpp.read_barcodes(small):
        bad.append(os.path.basename(svg))
print("failed:", bad or "none")
sys.exit(1 if bad else 0)
