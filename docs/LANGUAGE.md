# Timo Markdown language 0.1

Timo Markdown is ordinary Markdown with YAML-style file metadata, two fenced blocks, and one ticker-only inline form. File paths give documents their roles, which keeps content blocks discrete and prevents the same information from being defined in multiple places.

## Source tree

```text
content/
├── site.md
├── home.md
├── reads.md
└── footers/
    ├── home.md
    └── reads.md
assets/
├── timo.png
└── timosyrup.jpg
```

| File | Sole responsibility |
| --- | --- |
| `site.md` | Global page metadata and image paths |
| `home.md` | Ordered home-page sections and the reads insertion point |
| `reads.md` | Canonical newest-first reading list and its display settings |
| `footers/home.md` | Four scrolling rows used only on the home page |
| `footers/reads.md` | Four scrolling rows used only on the reads page |

The compiler template owns all unchanging HTML, CSS, navigation, separators, animation settings, and repeated marquee copies. The repository-level `assets/` directory contains files named by `site.md`; it is input to the compiler but is not part of the Markdown language.

## Compile target

A successful build replaces the contents of an output directory with this deployable tree:

```text
dist/
├── index.html
├── reads/
│   └── index.html
├── style.css
└── assets/
    └── ...
```

The compiler renders `/` to `index.html`, renders `/reads/` to `reads/index.html`, writes its fixed stylesheet to `style.css`, and copies the repository `assets/` tree without changing filenames. Asset metadata is root-relative, `More` always links to `/reads/`, and `Home` always links to `/`, so the same output works from either route.

## Global metadata

`content/site.md` contains front matter and no body:

```md
---
language: en
title: timo
description: butter don't drizzle like that
url: https://timosheridan.com/
social-image: /assets/timosyrup.jpg
twitter-site: "@mustbesyrup"
portrait: /assets/timo.png
portrait-alt: "a handsome young man with a mustache smiles at the camera: timo"
---
```

All eight fields are required. Unknown metadata keys are rejected so misspellings cannot silently alter the generated site.

## Home sections

`content/home.md` contains exactly four blocks in this order: a `Writing` section, a `Press` section, one empty `latest-reads` block, and a `Contact` section. A section is a level-two heading followed by a bullet list:

```md
## Writing

- [On the heat loss of software companies](https://example.com/writing)

## Press

- [Rippling launches Travel](https://example.com/press)

:::latest-reads
:::

## Contact

- [@mustbesyrup](https://x.com/mustbesyrup)
- [me@timosheridan.com](mailto:me@timosheridan.com) (or [you@timosheridan.com](mailto:you@timosheridan.com), depending on your point of view)
```

A section heading and its list form one `section` block. The three headings are exact, case-sensitive structural names because the target site has a fixed structure. The reads insertion point is its own block rather than a magic heading. Section bullets support plain text, links, emphasis, and strong emphasis. Raw HTML is rejected.

## Reading list

`content/reads.md` contains display settings followed by one newest-first bullet list:

```md
---
home-count: 2
home-heading: Reads
page-heading: Recent reads
---

- The Long Week-End (Graves and Hodge, 1940)
- Travels with a Donkey in the Cevennes (Stevenson, 1879)
- A Short Walk in the Hindu Kush (Newby, 1958)
```

The first `home-count` entries appear at the reads insertion point on the home page, followed by a compiler-generated `More` link. The remaining entries appear on `/reads/`, followed by a compiler-generated `Home` link. If there are no remaining entries, the reads page still renders its heading and `Home` link.

`home-count` must be a positive integer no greater than the number of entries. Reading entries support the same inline Markdown as home section bullets.

## Scrolling footer rows

Each footer file contains exactly four ticker blocks. Direction is explicit and must alternate `forward`, `reverse`, `forward`, `reverse`:

