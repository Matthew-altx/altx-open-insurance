import { cardSections, TITLES } from "./core.js";

export const PDF_COPY = {
  example: "虛構範例 · 不可用作真實保障文件",
  private: "個人資料文件 · 請妥善保存",
  footer: "ALTX 工具製作 · 產生日期",
};

// Used both for font selection and PDF validation. No text leaves the device.
export function pdfText(data, kind) {
  return [
    TITLES[kind],
    data.example ? PDF_COPY.example : PDF_COPY.private,
    PDF_COPY.footer,
    "0123456789年月日：/ 未提供",
    ...cardSections(data, kind).flatMap((section) => [
      section.title,
      ...section.rows.flatMap((row) => row.slice(0, 2)),
    ]),
  ].join("\n");
}
