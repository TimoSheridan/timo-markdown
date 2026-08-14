import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseDocument } from "./parser.js";
import { renderPage } from "./render.js";

export async function build({ source = "site", output = "dist" } = {}) {
  const sourceDir = path.resolve(source);
  const outputDir = path.resolve(output);
  const siteFile = path.join(sourceDir, "site.md");
  const site = parseDocument(await readFile(siteFile, "utf8"), siteFile).attributes;
  if (!site.title) throw new Error("site/site.md must define a title");
  const pageDir = path.join(sourceDir, "pages");
  const files = (await readdir(pageDir)).filter(file => file.endsWith(".md")).sort();
  const pages = await Promise.all(files.map(async file => {
    const document = parseDocument(await readFile(path.join(pageDir, file), "utf8"), file);
    document.attributes.slug ||= path.basename(file, ".md");
    document.attributes.title ||= document.attributes.slug;
    return document;
  }));
  validate(pages);
  await rm(outputDir, { recursive: true, force: true });
  await mkdir(path.join(outputDir, "assets"), { recursive: true });
  for (const page of pages.filter(page => !page.attributes.draft)) {
    const filename = page.attributes.slug === "index" ? "index.html" : `${page.attributes.slug}.html`;
    await writeFile(path.join(outputDir, filename), renderPage(page, site, pages));
  }
  await cp(new URL("./site.css", import.meta.url), path.join(outputDir, "assets/site.css"));
  try { await cp(path.join(sourceDir, "assets"), path.join(outputDir, "assets"), { recursive: true, force: true }); } catch (error) { if (error.code !== "ENOENT") throw error; }
  return { pages: pages.filter(page => !page.attributes.draft).length, output: outputDir };
}

function validate(pages) {
  const slugs = new Set();
  for (const page of pages) {
    if (!/^[a-z0-9-]+$/.test(page.attributes.slug)) throw new Error(`Invalid slug: ${page.attributes.slug}`);
    if (slugs.has(page.attributes.slug)) throw new Error(`Duplicate slug: ${page.attributes.slug}`);
    slugs.add(page.attributes.slug);
    for (const block of page.blocks) {
      if (block.type === "component" && block.name === "gallery") {
        for (const line of block.body.split("\n").filter(Boolean)) if (!line.split("|")[1]?.trim()) throw new Error(`${page.attributes.slug}: gallery images require alt text`);
      }
      if (block.type === "component" && block.attributes.image && !block.attributes.alt) throw new Error(`${page.attributes.slug}: component images require alt text`);
    }
  }
}
