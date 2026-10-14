"""Regenerate the shipped PDF subset; normal npm builds use the checked-in files.

Requires fonttools[woff] 4.60.2 and brotli 1.2.0. The unmodified source OTF and
its OFL license remain available for reproduction. Runtime fonts use TrueType
outlines because pdf-lib CFF subset embedding fails in some PDF readers.
Cu2Qu conversion uses a maximum error of 1/1000 em and preserves advance widths.
"""

import base64
import hashlib
import json
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.ttLib.woff2 import WOFF2FlavorData
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.cu2quPen import Cu2QuPen

def as_truetype(f, family):
    glyph_set=f.getGlyphSet()
    glyphs={}
    for name in f.getGlyphOrder():
        pen=TTGlyphPen(None)
        glyph_set[name].draw(Cu2QuPen(pen, max_err=1.0, reverse_direction=True))
        glyphs[name]=pen.glyph()
    b=FontBuilder(f['head'].unitsPerEm,isTTF=True)
    b.setupGlyphOrder(f.getGlyphOrder())
    b.setupCharacterMap(f.getBestCmap())
    b.setupGlyf(glyphs)
    b.setupHorizontalMetrics(f['hmtx'].metrics)
    b.setupHorizontalHeader(ascent=f['hhea'].ascent,descent=f['hhea'].descent,lineGap=f['hhea'].lineGap)
    b.setupOS2(sTypoAscender=f['OS/2'].sTypoAscender,sTypoDescender=f['OS/2'].sTypoDescender,sTypoLineGap=f['OS/2'].sTypoLineGap,usWinAscent=f['OS/2'].usWinAscent,usWinDescent=f['OS/2'].usWinDescent)
    b.setupNameTable({'familyName':family,'styleName':'Regular','uniqueFontIdentifier':family+' Regular','fullName':family+' Regular','psName':family.replace(' ','')+'-Regular','version':'Version 1.0','copyright':f['name'].getDebugName(0) or '', 'licenseDescription':f['name'].getDebugName(13) or 'SIL Open Font License 1.1','licenseInfoURL':'https://openfontlicense.org/'})
    b.setupPost(keepGlyphNames=False)
    b.setupMaxp()
    for tag in ('GSUB','GPOS','GDEF'):
        if tag in f: b.font[tag]=f[tag]
    return b.font



ROOT = Path(__file__).resolve().parent.parent
source = ROOT / "public/fonts/NotoSansCJKtc-Regular.otf"
font = TTFont(source)
supported = set(font.getBestCmap())
characters = set(range(32, 256))
for first in range(0x81, 0xFF):
    for second in range(0x40, 0xFF):
        try:
            characters.update(ord(c) for c in bytes([first, second]).decode("big5"))
        except UnicodeDecodeError:
            pass
for start, end in [(0x2000, 0x2070), (0x3000, 0x3100), (0xFF00, 0xFFF0)]:
    characters.update(range(start, end))
for path in (ROOT / "src").glob("*"):
    if path.suffix in {".js", ".jsx"}:
        characters.update(ord(c) for c in path.read_text())
characters &= supported

options = subset.Options()
options.flavor = "woff2"
options.hinting = False
options.layout_features = ["ccmp"]
subsetter = subset.Subsetter(options=options)
subsetter.populate(unicodes=characters)
subsetter.subset(font)
def publish(font, label):
    # fontkit emits short loca offsets in subsets; glyph boundaries must be even.
    font["glyf"].padding = 4
    font.flavor = "woff2"
    # pdf-lib/fontkit cannot subset transformed WOFF2 glyf/loca reliably.
    font.flavorData = WOFF2FlavorData(transformedTables=set())
    temporary = ROOT / f"public/fonts/ALTXTC-{label}.woff2"
    font.save(temporary)
    digest = hashlib.sha256(temporary.read_bytes()).hexdigest()[:12]
    output = temporary.with_name(f"ALTXTC-{label}-{digest}.woff2")
    temporary.replace(output)
    return output

output = publish(as_truetype(font, "ALTX TC Service Subset"), "common")
fallback = publish(as_truetype(TTFont(source), "ALTX TC Service Full"), "full")

# A BMP bitset is compact on the wire and keeps all text selection on-device.
actual = set(TTFont(output).getBestCmap())
coverage = bytearray((max(actual) >> 3) + 1)
for point in actual:
    coverage[point >> 3] |= 1 << (point & 7)
manifest = {
    "url": "/fonts/" + output.name,
    "bytes": output.stat().st_size,
    "coverage": base64.b64encode(coverage).decode("ascii"),
    "fallbackUrl": "/fonts/" + fallback.name,
    "fallbackBytes": fallback.stat().st_size,
}
(ROOT / "src/pdf-font-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
print(json.dumps({"file": output.name, "glyphs": len(actual), "bytes": manifest["bytes"], "originalBytes": source.stat().st_size}))
