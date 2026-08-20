import { LanguageError } from './errors.js';
import { parseFrontMatter } from './frontmatter.js';
import { parseInline, parseTickerInline } from './inline.js';

const SITE_KEYS = [
  'language',
  'title',
  'description',
  'url',
  'social-image',
  'twitter-site',
  'portrait',
  'portrait-alt',
];

const READS_KEYS = ['home-count', 'home-heading', 'page-heading'];

function requiredStrings(keys) {
  return Object.fromEntries(keys.map((key) => [key, {
    required: true,
    parse(value, location) {
      if (value === '') {
        throw error(location.path, location.line, location.column, 'E_MISSING_META', `${key} cannot be empty`);
      }
      return value;
    },
  }]));
}

function linesOf(source, startLine = 1) {
  return source.replaceAll('\r\n', '\n').split('\n').map((text, index) => ({
    text,
    line: startLine + index,
  }));
}

function skipBlanks(lines, index) {
  while (index < lines.length && lines[index].text.trim() === '') index += 1;
  return index;
}

function error(path, line, column, code, message) {
  return new LanguageError(path, line, column, code, message);
}

function parseBullets(lines, start, path, code, message) {
  const items = [];
  let index = start;
  while (index < lines.length) {
    index = skipBlanks(lines, index);
    if (index >= lines.length || !lines[index].text.startsWith('- ')) break;
    const { text, line } = lines[index];
    if (text.slice(2).trim() === '') throw error(path, line, 1, code, message);
    items.push({
      line,
      inline: parseInline(text.slice(2), { path, line, column: 3 }),
    });
    index += 1;
  }
  if (items.length === 0) {
    const found = lines[start] ?? lines.at(-1) ?? { line: 1 };
    throw error(path, found.line, 1, code, message);
  }
  return { items, index };
}

function parseSection(lines, start, path, title) {
  const index = skipBlanks(lines, start);
  const found = lines[index];
  if (!found || found.text !== `## ${title}`) {
    throw error(
      path,
      found?.line ?? lines.at(-1)?.line ?? 1,
      1,
      'E_BAD_HOME',
      `expected the ${title} section`,
    );
  }
  const parsed = parseBullets(
    lines,
    index + 1,
    path,
    'E_BAD_HOME',
    `${title} must contain at least one bullet`,
  );
  return {
    block: { type: 'section', title, items: parsed.items.map((item) => item.inline) },
    index: parsed.index,
  };
}

export function parseSite(source, path = 'content/site.md') {
  const parsed = parseFrontMatter(source, path, requiredStrings(SITE_KEYS));
  if (parsed.body.trim() !== '') {
    const bodyLine = linesOf(parsed.body, parsed.bodyStartLine)
      .find((line) => line.text.trim() !== '');
    throw error(path, bodyLine.line, 1, 'E_UNEXPECTED_BODY', 'site metadata cannot have body content');
  }

  try {
    const url = new URL(parsed.metadata.url);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('bad protocol');
  } catch {
    const line = source.replaceAll('\r\n', '\n').split('\n')
      .findIndex((entry) => entry.startsWith('url:')) + 1;
    throw error(path, line || 1, 1, 'E_BAD_URL', 'url must be an absolute HTTP(S) URL');
  }

  return {
    language: parsed.metadata.language,
    title: parsed.metadata.title,
    description: parsed.metadata.description,
    url: parsed.metadata.url,
    socialImage: parsed.metadata['social-image'],
    twitterSite: parsed.metadata['twitter-site'],
    portrait: parsed.metadata.portrait,
    portraitAlt: parsed.metadata['portrait-alt'],
  };
}

export function parseHome(source, path = 'content/home.md') {
  const lines = linesOf(source);
  const readsMarkers = lines.filter((line) => line.text === ':::latest-reads');
  if (readsMarkers.length !== 1) {
    throw error(
      path,
      readsMarkers[1]?.line ?? readsMarkers[0]?.line ?? 1,
      1,
      'E_LATEST_READS_COUNT',
      'home must contain exactly one latest-reads block',
    );
  }

  let parsed = parseSection(lines, 0, path, 'Writing');
  const blocks = [parsed.block];
  parsed = parseSection(lines, parsed.index, path, 'Press');
  blocks.push(parsed.block);

  let index = skipBlanks(lines, parsed.index);
  const marker = lines[index];
  if (!marker || marker.text !== ':::latest-reads') {
    const code = marker?.text.startsWith(':::') ? 'E_UNKNOWN_BLOCK' : 'E_BAD_HOME';
    throw error(path, marker?.line ?? 1, 1, code, 'expected the latest-reads block');
  }
  index = skipBlanks(lines, index + 1);
  if (!lines[index] || lines[index].text !== ':::') {
    throw error(path, marker.line, 1, 'E_UNCLOSED_BLOCK', 'latest-reads block is not closed');
  }
  blocks.push({ type: 'latest-reads' });

  parsed = parseSection(lines, index + 1, path, 'Contact');
  blocks.push(parsed.block);
  index = skipBlanks(lines, parsed.index);
  if (index < lines.length) {
    const code = lines[index].text.startsWith(':::') ? 'E_UNKNOWN_BLOCK' : 'E_BAD_HOME';
    throw error(path, lines[index].line, 1, code, 'unexpected content after the Contact section');
  }
  return { blocks };
}

