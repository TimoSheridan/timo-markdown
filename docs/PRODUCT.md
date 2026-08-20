# Timo Markdown product contract

## Objective

Create a small Markdown language that compiles to the existing structure and visual style of [timosheridan.com](https://timosheridan.com/). The site structure and styling are treated as stable. Editing the site should mean editing readable Markdown, not HTML, CSS, repeated animation markup, or duplicated reading-list entries.

The language must cover every authored part of the current site with discrete, non-overlapping blocks:

- global site metadata and portrait;
- home-page Writing, Press, Reads, and Contact content;
- one canonical, newest-first reading list;
- the home and reads-page scrolling footers;
- inline vertical phrases such as `one-time founder` continuously changing to `two-time founder`.

The compiler owns the fixed document structure, CSS classes, navigation links, ticker separators and repetitions, animation details, and responsive behavior. Authors own only words, links, metadata, and the ordering of content.

## Routine editing goals

The two most common edits should be deliberately boring:

1. Add a book by inserting one ordinary Markdown bullet at the top of `content/reads.md`.
2. Change a scrolling phrase by editing one bullet in the relevant footer file. Alternatives that scroll vertically use `{{ first | second }}` inside the sentence.

A book appears in exactly one source file. The compiler shows the newest configured number on the home page and the remainder on `/reads/`.

## Fidelity contract

Generated pages must preserve the current site's visible behavior:

- off-white background, Playfair Display typography, portrait placement, content spacing, link styling, and narrow contact wrapping;
- four footer rows on each page, alternating horizontal directions;
- seamless 120-second horizontal marquees made from compiler-generated repetitions;
- continuously moving 10-second vertical alternatives embedded inside a ticker phrase;
- page-specific footer text for the home and reads routes.

The exact DOM, CSS, animation markup, and repetition count are implementation details and must not leak into content files.

## Out of scope for this version

- GitHub Actions, deployment, hosting, or changing DNS;
- a general-purpose website builder or arbitrary HTML/CSS escape hatch;
- redesigning the current site;
- a browser-based content editor;
- additional routes beyond `/` and `/reads/`.

## Success criteria

- Valid example content compiles into both routes without hand-authored HTML.
- Invalid source reports a stable error code and source location.
- The reading list has one source of truth.
- Footer phrases and vertical alternatives are understandable without knowing the renderer.
- Automated tests cover parsing, rendering, motion structure, and an end-to-end build.
- The objective and language contract remain in version control for future agents.
