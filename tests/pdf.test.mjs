import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { PDFDocument, PDFName, PDFArray } from "pdf-lib";
import { makePdf } from "../src/pdf.js";
import { exampleCard } from "../src/core.js";
import manifest from "../src/pdf-font-manifest.json" with { type: "json" };
const font = readFileSync(
  new URL(`../public${manifest.fallbackUrl}`, import.meta.url),
);
for (const kind of ["guard", "travel"])
  test(`PDF ${kind}: CJK, multipage, links and embedded text`, async () => {
    const d = exampleCard(kind);
    d.hotline = "+852 0000 0000";
    d.policies[0].hotline = "+852 0000 0000";
    d.reviewed = "2026-09-27";
    d.agentPhone = "+852 0000 0000";
    d.contacts = [
      { name: "示例親友", phone: "+852 0000 0000" },
      { name: "測試聯絡人", phone: "+852 0000 0000" },
    ];
    if (kind === "guard") {
      d.name = "陳小明・長姓名繁體中文測試";
      d.policies = Array.from({ length: 3 }, () => ({
        ...d.policies[0],
        plan: "長計劃名稱測試，中文標點及內容自動換行。".repeat(10),
      }));
      d.health = "示例備註（虛構），測試分頁。\n".repeat(30);
    }
    const bytes = await makePdf(d, kind, font);
    const doc = await PDFDocument.load(bytes);
    assert.ok(doc.getPageCount() >= (kind === "guard" ? 3 : 1));
    const links = doc
      .getPages()
      .reduce(
        (n, p) =>
          n + (p.node.lookupMaybe(PDFName.of("Annots"), PDFArray)?.size() || 0),
        0,
      );
    assert.ok(links >= 3);
    assert.ok(bytes.length > 1000);
    mkdirSync("artifacts", { recursive: true });
    writeFileSync(`artifacts/${kind}.pdf`, bytes);
  });
test("unsupported characters return explicit error rather than corrupting output", async () => {
  await assert.rejects(
    makePdf({ ...exampleCard("guard"), name: "😀" }, "guard", font),
    /字型未支援/,
  );
});
