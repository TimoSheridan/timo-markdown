import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, symlink, unlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

import { buildProject, checkProject } from '../src/index.js';

const sources = {
  'content/site.md': `---
language: en
title: timo
description: test site
url: https://timosheridan.com/
social-image: /assets/social.jpg
twitter-site: "@mustbesyrup"
portrait: /assets/portrait.png
portrait-alt: portrait
---
`,
  'content/home.md': `## Writing

- Essay

## Press

- News

:::latest-reads
:::

## Contact

- Contact
`,
  'content/reads.md': `---
home-count: 1
home-heading: Reads
page-heading: Recent reads
---

- New book
- Old book
`,
  'content/footers/home.md': `:::ticker direction=forward
- one
:::
:::ticker direction=reverse
- two
:::
:::ticker direction=forward
- three
:::
:::ticker direction=reverse
- four
:::
`,
  'content/footers/reads.md': `:::ticker direction=forward
- five
:::
:::ticker direction=reverse
- six
:::
:::ticker direction=forward
- seven
:::
:::ticker direction=reverse
- eight
:::
`,
  'assets/social.jpg': 'social',
  'assets/portrait.png': 'portrait',
  'assets/favicon/apple-touch-icon.png': 'icon',
  'assets/favicon/favicon-32x32.png': 'icon',
  'assets/favicon/favicon-16x16.png': 'icon',
  'assets/favicon/favicon.ico': 'icon',
  'assets/favicon/android-chrome-192x192.png': 'icon',
  'assets/favicon/android-chrome-512x512.png': 'icon',
  'assets/favicon/site.webmanifest': '{}',
};

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'timo-markdown-test-'));
  for (const [path, contents] of Object.entries(sources)) {
    const destination = join(root, path);
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, contents);
  }
  return root;
}

test('checks a complete project without writing output', async () => {
  const root = await fixture();
  const project = await checkProject(root);
  assert.equal(project.reads.entries.length, 2);
  await assert.rejects(readFile(join(root, 'dist/index.html')), { code: 'ENOENT' });
});

test('builds both routes, stylesheet, and copied assets', async () => {
  const root = await fixture();
  const result = await buildProject({ root });
  assert.equal(result.outputDir, join(root, 'dist'));
  assert.match(await readFile(join(root, 'dist/index.html'), 'utf8'), /New book/);
  assert.match(await readFile(join(root, 'dist/reads/index.html'), 'utf8'), /Old book/);
  assert.match(await readFile(join(root, 'dist/style.css'), 'utf8'), /marquee 120s/);
  assert.equal(await readFile(join(root, 'dist/assets/portrait.png'), 'utf8'), 'portrait');
});

test('validates before replacing a compiler-owned output directory', async () => {
  const root = await fixture();
  await buildProject({ root });
  const before = await readFile(join(root, 'dist/index.html'), 'utf8');
  await writeFile(join(root, 'content/home.md'), 'invalid');
  await assert.rejects(buildProject({ root }), (caught) => caught.code === 'E_LATEST_READS_COUNT');
  assert.equal(await readFile(join(root, 'dist/index.html'), 'utf8'), before);
});

test('refuses protected or external output paths', async () => {
  const root = await fixture();
  await assert.rejects(buildProject({ root, output: '.' }), /unprotected top-level directory/);
  await assert.rejects(buildProject({ root, output: '.github' }), /unprotected top-level directory/);
  await assert.rejects(buildProject({ root, output: 'assets/generated' }), /unprotected top-level directory/);
  await assert.rejects(buildProject({ root, output: 'build/site' }), /unprotected top-level directory/);
  await assert.rejects(buildProject({ root, output: '../outside' }), /unprotected top-level directory/);
});

test('never replaces an existing unowned directory', async () => {
  const root = await fixture();
  await mkdir(join(root, 'public'), { recursive: true });
  await writeFile(join(root, 'public/keep.txt'), 'keep me');
  await assert.rejects(buildProject({ root, output: 'public' }), /not created by Timo Markdown/);
  assert.equal(await readFile(join(root, 'public/keep.txt'), 'utf8'), 'keep me');
});

test('never replaces the source tree', async () => {
  const root = await fixture();
  await mkdir(join(root, 'src'), { recursive: true });
  await writeFile(join(root, 'src/keep.txt'), 'source');
  await assert.rejects(buildProject({ root, output: 'src' }), /unprotected top-level directory/);
  assert.equal(await readFile(join(root, 'src/keep.txt'), 'utf8'), 'source');
});

test('never follows an output symlink outside the project', async () => {
  const root = await fixture();
  const outside = await mkdtemp(join(tmpdir(), 'timo-markdown-outside-'));
  await writeFile(join(outside, 'keep.txt'), 'outside');
  await symlink(outside, join(root, 'public'), 'dir');
  await assert.rejects(buildProject({ root, output: 'public' }), /not an owned directory/);
  assert.equal(await readFile(join(outside, 'keep.txt'), 'utf8'), 'outside');
});

test('replaces only a previously marked compiler output', async () => {
  const root = await fixture();
  await buildProject({ root, output: 'public' });
  await writeFile(join(root, 'public/obsolete.txt'), 'old');
  await buildProject({ root, output: 'public' });
  await assert.rejects(readFile(join(root, 'public/obsolete.txt')), { code: 'ENOENT' });
  assert.equal(await readFile(join(root, 'public/.timo-markdown-output'), 'utf8'), 'timo-markdown-output-v1\n');
});

test('reports missing assets as located language errors', async () => {
  const root = await fixture();
  await writeFile(join(root, 'content/site.md'), sources['content/site.md'].replace('/assets/portrait.png', '/assets/missing.png'));
  await assert.rejects(
    checkProject(root),
    (caught) => caught.code === 'E_MISSING_ASSET'
      && caught.path === 'content/site.md'
      && caught.line === 8,
  );
});

test('checks every fixed template asset', async () => {
  const root = await fixture();
  await unlink(join(root, 'assets/favicon/favicon-16x16.png'));
  await assert.rejects(
    checkProject(root),
    (caught) => caught.code === 'E_MISSING_ASSET'
      && caught.path === 'assets/favicon/favicon-16x16.png',
  );
});
