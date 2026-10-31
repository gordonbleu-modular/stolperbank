#!/usr/bin/env node
/**
 * Nitro's GitHub Pages build prerenders index.html, then exits with an error
 * while packaging a server that Pages cannot run. The HTML is already valid
 * except for root-absolute asset URLs (`/./assets/...`), which break under
 * https://user.github.io/<repo>/. Rewrite those to relative URLs.
 */
import { readdir, readFile, writeFile, copyFile, stat } from "node:fs/promises";
import { join, extname } from "node:path";

const root = join(process.cwd(), ".output", "public");

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(path)));
    else files.push(path);
  }
  return files;
}

function relativize(text) {
  return text.replaceAll("/./", "./").replace(/((?:href|src)=["'])\/(?!\/)/g, "$1./");
}

const indexPath = join(root, "index.html");
await stat(indexPath);
let changed = 0;
for (const file of await walk(root)) {
  const ext = extname(file);
  if (ext !== ".html" && ext !== ".js" && ext !== ".css") continue;
  const original = await readFile(file, "utf8");
  const next = relativize(original);
  if (next !== original) {
    await writeFile(file, next);
    changed += 1;
  }
}
await copyFile(indexPath, join(root, "404.html"));
await writeFile(join(root, ".nojekyll"), "");
console.log(`[pages] relativized ${changed} file(s); wrote 404.html and .nojekyll`);
