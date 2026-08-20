import test from 'node:test';
import assert from 'node:assert/strict';

import { parseInline, parseTickerInline } from '../src/inline.js';

const location = { path: 'example.md', line: 3, column: 3 };

test('parses the supported Markdown inline forms', () => {
  assert.deepEqual(parseInline('read [this](https://example.com), *please* and **enjoy**', location), [
    { type: 'text', value: 'read ' },
    { type: 'link', url: 'https://example.com', children: [{ type: 'text', value: 'this' }] },
    { type: 'text', value: ', ' },
    { type: 'emphasis', children: [{ type: 'text', value: 'please' }] },
    { type: 'text', value: ' and ' },
    { type: 'strong', children: [{ type: 'text', value: 'enjoy' }] },
  ]);
});

test('keeps balanced parentheses in link destinations', () => {
  assert.deepEqual(parseInline('[map](https://example.com/a_(b))', location), [
    { type: 'link', url: 'https://example.com/a_(b)', children: [{ type: 'text', value: 'map' }] },
  ]);
});

test('parses vertical alternatives without retaining formatting whitespace', () => {
  assert.deepEqual(parseTickerInline('{{ one- | two- }}time founder', location), [
    { type: 'vertical', choices: ['one-', 'two-'] },
    { type: 'text', value: 'time founder' },
  ]);
});

test('rejects malformed vertical alternatives with a located error', () => {
  assert.throws(
    () => parseTickerInline('midnight {{ coder }}', location),
    (caught) => caught.code === 'E_VERTICAL_CHOICES'
      && caught.line === 3
      && caught.column === 12,
  );
});

test('rejects raw HTML', () => {
  assert.throws(
    () => parseInline('hello <b>world</b>', location),
    (caught) => caught.code === 'E_RAW_HTML' && caught.column === 9,
  );
  assert.throws(
    () => parseInline('hello <!-- private -->', location),
    (caught) => caught.code === 'E_RAW_HTML',
  );
  assert.throws(
    () => parseInline('<!DOCTYPE html>', location),
    (caught) => caught.code === 'E_RAW_HTML',
  );
});
