import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { PDFDocument, PDFDict, PDFName, decodePDFRawStream } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { exampleCard } from "../src/core.js";
import { selectPdfFont, createFontLoader } from "../src/pdf-assets.js";
import { makePdf } from "../src/pdf.js";
import { pdfText } from "../src/pdf-text.js";
import manifest from "../src/pdf-font-manifest.json" with { type: "json" };

const compactBytes = readFileSync(
  new URL(`../public${manifest.url}`, import.meta.url),
);
const fullBytes = readFileSync(
  new URL(`../public${manifest.fallbackUrl}`, import.meta.url),
);
const compact = fontkit.create(compactBytes);
const originalBytes = readFileSync(
  new URL("../public/fonts/NotoSansCJKtc-Regular.otf", import.meta.url),
);
const original = fontkit.create(originalBytes);
const full = fontkit.create(fullBytes);

test("runtime PDF fonts use supported TrueType outlines and preserve full character coverage", () => {
  assert.ok(compact.directory.tables.glyf);
  assert.ok(full.directory.tables.glyf);
  assert.equal(compact.directory.tables.glyf.transformed, false);
  assert.equal(full.directory.tables.glyf.transformed, false);
  assert.ok(compact.loca.offsets.every((offset) => offset % 4 === 0));
  assert.ok(full.loca.offsets.every((offset) => offset % 4 === 0));
  assert.deepEqual(new Set(full.characterSet), new Set(original.characterSet));
});
const coverage = new Set(compact.characterSet);
const uncommonPoint = original.characterSet.find(
  (point) => point >= 0x3400 && !coverage.has(point),
);

test("compact PDF font preserves every advertised character and advance width", () => {
  assert.ok(compactBytes.length < originalBytes.length * 0.2);
  const bits = Uint8Array.from(atob(manifest.coverage), (char) =>
    char.charCodeAt(0),
  );
  for (let point = 0; point < bits.length * 8; point++) {
    assert.equal(
      Boolean(bits[point >> 3] & (1 << (point & 7))),
      coverage.has(point),
    );
  }
  for (const point of coverage) {
    assert.equal(
      compact.glyphForCodePoint(point).advanceWidth,
      original.glyphForCodePoint(point).advanceWidth,
    );
  }
});

for (const kind of ["guard", "travel"])
  test(`compact ${kind} PDF renders CJK, kana and punctuation`, async () => {
    const data = {
      ...exampleCard(kind),
      name: "陳小明・繁體中文",
      reviewed: "2026-10-13",
    };
    assert.equal(selectPdfFont(data, kind), manifest.url);
    const bytes = await makePdf(data, kind, compactBytes);
    const doc = await PDFDocument.load(bytes);
    assert.ok(doc.getPageCount() >= 1);
    const descriptor = doc.context
      .enumerateIndirectObjects()
      .map(([, object]) => object)
      .find(
        (object) =>
          object instanceof PDFDict && object.has(PDFName.of("FontFile2")),
      );
    assert.ok(descriptor, "TrueType font must be embedded as FontFile2");
    const embedded = decodePDFRawStream(
      descriptor.lookup(PDFName.of("FontFile2")),
    ).decode();
    assert.ok(
      embedded.length < 500000,
      "font subset must not include the full font",
    );
    const subset = fontkit.create(embedded);
    assert.ok(subset.numGlyphs > 100);
    assert.equal(subset.loca.offsets.length, subset.numGlyphs + 1);
    for (let id = 1; id < subset.numGlyphs; id++) {
      assert.doesNotThrow(
        () => subset.getGlyph(id).path.commands,
        `embedded glyph ${id} must decode`,
      );
    }
    mkdirSync("artifacts", { recursive: true });
    writeFileSync(`artifacts/${kind}-compact.pdf`, bytes);
  });

test("uncommon supported characters fall back without dropping text", async () => {
  assert.ok(uncommonPoint);
  assert.ok(full.hasGlyphForCodePoint(uncommonPoint));
  const data = {
    ...exampleCard("guard"),
    name: String.fromCodePoint(uncommonPoint),
  };
  assert.equal(selectPdfFont(data, "guard"), manifest.fallbackUrl);
  assert.ok(pdfText(data, "guard").includes(data.name));
  const bytes = await makePdf(data, "guard", fullBytes);
  assert.ok((await PDFDocument.load(bytes)).getPageCount() >= 1);
  writeFileSync("artifacts/guard-uncommon.pdf", bytes);
});

test("font downloads are shared across tools and failed requests can retry", async () => {
  const requests = [];
  let fail = true;
  const load = createFontLoader(async (url) => {
    requests.push(url);
    return { ok: !fail, arrayBuffer: async () => new ArrayBuffer(8) };
  });
  await assert.rejects(load(exampleCard("guard"), "guard"), /字型下載失敗/);
  fail = false;
  const [a, b] = await Promise.all([
    load(exampleCard("guard"), "guard"),
    load(exampleCard("travel"), "travel"),
  ]);
  assert.equal(a, b);
  assert.deepEqual(requests, [manifest.url, manifest.url]);
  await load(
    { ...exampleCard("guard"), name: String.fromCodePoint(uncommonPoint) },
    "guard",
  );
  assert.equal(requests.at(-1), manifest.fallbackUrl);
  assert.ok(
    requests.every((url) => url.startsWith("/fonts/") && !url.includes("?")),
  );
});
