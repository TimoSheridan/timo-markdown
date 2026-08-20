import assert from "node:assert/strict";
import test from "node:test";

import { LanguageError } from "../src/errors.js";
import { parseFrontMatter } from "../src/frontmatter.js";

test("LanguageError exposes its location and stable code", () => {
  const error = new LanguageError("content/site.md", 3, 5, "E_BAD_URL", "expected an absolute URL");

  assert.equal(error.message, "content/site.md:3:5 E_BAD_URL expected an absolute URL");
  assert.equal(error.path, "content/site.md");
  assert.equal(error.line, 3);
  assert.equal(error.column, 5);
  assert.equal(error.code, "E_BAD_URL");
  assert.equal(error.name, "LanguageError");
});

test("parses flat metadata, removes matching quotes, and preserves the body", () => {
  const source = [
    "---\r\n",
    "title: timo\r\n",
    "twitter-site: \"@mustbesyrup\"\r\n",
    "optional: 'kept simple'\r\n",
    "---\r\n",
    "\r\n",
    "- First read\r\n",
  ].join("");

  const parsed = parseFrontMatter(source, "content/reads.md", {
    title: { required: true },
    "twitter-site": { required: true },
    optional: { required: false },
  });

  assert.deepEqual(parsed.metadata, {
    title: "timo",
    "twitter-site": "@mustbesyrup",
    optional: "kept simple",
  });
  assert.equal(parsed.body, "\r\n- First read\r\n");
  assert.equal(parsed.bodyStartLine, 6);
});

test("passes the scalar and its source location to a schema parser", () => {
  let receivedLocation;
  const parsed = parseFrontMatter("---\nhome-count: 2\n---\n", "content/reads.md", {
    "home-count": {
      required: true,
      parse(value, location) {
        receivedLocation = location;
        return Number.parseInt(value, 10);
      },
    },
  });

  assert.equal(parsed.metadata["home-count"], 2);
  assert.deepEqual(receivedLocation, {
    path: "content/reads.md",
    line: 2,
    column: 13,
  });
});

test("rejects an unknown metadata key at its source line", () => {
  assert.throws(
    () => parseFrontMatter("---\ntitel: timo\n---\n", "content/site.md", { title: { required: true } }),
    (error) => {
      assert.equal(error.code, "E_UNKNOWN_META");
      assert.equal(error.message, 'content/site.md:2:1 E_UNKNOWN_META unknown metadata key "titel"');
      return true;
    },
  );
});

test("rejects duplicate metadata keys at the duplicate line", () => {
  assert.throws(
    () => parseFrontMatter("---\ntitle: first\ntitle: second\n---\n", "content/site.md", { title: {} }),
    (error) => {
      assert.equal(error.code, "E_DUPLICATE_META");
      assert.equal(error.line, 3);
      return true;
    },
  );
});

test("rejects absent required metadata", () => {
  assert.throws(
    () => parseFrontMatter("---\n---\n", "content/site.md", { title: { required: true } }),
    (error) => {
      assert.equal(error.code, "E_MISSING_META");
      assert.equal(error.message, 'content/site.md:1:1 E_MISSING_META missing required metadata key "title"');
      return true;
    },
  );
});

test("rejects missing front-matter delimiters", () => {
  assert.throws(
    () => parseFrontMatter("title: timo\n", "content/site.md", { title: {} }),
    (error) => error.code === "E_MISSING_META" && error.line === 1,
  );
  assert.throws(
    () => parseFrontMatter("---\ntitle: timo\n", "content/site.md", { title: {} }),
    (error) => error.code === "E_MISSING_META" && error.line === 2,
  );
});
