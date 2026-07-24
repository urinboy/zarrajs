#!/usr/bin/env node
// semantic-release'ning @semantic-release/exec "prepareCmd" bosqichida chaqiriladi:
// src/zarra.js ichidagi VERSION konstantasini yangi versiyaga moslaydi, chunki
// CLAUDE.md/AGENTS.md bo'yicha versiya yagona manbasi shu konstanta.

import { readFileSync, writeFileSync } from "node:fs";

const versiya = process.argv[2];
if (!versiya) {
  console.error("Foydalanish: node tools/versiya-sinxron.mjs <versiya>");
  process.exit(1);
}

const yol = new URL("../src/zarra.js", import.meta.url);
const matn = readFileSync(yol, "utf8");
const naqsh = /export const VERSION = '[^']*';/;

if (!naqsh.test(matn)) {
  console.error("VERSION konstantasi topilmadi.");
  process.exit(1);
}

const yangi = matn.replace(naqsh, `export const VERSION = '${versiya}';`);
writeFileSync(yol, yangi);
console.log(`VERSION -> ${versiya}`);
