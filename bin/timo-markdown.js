#!/usr/bin/env node
import { build } from "../src/compiler.js";

const [command = "build"] = process.argv.slice(2);
if (command !== "build") {
  console.error("Usage: timo-markdown build");
  process.exitCode = 1;
} else {
  build().then(result => console.log(`Built ${result.pages} page(s) in ${result.output}`)).catch(error => { console.error(error.message); process.exitCode = 1; });
}
