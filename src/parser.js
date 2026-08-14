const COMPONENTS = new Set(["hero", "project", "gallery", "links", "quote", "contact"]);

export function parseDocument(source, filename = "document.md") {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const { attributes, nextLine } = parseFrontmatter(lines, filename);
  const blocks = [];
  let paragraph = [];

  const flushParagraph = () => {
    if (paragraph.length) blocks.push({ type: "paragraph", text: paragraph.join("\n") });
    paragraph = [];
  };

  for (let i = nextLine; i < lines.length; i += 1) {
    const line = lines[i];
    const directive = line.match(/^:::\s*([a-z][\w-]*)(?:\s+(.*))?$/);
    if (directive) {
      flushParagraph();
      const name = directive[1];
      if (!COMPONENTS.has(name)) throw syntaxError(filename, i + 1, `Unknown component "${name}"`);
      const body = [];
      const start = i + 1;
      while (++i < lines.length && lines[i] !== ":::") body.push(lines[i]);
      if (i === lines.length) throw syntaxError(filename, start, `Unclosed ${name} component`);
      blocks.push({ type: "component", name, attributes: parseArguments(directive[2] || "", filename, start), body: body.join("\n").trim() });
    } else if (/^#{1,3}\s+/.test(line)) {
      flushParagraph();
      const [, marks, text] = line.match(/^(#{1,3})\s+(.+)$/);
      blocks.push({ type: "heading", level: marks.length, text });
    } else if (/^[-*]\s+/.test(line)) {
      flushParagraph();
      const items = [line.replace(/^[-*]\s+/, "")];
      while (i + 1 < lines.length && /^[-*]\s+/.test(lines[i + 1])) items.push(lines[++i].replace(/^[-*]\s+/, ""));
      blocks.push({ type: "list", items });
    } else if (!line.trim()) {
      flushParagraph();
    } else {
      paragraph.push(line);
    }
  }
  flushParagraph();
  return { attributes, blocks };
}

function parseFrontmatter(lines, filename) {
  if (lines[0] !== "---") return { attributes: {}, nextLine: 0 };
  const attributes = {};
  let i = 1;
  for (; i < lines.length && lines[i] !== "---"; i += 1) {
    if (!lines[i].trim() || lines[i].trimStart().startsWith("#")) continue;
    const match = lines[i].match(/^([\w-]+):\s*(.*)$/);
    if (!match) throw syntaxError(filename, i + 1, "Expected frontmatter in key: value form");
    attributes[match[1]] = scalar(match[2]);
  }
  if (i === lines.length) throw syntaxError(filename, 1, "Unclosed frontmatter");
  return { attributes, nextLine: i + 1 };
}

function parseArguments(input, filename, line) {
  const result = {};
  const token = /([\w-]+)=(?:"([^"]*)"|'([^']*)'|(\S+))/g;
  let match;
  let consumed = "";
  while ((match = token.exec(input))) {
    result[match[1]] = scalar(match[2] ?? match[3] ?? match[4]);
    consumed += match[0];
  }
  if (input.replace(token, "").trim()) throw syntaxError(filename, line, "Component options must use key=value");
  return result;
}

function scalar(value) {
  const trimmed = value.trim();
  if (/^(true|false)$/.test(trimmed)) return trimmed === "true";
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  return trimmed.replace(/^("|')(.*)\1$/, "$2");
}

function syntaxError(filename, line, message) {
  return new SyntaxError(`${filename}:${line}: ${message}`);
}
