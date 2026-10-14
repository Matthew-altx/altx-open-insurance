import { execFileSync } from "node:child_process";
import { readFileSync, lstatSync, statSync, rmSync } from "node:fs";
const files = JSON.parse(readFileSync("PUBLIC_FILES.json", "utf8"));
if (!Array.isArray(files) || new Set(files).size !== files.length)
  throw new Error("Invalid public file list");
for (const file of files) {
  if (typeof file !== "string" || !/^[a-zA-Z0-9_.\/-]+$/.test(file))
    throw new Error("Invalid public path");
  const parts = file.split("/");
  if (parts.some((p) => !p || p === "." || p === ".."))
    throw new Error("Unsafe public path: " + file);
  for (let i = 1; i <= parts.length; i++)
    if (lstatSync(parts.slice(0, i).join("/")).isSymbolicLink())
      throw new Error("Symbolic link not allowed: " + file);
  if (!lstatSync(file).isFile()) throw new Error("Not a file: " + file);
}
const archive = "dist/altx-open-insurance-source.zip";
rmSync(archive, { force: true });
execFileSync("zip", ["-q", archive, ...files]);
if (statSync(archive).size > 25 * 1024 * 1024)
  throw new Error("Source exceeds Pages file limit");
console.log(
  `Source archive built with ${files.length} explicitly allowed files.`,
);
