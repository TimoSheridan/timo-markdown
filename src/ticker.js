import { escapeHtml } from './escape.js';

export const TICKER_COPIES = 8;

function renderPart(part) {
  if (part.type === 'text') {
    return escapeHtml(part.value)
      .replace(/^ +/, (spaces) => '&nbsp;'.repeat(spaces.length))
      .replace(/ +$/, (spaces) => '&nbsp;'.repeat(spaces.length));
  }
  if (part.type === 'vertical') {
    const choices = part.choices.map((choice) => `<li>${escapeHtml(choice)}</li>`).join('');
    return `<span class="box"><ul class="vertical-scroll-container">${choices}</ul></span>`;
  }
  throw new TypeError(`Unknown ticker part type: ${part.type}`);
}

function renderPhrase(parts) {
  return `<span class="ticker-phrase">${parts.map(renderPart).join('')}</span>`;
}

function renderCopy(items) {
  const separator = '<span class="ticker-separator">&nbsp;//&nbsp;</span>';
  return `<div class="ticker-copy text playfair-black">${items.map(renderPhrase).join(separator)}${separator}</div>`;
}

function renderRow(row) {
  const copy = renderCopy(row.items);
  return `<div class="marquee ${row.direction}-scroll" data-direction="${row.direction}">${copy.repeat(TICKER_COPIES)}</div>`;
}

export function renderFooter(footer) {
  return `<div class="footer"><div class="marquee-wrapper">${footer.rows.map(renderRow).join('')}</div></div>`;
}
