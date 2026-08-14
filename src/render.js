const SAFE_PROTOCOL = /^(https?:|mailto:|tel:|\/|#|\.\.\/|\.\/)/i;

export function renderPage(document, site, pages) {
  const title = document.attributes.title || site.title;
  const description = document.attributes.description || site.description || "";
  const content = document.blocks.map(renderBlock).join("\n");
  const navigation = pages.filter(page => !page.attributes.draft).sort(byOrder).map(page => {
    const href = page.attributes.slug === "index" ? "./" : `./${page.attributes.slug}.html`;
    return `<a href="${href}">${escapeHtml(page.attributes.nav || page.attributes.title)}</a>`;
  }).join("");
  return `<!doctype html>
<html lang="${escapeHtml(site.language || "en")}">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} · ${escapeHtml(site.title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="stylesheet" href="./assets/site.css">
</head>
<body>
  <header class="site-header"><a class="wordmark" href="./">${escapeHtml(site.title)}</a><nav aria-label="Primary">${navigation}</nav></header>
  <main>${content}</main>
  <footer><span>${escapeHtml(site.footer || `© ${new Date().getUTCFullYear()} ${site.title}`)}</span>${renderSocials(site.socials)}</footer>
</body></html>`;
}

function renderBlock(block) {
  if (block.type === "heading") return `<h${block.level}>${inline(block.text)}</h${block.level}>`;
  if (block.type === "paragraph") return `<p>${inline(block.text).replace(/\n/g, "<br>")}</p>`;
  if (block.type === "list") return `<ul>${block.items.map(item => `<li>${inline(item)}</li>`).join("")}</ul>`;
  if (block.type === "component") return renderComponent(block);
  return "";
}

function renderComponent({ name, attributes: a, body }) {
  if (name === "hero") return `<section class="hero"><p class="eyebrow">${inline(a.eyebrow || "")}</p><h1>${inline(a.title || "")}</h1><div class="lede">${inline(body)}</div>${button(a.cta, a.href)}</section>`;
  if (name === "project") return `<article class="project${a.featured ? " featured" : ""}">${image(a.image, a.alt)}<div><p class="eyebrow">${escapeHtml([a.year, a.tags].filter(Boolean).join(" · "))}</p><h2>${inline(a.title || "Untitled project")}</h2><p>${inline(body)}</p>${button(a.cta || (a.href ? "View project" : ""), a.href)}</div></article>`;
  if (name === "gallery") return `<section class="gallery" aria-label="${escapeHtml(a.label || "Image gallery")}">${rows(body).map(([src, alt, caption]) => `<figure>${image(src, alt)}${caption ? `<figcaption>${inline(caption)}</figcaption>` : ""}</figure>`).join("")}</section>`;
  if (name === "links") return `<div class="link-list">${rows(body).map(([label, href]) => `<a href="${safeUrl(href)}">${inline(label)}<span aria-hidden="true">↗</span></a>`).join("")}</div>`;
  if (name === "quote") return `<figure class="quote"><blockquote>${inline(body)}</blockquote>${a.by ? `<figcaption>— ${inline(a.by)}</figcaption>` : ""}</figure>`;
  if (name === "contact") return `<section class="contact"><h2>${inline(a.title || "Let’s work together")}</h2><p>${inline(body)}</p>${button(a.cta || "Get in touch", a.href)}</section>`;
  return "";
}

function inline(value = "") {
  let text = escapeHtml(String(value));
  text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
  text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => `<a href="${safeUrl(href)}">${label}</a>`);
}

function image(src, alt) {
  return src ? `<img src="${safeUrl(src)}" alt="${escapeHtml(alt || "")}" loading="lazy">` : "";
}
function button(label, href) { return label && href ? `<a class="button" href="${safeUrl(href)}">${inline(label)}</a>` : ""; }
function rows(body) { return body.split("\n").filter(Boolean).map(line => line.split("|").map(value => value.trim())); }
function renderSocials(socials = "") { return `<div class="socials">${rows(socials).map(([label, href]) => `<a href="${safeUrl(href)}">${escapeHtml(label)}</a>`).join("")}</div>`; }
function safeUrl(value = "") { const url = String(value).trim(); return SAFE_PROTOCOL.test(url) ? escapeHtml(url) : "#"; }
function escapeHtml(value = "") { return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]); }
function byOrder(a, b) { return (a.attributes.order ?? 999) - (b.attributes.order ?? 999); }
