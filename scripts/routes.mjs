import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { paths, tools } from "../src/tools.js";

// Direct visits start fetching their own route immediately, in parallel with React.
// PDF code and fonts are dynamic imports and are deliberately not preloaded.
const manifest = JSON.parse(readFileSync("dist/.vite/manifest.json", "utf8"));
const template = readFileSync("dist/index.html", "utf8");
const routes = [
  ["/", "src/Home.jsx", "免費客戶服務工具"],
  ...tools.map((tool) => [paths[tool.id], "src/Workspace.jsx", tool.title]),
  ["/privacy", "src/InfoPage.jsx", "資料與私隱"],
  ["/open-source", "src/InfoPage.jsx", "免費開源工具"],
];

for (const [route, entry, title] of routes) {
  const visited = new Set();
  const scripts = new Set();
  const styles = new Set();
  function visit(key) {
    if (visited.has(key)) return;
    visited.add(key);
    const chunk = manifest[key];
    if (!chunk) throw new Error(`Missing route asset: ${key}`);
    scripts.add(chunk.file);
    chunk.css?.forEach((css) => styles.add(css));
    chunk.imports?.forEach(visit);
  }
  const entryName = entry
    .split("/")
    .at(-1)
    .replace(/\.jsx$/, "");
  const entryKey = manifest[entry]
    ? entry
    : Object.keys(manifest).find(
        (key) =>
          manifest[key].isDynamicEntry && manifest[key].name === entryName,
      );
  if (!entryKey) throw new Error(`Missing route entry: ${entry}`);
  visit(entryKey);
  const links = [
    ...[...scripts]
      .filter((file) => !template.includes(`src="/${file}"`))
      .map(
        (file) => `<link rel="modulepreload" crossorigin href="/${file}" />`,
      ),
    ...[...styles]
      .filter((file) => !template.includes(`href="/${file}"`))
      .map((file) => `<link rel="stylesheet" crossorigin href="/${file}" />`),
  ];
  const html = template
    .replace(
      /<title>.*?<\/title>/,
      `<title>${title}｜ALTX Open Insurance</title>`,
    )
    .replace("</head>", `  ${links.join("\n    ")}\n  </head>`);
  const dir = route === "/" ? "dist" : `dist${route}`;
  mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}/index.html`, html);
}
console.log(`Built ${routes.length} route documents with scoped preloads.`);
