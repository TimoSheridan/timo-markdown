import test from 'node:test';
import assert from 'node:assert/strict';

import { parseFooter, parseHome, parseReads, parseSite } from '../src/parser.js';

const site = `---
language: en
title: timo
description: butter don't drizzle like that
url: https://timosheridan.com/
social-image: /assets/timosyrup.jpg
twitter-site: "@mustbesyrup"
portrait: /assets/timo.png
portrait-alt: "portrait of timo"
---
`;

const home = `## Writing

- [Essay](https://example.com/essay)

## Press

- [Launch](https://example.com/launch)

:::latest-reads
:::

## Contact

- [Email](mailto:me@example.com)
`;

const reads = `---
home-count: 2
home-heading: Reads
page-heading: Recent reads
---

- Book one
- Book two
- Book three
`;

const footer = `:::ticker direction=forward
- {{ one- | two- }}time founder
:::

:::ticker direction=reverse
- tea drinker
:::

:::ticker direction=forward
- midnight {{ coder | snacker }}
:::

:::ticker direction=reverse
- road-tripper
:::
`;

test('parses site metadata into renderer-friendly names', () => {
  assert.deepEqual(parseSite(site), {
    language: 'en',
    title: 'timo',
    description: "butter don't drizzle like that",
    url: 'https://timosheridan.com/',
    socialImage: '/assets/timosyrup.jpg',
    twitterSite: '@mustbesyrup',
    portrait: '/assets/timo.png',
    portraitAlt: 'portrait of timo',
  });
});

test('rejects empty required metadata at its value', () => {
  assert.throws(
    () => parseSite(site.replace('title: timo', 'title:')),
    (caught) => caught.code === 'E_MISSING_META' && caught.line === 3 && caught.column === 7,
  );
});

test('locates unexpected site body content after blank lines', () => {
  assert.throws(
    () => parseSite(`${site}\n\nnot allowed\n`),
    (caught) => caught.code === 'E_UNEXPECTED_BODY' && caught.line === 13,
  );
});

test('parses the fixed home block order', () => {
  const parsed = parseHome(home);
  assert.deepEqual(parsed.blocks.map((block) => block.type), [
    'section',
    'section',
    'latest-reads',
    'section',
  ]);
  assert.deepEqual(parsed.blocks.filter((block) => block.type === 'section').map((block) => block.title), [
    'Writing',
    'Press',
    'Contact',
  ]);
});

test('rejects reordered home sections', () => {
  assert.throws(
    () => parseHome(home.replace('## Writing', '## Notes')),
    (caught) => caught.code === 'E_BAD_HOME',
  );
});

test('parses one canonical reading list', () => {
  const parsed = parseReads(reads);
  assert.equal(parsed.homeCount, 2);
  assert.equal(parsed.entries.length, 3);
  assert.equal(parsed.entries[2][0].value, 'Book three');
});

test('validates home-count against the list', () => {
  assert.throws(
    () => parseReads(reads.replace('home-count: 2', 'home-count: 4')),
    (caught) => caught.code === 'E_BAD_HOME_COUNT',
  );
});

test('locates an overlarge home-count when metadata is reordered', () => {
  const reordered = reads
    .replace('home-count: 2\nhome-heading: Reads', 'home-heading: Reads\nhome-count: 4');
  assert.throws(
    () => parseReads(reordered),
    (caught) => caught.code === 'E_BAD_HOME_COUNT' && caught.line === 3 && caught.column === 13,
  );
});

test('parses four alternating ticker rows', () => {
  const parsed = parseFooter(footer);
  assert.deepEqual(parsed.rows.map((row) => row.direction), ['forward', 'reverse', 'forward', 'reverse']);
  assert.deepEqual(parsed.rows[0].items[0][0].choices, ['one-', 'two-']);
});

test('rejects a footer with the wrong row count', () => {
  assert.throws(
    () => parseFooter(footer.slice(0, footer.lastIndexOf(':::ticker direction=reverse'))),
    (caught) => caught.code === 'E_TICKER_COUNT',
  );
});

test('rejects non-alternating directions', () => {
  assert.throws(
    () => parseFooter(footer.replace(':::ticker direction=reverse', ':::ticker direction=forward')),
    (caught) => caught.code === 'E_TICKER_DIRECTION',
  );
});
