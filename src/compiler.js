import {
  cp,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rename,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';

import { LanguageError } from './errors.js';
import { parseFooter, parseHome, parseReads, parseSite } from './parser.js';
import { renderPages } from './renderer.js';

const SOURCE_PATHS = {
  site: 'content/site.md',
  home: 'content/home.md',
  reads: 'content/reads.md',
  homeFooter: 'content/footers/home.md',
  readsFooter: 'content/footers/reads.md',
};

const TEMPLATE_ASSETS = [
  'assets/favicon/apple-touch-icon.png',
  'assets/favicon/favicon-32x32.png',
  'assets/favicon/favicon-16x16.png',
  'assets/favicon/favicon.ico',
  'assets/favicon/android-chrome-192x192.png',
  'assets/favicon/android-chrome-512x512.png',
  'assets/favicon/site.webmanifest',
];

const OUTPUT_MARKER = '.timo-markdown-output';
const OUTPUT_MARKER_CONTENT = 'timo-markdown-output-v1\n';

async function readSource(rootDir, sourcePath) {
  try {
    return await readFile(join(rootDir, sourcePath), 'utf8');
  } catch (caught) {
    if (caught.code === 'ENOENT') {
      throw new LanguageError(sourcePath, 1, 1, 'E_MISSING_SOURCE', 'required source file does not exist');
    }
    throw caught;
  }
}

function metadataLocation(source, key) {
  const lines = source.replaceAll('\r\n', '\n').split('\n');
  const index = lines.findIndex((line) => line.startsWith(`${key}:`));
  return { line: index + 1 || 1, column: key.length + 2 };
}

async function validateAsset(rootDir, siteSource, key, assetPath) {
  const location = metadataLocation(siteSource, key);
  if (!assetPath.startsWith('/assets/') || assetPath.includes('..') || assetPath.includes('\\')) {
    throw new LanguageError(
      SOURCE_PATHS.site,
      location.line,
      location.column,
      'E_MISSING_ASSET',
      `${key} must name a root-relative file under /assets/`,
    );
  }
  const localPath = join(rootDir, assetPath.slice(1));
  try {
    const details = await stat(localPath);
    if (!details.isFile()) throw new Error('not a file');
  } catch {
    throw new LanguageError(
      SOURCE_PATHS.site,
      location.line,
      location.column,
      'E_MISSING_ASSET',
      `asset does not exist: ${assetPath}`,
    );
  }
}

async function validateTemplateAsset(rootDir, assetPath) {
  try {
    const details = await stat(join(rootDir, assetPath));
    if (!details.isFile()) throw new Error('not a file');
  } catch {
    throw new LanguageError(assetPath, 1, 1, 'E_MISSING_ASSET', 'required template asset does not exist');
  }
}

export async function loadProject(root = process.cwd()) {
  const rootDir = await realpath(resolve(root));
  const [siteSource, homeSource, readsSource, homeFooterSource, readsFooterSource] = await Promise.all([
    readSource(rootDir, SOURCE_PATHS.site),
    readSource(rootDir, SOURCE_PATHS.home),
    readSource(rootDir, SOURCE_PATHS.reads),
    readSource(rootDir, SOURCE_PATHS.homeFooter),
    readSource(rootDir, SOURCE_PATHS.readsFooter),
  ]);

  const site = parseSite(siteSource, SOURCE_PATHS.site);
  const project = {
    site,
    home: parseHome(homeSource, SOURCE_PATHS.home),
    reads: parseReads(readsSource, SOURCE_PATHS.reads),
    footers: {
      home: parseFooter(homeFooterSource, SOURCE_PATHS.homeFooter),
      reads: parseFooter(readsFooterSource, SOURCE_PATHS.readsFooter),
    },
  };
  await Promise.all([
    validateAsset(rootDir, siteSource, 'portrait', site.portrait),
    validateAsset(rootDir, siteSource, 'social-image', site.socialImage),
    ...TEMPLATE_ASSETS.map((assetPath) => validateTemplateAsset(rootDir, assetPath)),
  ]);
  return project;
}

export async function checkProject(root = process.cwd()) {
  const project = await loadProject(root);
  renderPages(project);
  return project;
}

function safeOutputPath(rootDir, output) {
  const outputDir = resolve(rootDir, output);
  const local = relative(rootDir, outputDir);
  const firstSegment = local.split(sep)[0];
  if (
    local === ''
    || local === '..'
    || local.startsWith(`..${sep}`)
    || isAbsolute(local)
    || local.includes(sep)
    || [
      '.codex',
      '.git',
      '.github',
      'assets',
      'bin',
      'content',
      'docs',
      'node_modules',
      'scripts',
      'src',
      'test',
    ].includes(firstSegment)
  ) {
    throw new TypeError('output must be an unprotected top-level directory inside the project root');
  }
  return outputDir;
}

async function assertReplaceableOutput(outputDir) {
  let details;
  try {
    details = await lstat(outputDir);
  } catch (caught) {
    if (caught.code === 'ENOENT') return;
    throw caught;
  }
  if (!details.isDirectory() || details.isSymbolicLink()) {
    throw new TypeError('refusing to replace an output path that is not an owned directory');
  }
  try {
    const marker = await readFile(join(outputDir, OUTPUT_MARKER), 'utf8');
    if (marker !== OUTPUT_MARKER_CONTENT) throw new Error('wrong marker');
  } catch {
    throw new TypeError('refusing to replace an output directory not created by Timo Markdown');
  }
}

async function writeRenderedFiles(outputDir, files) {
  for (const [filePath, contents] of Object.entries(files)) {
    const destination = join(outputDir, filePath);
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, contents, 'utf8');
  }
}

export async function buildProject({ root = process.cwd(), output = 'dist' } = {}) {
  const rootDir = await realpath(resolve(root));
  const outputDir = safeOutputPath(rootDir, output);
  await assertReplaceableOutput(outputDir);
  const project = await loadProject(rootDir);
  const rendered = renderPages(project);
  const temporaryDir = await mkdtemp(`${outputDir}.tmp-`);

  try {
    await writeRenderedFiles(temporaryDir, rendered);
    await cp(join(rootDir, 'assets'), join(temporaryDir, 'assets'), { recursive: true });
    await writeFile(join(temporaryDir, OUTPUT_MARKER), OUTPUT_MARKER_CONTENT, 'utf8');
    await rm(outputDir, { recursive: true, force: true });
    await rename(temporaryDir, outputDir);
  } catch (caught) {
    await rm(temporaryDir, { recursive: true, force: true });
    throw caught;
  }

  return { outputDir, files: Object.keys(rendered), project };
}