```md
:::ticker direction=forward
- {{ one- | two- }}time founder (so far!)
- fine art admirer
- weekend hacker
:::

:::ticker direction=reverse
- choral composition connoisseur
- {{ herbal | tetley's | chai | boba }} tea drinker
- syrup drizzler
:::

:::ticker direction=forward
- saxophone shredder
- saturday sinner
:::

:::ticker direction=reverse
- impulse buyer
- american road-tripper
:::
```

Each bullet is one phrase in a row. The compiler joins phrases with ` // `, adds the nonbreaking spacing needed by the layout, and emits eight identical copies for seamless motion. A literal `//` in a phrase is text, never a delimiter.

### Vertical alternatives

Inside a ticker bullet only, double braces define alternatives that move vertically and continuously:

```md
- registered {{ oklahoma | virginia | london }} voter
- midnight {{ coder | snacker }}
```

Whitespace immediately inside the braces and around each pipe is trimmed. This means `{{ one- | two- }}time` renders as `one-time` or `two-time`. There must be at least two non-empty choices. Braces and pipes inside a choice are reserved and rejected in version 0.1.

`{{ ... }}` has no special meaning outside ticker bullets.

## Grammar

```text
site-file      = front-matter EOF
home-file      = writing press latest-reads contact
writing        = "## Writing" blank-line bullet-list
press          = "## Press" blank-line bullet-list
contact        = "## Contact" blank-line bullet-list
latest-reads   = ":::latest-reads" newline ":::"
reads-file     = front-matter blank-line bullet-list
footer-file    = ticker ticker ticker ticker
ticker         = ":::ticker direction=" direction newline bullet-list ":::"
direction      = "forward" | "reverse"
vertical       = "{{" choice ("|" choice)+ "}}"
```

Directives and their bare `:::` closing lines start in column one. Blocks cannot nest. Blank lines may separate blocks and bullets but not split a single bullet across source lines in version 0.1.

## Content model

```text
Site
├── config: SiteConfig
├── home: HomePage
│   └── blocks: Section | LatestReads
├── reads: ReadsCatalog
│   └── entries: Inline[]
└── footers
    ├── home: TickerRow[4]
    └── reads: TickerRow[4]

TickerRow
└── items: TickerItem[]
    └── parts: Text | VerticalChoice
```

## Errors

Errors use `path:line:column CODE message`. Codes are stable API; wording may improve without a language version change.

| Code | Meaning |
| --- | --- |
| `E_MISSING_META` | Required metadata is absent |
| `E_UNKNOWN_META` | Metadata key is not part of the file's schema |
| `E_DUPLICATE_META` | Metadata key appears more than once |
| `E_BAD_URL` | URL metadata is not an absolute HTTP(S) URL |
| `E_BAD_HOME_COUNT` | Home count is not valid for the reading list |
| `E_UNEXPECTED_BODY` | A metadata-only file has body content |
| `E_UNKNOWN_BLOCK` | Directive name is unsupported in that document |
| `E_UNCLOSED_BLOCK` | Directive has no closing `:::` line |
| `E_BAD_HOME` | Home content is not a section/list or reads block |
| `E_LATEST_READS_COUNT` | Home has zero or multiple reads insertion points |
| `E_TICKER_COUNT` | Footer does not define exactly four rows |
| `E_TICKER_DIRECTION` | Direction is missing, invalid, or does not alternate |
| `E_EMPTY_TICKER` | Ticker row contains no phrase bullets |
| `E_UNCLOSED_VERTICAL` | Vertical-alternative braces are not balanced |
| `E_VERTICAL_CHOICES` | Fewer than two non-empty alternatives are present |
| `E_RAW_HTML` | Authored HTML is not allowed |

## Compatibility

Language version `0.1` is the contract implemented by the compiler. Backward-compatible additions increment the minor version. Breaking syntax, content ownership, output behavior, or validation changes increment the major version. The compiler should reject a source language version newer than it supports once an explicit version field is introduced.