export function parseReads(source, path = 'content/reads.md') {
  const schema = requiredStrings(READS_KEYS);
  let homeCountLocation;
  schema['home-count'].parse = (value, location) => {
    homeCountLocation = location;
    if (!/^[1-9]\d*$/.test(value)) {
      throw error(location.path, location.line, location.column, 'E_BAD_HOME_COUNT', 'home-count must be a positive integer');
    }
    return Number(value);
  };
  const parsed = parseFrontMatter(source, path, schema);
  const lines = linesOf(parsed.body, parsed.bodyStartLine);
  const bullets = parseBullets(
    lines,
    0,
    path,
    'E_BAD_HOME_COUNT',
    'reads must contain at least one bullet',
  );
  const remainder = skipBlanks(lines, bullets.index);
  if (remainder < lines.length) {
    throw error(path, lines[remainder].line, 1, 'E_UNKNOWN_BLOCK', 'reads accepts one bullet list only');
  }
  if (parsed.metadata['home-count'] > bullets.items.length) {
    throw error(
      path,
      homeCountLocation.line,
      homeCountLocation.column,
      'E_BAD_HOME_COUNT',
      'home-count cannot exceed the number of reads',
    );
  }
  return {
    homeCount: parsed.metadata['home-count'],
    homeHeading: parsed.metadata['home-heading'],
    pageHeading: parsed.metadata['page-heading'],
    entries: bullets.items.map((item) => item.inline),
  };
}

export function parseFooter(source, path = 'content/footers/home.md') {
  const lines = linesOf(source);
  const rows = [];
  let index = 0;

  while ((index = skipBlanks(lines, index)) < lines.length) {
    const opening = lines[index];
    const match = /^:::ticker(?:\s+direction=(\S+))?$/.exec(opening.text);
    if (!match) {
      const code = opening.text.startsWith(':::') ? 'E_UNKNOWN_BLOCK' : 'E_TICKER_COUNT';
      throw error(path, opening.line, 1, code, 'expected a ticker block');
    }
    const direction = match[1];
    if (!['forward', 'reverse'].includes(direction)) {
      throw error(path, opening.line, 1, 'E_TICKER_DIRECTION', 'ticker direction must be forward or reverse');
    }
    index += 1;
    const items = [];
    let closed = false;
    while (index < lines.length) {
      const current = lines[index];
      if (current.text === ':::') {
        closed = true;
        index += 1;
        break;
      }
      if (current.text.trim() === '') {
        index += 1;
        continue;
      }
      if (!current.text.startsWith('- ')) {
        throw error(path, current.line, 1, 'E_UNKNOWN_BLOCK', 'ticker rows contain phrase bullets only');
      }
      if (current.text.slice(2).trim() === '') {
        throw error(path, current.line, 1, 'E_EMPTY_TICKER', 'ticker phrase cannot be empty');
      }
      items.push(parseTickerInline(current.text.slice(2), { path, line: current.line, column: 3 }));
      index += 1;
    }
    if (!closed) throw error(path, opening.line, 1, 'E_UNCLOSED_BLOCK', 'ticker block is not closed');
    if (items.length === 0) throw error(path, opening.line, 1, 'E_EMPTY_TICKER', 'ticker must contain at least one phrase');
    rows.push({ direction, items, sourceLine: opening.line });
  }

  if (rows.length !== 4) {
    throw error(path, lines.at(-1)?.line ?? 1, 1, 'E_TICKER_COUNT', 'footer must contain exactly four ticker rows');
  }
  const expected = ['forward', 'reverse', 'forward', 'reverse'];
  rows.forEach((row, rowIndex) => {
    if (row.direction !== expected[rowIndex]) {
      throw error(path, row.sourceLine, 1, 'E_TICKER_DIRECTION', 'ticker directions must alternate forward and reverse');
    }
  });
  return {
    rows: rows.map(({ direction, items }) => ({ direction, items })),
  };
}
