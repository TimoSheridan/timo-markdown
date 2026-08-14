import test from "node:test";
import assert from "node:assert/strict";
import { parseDocument } from "../src/parser.js";

test("parses frontmatter and standard markdown", () => {
  const doc = parseDocument(`---\ntitle: Work\norder: 2\n---\n# Selected work\n\nHello **there**.\n\n- One\n- Two`);
  assert.deepEqual(doc.attributes, { title: "Work", order: 2 });
  assert.deepEqual(doc.blocks.map(({ type }) => type), ["heading", "paragraph", "list"]);
});

test("parses a custom component and its options", () => {
  const doc = parseDocument(`::: project title="A useful thing" year=2026 featured=true\nProject description.\n:::`);
  assert.deepEqual(doc.blocks[0], {
    type: "component", name: "project",
    attributes: { title: "A useful thing", year: 2026, featured: true },
    body: "Project description."
  });
});

test("reports actionable source locations", () => {
  assert.throws(() => parseDocument("::: unknown\n:::", "pages/home.md"), /pages\/home\.md:1: Unknown component/);
  assert.throws(() => parseDocument("::: hero\nOops", "home.md"), /home\.md:1: Unclosed hero component/);
});
