import test from "node:test";
import assert from "node:assert/strict";
import { parseDocument } from "../src/parser.js";
import { renderPage } from "../src/render.js";

test("renders components, navigation, and safe inline markdown", () => {
  const page = parseDocument(`---\ntitle: Home\nslug: index\n---\n::: hero title="Hello <world>" cta="Email me" href=mailto:hi@example.com\nI make **useful** things.\n:::`);
  const html = renderPage(page, { title: "Timo", socials: "GitHub | https://github.com/timo" }, [page]);
  assert.match(html, /Hello &lt;world&gt;/);
  assert.match(html, /I make <strong>useful<\/strong> things/);
  assert.match(html, /href="mailto:hi@example.com"/);
  assert.match(html, /aria-label="Primary"/);
});

test("neutralizes unsafe links", () => {
  const page = parseDocument("[nope](javascript:alert(1))");
  assert.match(renderPage(page, { title: "Site" }, [page]), /href="#"/);
});
