#!/usr/bin/env node

import { resolve } from 'node:path';

import { buildProject, checkProject } from '../src/compiler.js';

function usage() {
  return `Usage:
  timo-markdown check [--source DIR]
  timo-markdown build [--source DIR] [--output DIR]`;
}

function parseArguments(arguments_) {
  const [command, ...options] = arguments_;
  if (!['check', 'build'].includes(command)) throw new TypeError(usage());
  const parsed = { command, source: process.cwd(), output: 'dist' };
  for (let index = 0; index < options.length; index += 1) {
    const option = options[index];
    const value = options[index + 1];
    if (option === '--source' && value) {
      parsed.source = resolve(value);
      index += 1;
    } else if (option === '--output' && value && command === 'build') {
      parsed.output = value;
      index += 1;
    } else {
      throw new TypeError(`Unknown or incomplete option: ${option}\n\n${usage()}`);
    }
  }
  return parsed;
}

try {
  const options = parseArguments(process.argv.slice(2));
  if (options.command === 'check') {
    await checkProject(options.source);
    console.log('Timo Markdown sources are valid.');
  } else {
    const result = await buildProject({ root: options.source, output: options.output });
    console.log(`Built ${result.files.length} generated files in ${result.outputDir}`);
  }
} catch (caught) {
  console.error(caught.message);
  process.exitCode = 1;
}
