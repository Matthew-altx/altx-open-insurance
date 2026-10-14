import { PDFDocument, rgb, PDFName, PDFString, PDFArray } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { cardSections, TITLES } from "./core.js";
import { PDF_COPY, pdfText } from "./pdf-text.js";
export async function makePdf(data, kind, fontBytes) {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const font = await doc.embedFont(fontBytes, { subset: true });
  const supported = new Set(font.getCharacterSet());
  for (const c of pdfText(data, kind))
    if (!["\n", "\r", "\t"].includes(c) && !supported.has(c.codePointAt(0)))
      throw new Error(
        "PDF 字型未支援「" + c + "」，請移除 emoji 或改用文字後再匯出。",
      );
  const green = rgb(0.078, 0.235, 0.176),
    ink = rgb(0.12, 0.17, 0.15),
    grey = rgb(0.37, 0.42, 0.39);
  let page, y;
  const margin = 44,
    width = 507;
  function fresh() {
    page = doc.addPage([595, 842]);
    page.drawRectangle({ x: 0, y: 763, width: 595, height: 79, color: green });
    page.drawText("ALTX  /  " + TITLES[kind], {
      x: margin,
      y: 798,
      size: 20,
      font,
      color: rgb(1, 1, 1),
    });
    page.drawText(data.example ? PDF_COPY.example : PDF_COPY.private, {
      x: margin,
      y: 778,
      size: 10,
      font,
      color: rgb(0.86, 0.9, 0.86),
    });
    y = 740;
  }
  function ensure(h) {
    if (y - h < 62) fresh();
  }
  function line(text, size, color = ink, link = null) {
    const clean = String(text || "未提供").replace(/\t/g, "  ");
    for (const para of clean.split(/\r?\n/)) {
      let row = "";
      const render = () => {
        ensure(size + 9);
        page.drawText(row || " ", { x: margin, y, size, font, color });
        if (link) {
          const annotation = doc.context.register(
            doc.context.obj({
              Type: "Annot",
              Subtype: "Link",
              Rect: [
                margin,
                y - 3,
                margin + font.widthOfTextAtSize(row, size),
                y + size,
              ],
              Border: [0, 0, 0],
              A: { Type: "Action", S: "URI", URI: PDFString.of(link) },
            }),
          );
          const annots = page.node.lookupMaybe(PDFName.of("Annots"), PDFArray);
          if (annots) annots.push(annotation);
          else
            page.node.set(PDFName.of("Annots"), doc.context.obj([annotation]));
        }
        y -= size + 9;
      };
      for (const c of para) {
        if (font.widthOfTextAtSize(row + c, size) > width && row) {
          render();
          row = "";
        }
        row += c;
      }
      render();
    }
  }
  fresh();
  for (const section of cardSections(data, kind)) {
    ensure(75);
    y -= 5;
    line(section.title, 14, green);
    for (const [label, value, link] of section.rows)
      line(`${label}：${value || "未提供"}`, 12, ink, link);
    y -= 6;
  }
  const date = new Intl.DateTimeFormat("zh-HK", {
    timeZone: "Asia/Hong_Kong",
    dateStyle: "medium",
  }).format(new Date());
  doc.getPages().forEach((p, i) => {
    p.drawLine({
      start: { x: 44, y: 45 },
      end: { x: 551, y: 45 },
      thickness: 0.5,
      color: grey,
    });
    p.drawText(`${PDF_COPY.footer} ${date} · ${i + 1}/${doc.getPageCount()}`, {
      x: 44,
      y: 28,
      size: 9,
      font,
      color: grey,
    });
  });
  doc.setTitle(TITLES[kind]);
  doc.setProducer("ALTX Open Insurance · pdf-lib");
  return doc.save();
}
