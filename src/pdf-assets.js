import manifest from "./pdf-font-manifest.json" with { type: "json" };
import { pdfText } from "./pdf-text.js";

const coverage = Uint8Array.from(atob(manifest.coverage), (c) =>
  c.charCodeAt(0),
);

export function selectPdfFont(data, kind) {
  for (const character of pdfText(data, kind)) {
    if ("\r\n\t".includes(character)) continue;
    const point = character.codePointAt(0);
    if (!(coverage[point >> 3] & (1 << (point & 7))))
      return manifest.fallbackUrl;
  }
  return manifest.url;
}

export function createFontLoader(fetchFont = globalThis.fetch) {
  const downloads = new Map();
  return (data, kind) => {
    const url = selectPdfFont(data, kind);
    if (!downloads.has(url)) {
      const request = Promise.resolve()
        .then(() => fetchFont(url))
        .then(async (response) => {
          if (!response.ok) throw new Error("字型下載失敗，請檢查網絡後重試。");
          return response.arrayBuffer();
        })
        .catch((error) => {
          downloads.delete(url);
          throw error;
        });
      downloads.set(url, request);
    }
    return downloads.get(url);
  };
}

export const loadPdfFont = createFontLoader();
