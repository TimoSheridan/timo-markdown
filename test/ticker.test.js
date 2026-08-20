import test from 'node:test';
import assert from 'node:assert/strict';

import { parseFooter, renderFooter, TICKER_COPIES } from '../src/index.js';
import { MOTION_STYLES } from '../src/motion-theme.js';

const footer = parseFooter(`:::ticker direction=forward
- {{ one- | two- }}time founder
- fine art admirer
:::

:::ticker direction=reverse
- {{ herbal | chai }} tea drinker
:::

:::ticker direction=forward
- saxophone shredder
:::

:::ticker direction=reverse
- road-tripper
:::
`);

test('renders four alternating marquees with eight compiler-owned copies', () => {
  const html = renderFooter(footer);
  assert.equal(TICKER_COPIES, 8);
  assert.equal((html.match(/class="marquee /g) ?? []).length, 4);
  assert.equal((html.match(/class="ticker-copy /g) ?? []).length, 4 * TICKER_COPIES);
  assert.deepEqual(
    [...html.matchAll(/data-direction="([^"]+)"/g)].map((match) => match[1]),
    ['forward', 'reverse', 'forward', 'reverse'],
  );
});

test('renders every vertical choice once in each copy', () => {
  const html = renderFooter(footer);
  assert.equal((html.match(/class="vertical-scroll-container"/g) ?? []).length, 2 * TICKER_COPIES);
  assert.equal((html.match(/<li>one-<\/li>/g) ?? []).length, TICKER_COPIES);
  assert.equal((html.match(/<li>two-<\/li>/g) ?? []).length, TICKER_COPIES);
  assert.match(html, /<\/span><span>time founder<\/span>|<\/span>time founder/);
});

test('escapes authored ticker text and alternatives', () => {
  const custom = structuredClone(footer);
  custom.rows[0].items[0] = [
    { type: 'text', value: '<script>' },
    { type: 'vertical', choices: ['a&b', 'c<d'] },
  ];
  const html = renderFooter(custom);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /a&amp;b/);
  assert.match(html, /c&lt;d/);
});

test('preserves authored spaces on both sides of a vertical choice', () => {
  const custom = structuredClone(footer);
  custom.rows[0].items[0] = [
    { type: 'text', value: 'registered ' },
    { type: 'vertical', choices: ['oklahoma', 'london'] },
    { type: 'text', value: ' voter' },
  ];
  const html = renderFooter(custom);
  assert.match(html, /registered&nbsp;<span class="box">/);
  assert.match(html, /<\/ul><\/span>&nbsp;voter/);
});

test('locks the measured live animation and wrapper constants', () => {
  assert.match(MOTION_STYLES, /flex-direction: column/);
  assert.match(MOTION_STYLES, /marquee 120s linear infinite/);
  assert.match(MOTION_STYLES, /marqueereverse 120s linear infinite/);
  assert.match(MOTION_STYLES, /scrollUp 10s linear infinite/);
  assert.match(MOTION_STYLES, /translate3d\(-50%, 0, 0\)/);
  assert.match(MOTION_STYLES, /translateY\(-100%\)/);
  assert.match(MOTION_STYLES, /height: 0\.73em/);
});
