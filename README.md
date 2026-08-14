# Timo Markdown

A tiny, dependency-free Markdown language and static-site compiler for `timosheridan.com`. The source of truth lives in `site/`; generated HTML and CSS live in `dist/` and should be deployed as static files.

## Edit and build

1. Edit the global settings in `site/site.md`.
2. Edit or add pages in `site/pages/*.md`.
3. Run `npm run build`.
4. Preview with `python3 -m http.server 8000 -d dist` and open `http://localhost:8000`.

No package installation is required. Node.js 20 or newer is the only build dependency.

## The language

Every page starts with plain `key: value` frontmatter:

```md
---
title: Page title
description: Used by search engines and link previews.
slug: page-url
nav: Short navigation label
order: 2
draft: false
---
```

Use normal Markdown for headings (`#` through `###`), paragraphs, bullet lists, links, bold, italic, and inline code. Use fenced components for the site's designed sections. Options containing spaces must be quoted.

### Hero

```md
::: hero eyebrow="What I do" title="A concise headline." cta="See my work" href="./work.html"
A one- or two-sentence introduction with **optional emphasis**.
:::
```

### Project

```md
::: project title="Project name" year=2026 tags="Brand, Digital" image="./assets/project.jpg" alt="Describe what is visible" featured=true cta="Visit project" href="https://example.com"
Explain the challenge, approach, and result.
:::
```

`image` is optional, but `alt` is required whenever it is used. Put image files in `site/assets/`; they are copied into the build unchanged.

### Gallery

Each line is `image | alt text | optional caption`:

```md
::: gallery label="Project details"
./assets/detail-one.jpg | Close-up of a printed cover | The finished cover
./assets/detail-two.jpg | Website shown on a laptop | Responsive website
:::
```

### Links

Each line is `label | URL`:

```md
::: links
Email | mailto:hello@timosheridan.com
Instagram | https://instagram.com/your-name
:::
```

### Quote and contact

```md
::: quote by="Person, Company"
A short, specific endorsement.
:::

::: contact title="Let’s make something." cta="Email me" href="mailto:hello@timosheridan.com"
A final invitation to get in touch.
:::
```

## Pages and deployment

- A filename becomes its URL by default: `about.md` becomes `about.html`.
- Set `slug: index` for the home page.
- Set `draft: true` to keep a page out of the build and navigation.
- Navigation is generated from `nav`, then sorted by `order`.
- The compiler rejects duplicate/invalid slugs and images without alternative text.
- Deploy the complete `dist/` directory to any static host.

Run `npm test` after changing compiler code. Content-only edits normally need only `npm run build`.
