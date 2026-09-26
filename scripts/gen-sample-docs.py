"""Generates the watermarked demo documents in public/demo/docs (SAMPLE / EXEMPLE).

Fictional people and organizations only. Run: python3 scripts/gen-sample-docs.py (needs Pillow).
The matching extraction fixtures are src/data/fixtures/doccheck-*.json.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent.parent / "public" / "demo" / "docs"
FONT_DIR = Path("/System/Library/Fonts/Supplemental")
W, H = 1240, 1754  # A4 at 150 dpi


def font(size, bold=False):
    name = "Arial Bold.ttf" if bold else "Arial.ttf"
    try:
        return ImageFont.truetype(str(FONT_DIR / name), size)
    except OSError:
        return ImageFont.load_default(size)


def watermark(img):
    layer = Image.new("RGBA", (W * 2, H * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    f = font(150, bold=True)
    for i, y in enumerate(range(0, H * 2, 420)):
        d.text((120 + (i % 2) * 300, y), "SAMPLE / EXEMPLE", font=f, fill=(200, 16, 46, 60))
    layer = layer.rotate(30, center=(W, H)).crop((W // 2, H // 2, W // 2 + W, H // 2 + H))
    img.alpha_composite(layer)
    banner = ImageDraw.Draw(img)
    banner.rectangle((0, 0, W, 70), fill=(200, 16, 46, 255))
    banner.text((40, 18), "SAMPLE / EXEMPLE: fictional document for the Portage demo. Not a real record.",
                font=font(28, bold=True), fill=(255, 255, 255, 255))


def page(title, org, lines):
    img = Image.new("RGBA", (W, H), (255, 255, 255, 255))
    d = ImageDraw.Draw(img)
    d.text((110, 150), org, font=font(40, bold=True), fill=(20, 20, 20, 255))
    d.line((110, 215, W - 110, 215), fill=(120, 120, 120, 255), width=2)
    d.text((110, 260), title, font=font(46, bold=True), fill=(20, 20, 20, 255))
    y = 370
    for line in lines:
        d.text((110, y), line, font=font(30), fill=(40, 40, 40, 255))
        y += 52 if line else 30
    watermark(img)
    return img.convert("RGB")


def save(img, stem):
    OUT.mkdir(parents=True, exist_ok=True)
    img.save(OUT / f"{stem}.png", optimize=True)
    img.save(OUT / f"{stem}.pdf", resolution=150)


save(page(
    "Employment Verification",
    "Sample City Hospital, Pune (fictional)",
    [
        "Date: 31 July 2024",
        "",
        "To whom it may concern,",
        "",
        "This letter confirms that Priya Anand Deshpande was employed",
        "at Sample City Hospital as a Staff Nurse, Intensive Care Unit,",
        "from 1 June 2016 to 31 July 2024 (full time, paid).",
        "",
        "Duties included direct care of critically ill adult patients,",
        "medication administration and ventilator monitoring.",
        "",
        "Signed,",
        "Nursing Superintendent (fictional)",
    ],
), "sample-employment-letter")

save(page(
    "Police Criminal Record Check",
    "Sample Police Records Office (fictional)",
    [
        "Certificate number: SAMPLE-0000",
        "Date of issue: 1 September 2026",
        "",
        "Name: Priya Deshpande",
        "",
        "Result: No criminal record found.",
        "",
        "This certificate reflects records held on the date of issue.",
        "",
        "Records Officer (fictional)",
    ],
), "sample-police-check")
print("written to", OUT)
