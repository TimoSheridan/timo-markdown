import { BASE_STYLES } from './theme.js';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function isExternal(href) {
  return /^https?:\/\//i.test(href);
}

function safeHref(href) {
  if (
    href !== href.trim()
    || /[\u0000-\u0020\u007f]/.test(href)
    || href.startsWith('//')
    || (/^[A-Za-z][A-Za-z\d+.-]*:/.test(href) && !/^(?:https?|mailto):/i.test(href))
  ) {
    throw new TypeError(`Unsafe link destination: ${JSON.stringify(href)}`);
  }
  return escapeHtml(href);
}

export function renderInline(nodes, { contact = false } = {}) {
  return nodes.map((node) => {
    if (node.type === 'text') return escapeHtml(node.value);
    if (node.type === 'emphasis') return `<em>${renderInline(node.children, { contact })}</em>`;
    if (node.type === 'strong') return `<strong>${renderInline(node.children, { contact })}</strong>`;
    if (node.type === 'link') {
      const classes = contact ? ' class="text playfair-black break-contact-information"' : '';
      const target = isExternal(node.url) ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `<a${classes} href="${safeHref(node.url)}"${target}>${renderInline(node.children, { contact })}</a>`;
    }
    throw new TypeError(`Unknown inline node type: ${node.type}`);
  }).join('');
}

function renderHeader(title) {
  return `<div class="content-header text playfair-black">${escapeHtml(title)}</div>`;
}

function renderList(items, options) {
  return `<ul class="text playfair-black">${items
    .map((item) => `<li>${renderInline(item, options)}</li>`)
    .join('')}</ul>`;
}

function renderHomeContent(home, reads) {
  return home.blocks.map((block) => {
    if (block.type === 'section') {
      return `${renderHeader(block.title)}${renderList(block.items, { contact: block.title === 'Contact' })}`;
    }
    if (block.type === 'latest-reads') {
      const preview = reads.entries.slice(0, reads.homeCount);
      const more = '<li><a class="text playfair-black" href="/reads/">More</a></li>';
      return `${renderHeader(reads.homeHeading)}<ul class="text playfair-black">${preview
        .map((entry) => `<li>${renderInline(entry)}</li>`)
        .join('')}${more}</ul>`;
    }
    throw new TypeError(`Unknown home block type: ${block.type}`);
  }).join('');
}

function renderReadsContent(reads) {
  const archived = reads.entries.slice(reads.homeCount);
  return `${renderHeader(reads.pageHeading)}${renderList(archived)}<a class="text playfair-black" href="/">Home</a>`;
}

function absoluteAsset(site, assetPath) {
  return new URL(assetPath, site.url).href;
}

export function renderDocument(site, content, footer = '') {
  const socialImage = absoluteAsset(site, site.socialImage);
  return `<!doctype html>
<html lang="${escapeHtml(site.language)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>${escapeHtml(site.title)}</title>
  <meta name="title" content="${escapeHtml(site.title)}">
  <meta name="description" content="${escapeHtml(site.description)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${escapeHtml(site.url)}">
  <meta property="og:title" content="${escapeHtml(site.title)}">
  <meta property="og:description" content="${escapeHtml(site.description)}">
  <meta property="og:image" content="${escapeHtml(socialImage)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${escapeHtml(site.url)}">
  <meta name="twitter:title" content="${escapeHtml(site.title)}">
  <meta name="twitter:description" content="${escapeHtml(site.description)}">
  <meta name="twitter:image" content="${escapeHtml(socialImage)}">
  <meta name="twitter:site" content="${escapeHtml(site.twitterSite)}">
  <link rel="stylesheet" href="/style.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display&amp;display=swap" rel="stylesheet">
  <link rel="apple-touch-icon" sizes="180x180" href="/assets/favicon/apple-touch-icon.png">
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon/favicon-16x16.png">
  <link rel="manifest" href="/assets/favicon/site.webmanifest">
</head>
<body>
  <a href="/" aria-label="Home"><img src="${escapeHtml(site.portrait)}" alt="${escapeHtml(site.portraitAlt)}" class="timo-image"></a>
  <div class="content">${content}</div>
  ${footer}
</body>
</html>
`;
}

export function renderPages({ site, home, reads }) {
  return {
    'index.html': renderDocument(site, renderHomeContent(home, reads)),
    'reads/index.html': renderDocument(site, renderReadsContent(reads)),
    'style.css': BASE_STYLES,
  };
}
