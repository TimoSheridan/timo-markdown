import test from 'node:test';
import assert from 'node:assert/strict';

import { parseHome, parseReads, parseSite, renderInline, renderPages } from '../src/index.js';

const site = parseSite(`---
language: en
title: Timo & friends
description: butter don't drizzle like that
url: https://timosheridan.com/
social-image: /assets/timosyrup.jpg
twitter-site: "@mustbesyrup"
portrait: /assets/timo.png
portrait-alt: "Timo's portrait"
---
`);

const home = parseHome(`## Writing

- [Essay](https://example.com/essay)

## Press

- Launch

:::latest-reads
:::

## Contact

- [Email](mailto:me@example.com)
`);

const reads = parseReads(`---
home-count: 2
home-heading: Reads
page-heading: Recent reads
---

- Newest book
- Second book
- Archived book
`);

test('renders safe inline markup and external link behavior', () => {
  assert.equal(
    renderInline([
      { type: 'text', value: '<hello> ' },
      { type: 'link', url: 'https://example.com/?a=1&b=2', children: [{ type: 'text', value: 'go' }] },
    ]),
    '&lt;hello&gt; <a href="https://example.com/?a=1&amp;b=2" target="_blank" rel="noopener noreferrer">go</a>',
  );
});

test('refuses executable and protocol-relative link destinations', () => {
  for (const url of ['javascript:alert(1)', 'data:text/html,hello', '//example.com/path']) {
    assert.throws(
      () => renderInline([{ type: 'link', url, children: [{ type: 'text', value: 'click' }] }]),
      /Unsafe link destination/,
    );
  }
});

test('renders the fixed home sections and only the configured read preview', () => {
  const pages = renderPages({ site, home, reads });
  const html = pages['index.html'];
  assert.match(html, /Writing/);
  assert.match(html, /Press/);
  assert.match(html, /Contact/);
  assert.match(html, /Newest book/);
  assert.match(html, /Second book/);
  assert.doesNotMatch(html, /Archived book/);
  assert.match(html, /href="\/reads\/">More<\/a>/);
});

test('renders only archived reads on the reads route', () => {
  const html = renderPages({ site, home, reads })['reads/index.html'];
  assert.match(html, /Recent reads/);
  assert.match(html, /Archived book/);
  assert.doesNotMatch(html, /Newest book/);
  assert.match(html, /href="\/">Home<\/a>/);
});

test('renders route-independent assets and complete social metadata', () => {
  const pages = renderPages({ site, home, reads });
  for (const html of [pages['index.html'], pages['reads/index.html']]) {
    assert.match(html, /href="\/style\.css"/);
    assert.match(html, /src="\/assets\/timo\.png"/);
    assert.match(html, /content="https:\/\/timosheridan\.com\/assets\/timosyrup\.jpg"/);
    assert.match(html, /Timo &amp; friends/);
    assert.match(html, /Timo&#39;s portrait/);
  }
});

test('preserves the live static layout constants', () => {
  const css = renderPages({ site, home, reads })['style.css'];
  assert.match(css, /--off-white: #f5f5f5/);
  assert.match(css, /--blue: #3366cc/);
  assert.match(css, /max-height: 100px/);
  assert.match(css, /margin: 160px 5vw 10vh 10vw/);
  assert.match(css, /@media \(max-width: 258px\)/);
});
