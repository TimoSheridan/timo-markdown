import { LanguageError } from "./errors.js";

function sourceLines(source) {
  const lines = [];
  let start = 0;

  while (start <= source.length) {
    let end = start;
    while (end < source.length && source[end] !== "\n" && source[end] !== "\r") {
      end += 1;
    }

    let next = end;
    if (source[next] === "\r" && source[next + 1] === "\n") {
      next += 2;
    } else if (next < source.length) {
      next += 1;
    }

    lines.push({ text: source.slice(start, end), next });
    if (next >= source.length) {
      break;
    }
    start = next;
  }

  return lines;
}

function schemaEntries(schema) {
  return schema instanceof Map ? schema : new Map(Object.entries(schema));
}

function unquote(value) {
  if (value.length < 2) {
    return value;
  }

  const quote = value[0];
  if ((quote === '"' || quote === "'") && value.at(-1) === quote) {
    return value.slice(1, -1);
  }

  return value;
}

export function parseFrontMatter(source, path, schema) {
  const lines = sourceLines(source);
  if (lines[0].text !== "---") {
    throw new LanguageError(path, 1, 1, "E_MISSING_META", "expected front matter starting with ---");
  }

  const definitions = schemaEntries(schema);
  const metadata = {};
  const seen = new Set();
  let closingIndex = -1;

  for (let index = 1; index < lines.length; index += 1) {
    const { text: line } = lines[index];
    const lineNumber = index + 1;

    if (line === "---") {
      closingIndex = index;
      break;
    }
    if (line.trim() === "") {
      continue;
    }

    const match = /^([a-z][a-z0-9-]*):([ \t]*)(.*)$/.exec(line);
    if (!match) {
      throw new LanguageError(path, lineNumber, 1, "E_UNKNOWN_META", "expected metadata in key: value form");
    }

    const [, key, spacing, untrimmedValue] = match;
    if (!definitions.has(key)) {
      throw new LanguageError(path, lineNumber, 1, "E_UNKNOWN_META", `unknown metadata key ${JSON.stringify(key)}`);
    }
    if (seen.has(key)) {
      throw new LanguageError(path, lineNumber, 1, "E_DUPLICATE_META", `duplicate metadata key ${JSON.stringify(key)}`);
    }

    seen.add(key);
    const definition = definitions.get(key) ?? {};
    const rawValue = untrimmedValue.trimEnd();
    const value = unquote(rawValue);
    const location = {
      path,
      line: lineNumber,
      column: key.length + 2 + spacing.length,
    };
    metadata[key] = definition.parse ? definition.parse(value, location) : value;
  }

  if (closingIndex === -1) {
    throw new LanguageError(path, lines.length, 1, "E_MISSING_META", "expected closing front-matter delimiter ---");
  }

  for (const [key, definition] of definitions) {
    if (definition.required && !seen.has(key)) {
      throw new LanguageError(path, 1, 1, "E_MISSING_META", `missing required metadata key ${JSON.stringify(key)}`);
    }
  }

  return {
    metadata,
    body: source.slice(lines[closingIndex].next),
    bodyStartLine: closingIndex + 2,
  };
}
