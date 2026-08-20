# Timo Markdown

Timo Markdown turns a few focused Markdown files into the fixed structure and style of [timosheridan.com](https://timosheridan.com/). The generated HTML, CSS, reading-list split, ticker repetition, and animation markup are owned by the compiler; routine site updates only require editing words and links.

Requires Node.js 18 or newer.

## Add a book

Open `content/reads.md` and add one bullet at the top of the list, immediately below the front matter:

```md
---
home-count: 2
home-heading: Reads
page-heading: Recent reads
---

- The Newest Book (Author, 2026)
- The Previous Book (Author, 2025)
```

Keep the list newest first. The first `home-count` books appear under Reads on the home page; every remaining book appears on `/reads/`. Each book is written once, in this file only.

## Edit the home page

Edit the bullets in `content/home.md` to change Writing, Press, or Contact:

```md
## Writing

- [Essay title](https://example.com/essay)
```

Keep the blocks in this exact order: `Writing`, `Press`, `:::latest-reads`, then `Contact`. Do not put books in this file—the compiler fills the reads block from `content/reads.md`.

Bullets can contain plain text, links, `*emphasis*`, and `**strong emphasis**`. Raw HTML is intentionally unsupported.

## Edit the scrolling footers

The two pages have separate footer files:

- `content/footers/home.md` controls the home-page footer.
- `content/footers/reads.md` controls the reads-page footer.

Each file has four ticker blocks. Edit, add, remove, or reorder phrase bullets inside a block:

```md
:::ticker direction=forward
- fine art admirer
- weekend hacker
- seriously amateur surfer
:::
```

Keep all four blocks and their directions in this order: `forward`, `reverse`, `forward`, `reverse`. The compiler adds separators and repeated copies automatically.

For words that scroll vertically through alternatives, use double braces and pipes:

```md
- {{ one- | two- }}time founder (so far!)
- registered {{ oklahoma | virginia | london }} voter
```

Each vertical choice needs at least two non-empty alternatives. Spaces around the alternatives are trimmed, so `{{ one- | two- }}time` displays `one-time` and `two-time`.

## Check and build

After any content edit, run:

```sh
npm test
npm run check
npm run build
```

- `npm test` runs the parser, renderer, animation, and build tests.
- `npm run check` validates `content/` and `assets/` without writing files.
- `npm run build` validates the source and safely replaces the repository-local `dist/` directory.

The build output is ready to serve as a static site:

```text
dist/
├── index.html
├── reads/
│   └── index.html
├── style.css
└── assets/
    └── ...
```

For non-default directories, pass the CLI options through the npm scripts:

```sh
npm run check -- --source PATH
npm run build -- --source PATH --output PATH
```

The output name is resolved as a top-level directory inside the source project. The compiler refuses the project root, nested paths, source directories, symlinks, and paths outside the project. It only replaces an existing directory when a hidden marker proves that Timo Markdown created it.

## Other site settings

Edit `content/site.md` for the title, description, canonical URL, social image, Twitter account, portrait, and portrait alt text. Referenced image files belong in `assets/`.

The complete syntax and validation rules are in [docs/LANGUAGE.md](docs/LANGUAGE.md). The product goals and intentional constraints are in [docs/PRODUCT.md](docs/PRODUCT.md).

Automated deployment, hosting, and a GitHub Actions workflow are intentionally future work. This version only validates and compiles the site locally; it does not publish `dist/`.
