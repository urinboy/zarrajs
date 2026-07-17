/**
 * Hajm nazorati: yadro ≤ 3.5 KB (gzip) — TZ §3 va §6 talabi.
 *
 *   npm run build   # dist/zarra.min.js yasaydi (esbuild, npx orqali)
 *   npm run hajm    # shu skript
 *
 * dist/zarra.min.js bo'lsa — haqiqiy o'lchov (minifikatsiyadan keyingi gzip).
 * Bo'lmasa — izohsiz manba bo'yicha konservativ YUQORI baho beriladi.
 */
import { readFileSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const CHEGARA = 3.5 * 1024; // bayt (gzip)
const kb = (n) => (n / 1024).toFixed(2) + ' KB';
const gzip = (b) => gzipSync(b, { level: 9 }).byteLength;

const manba = readFileSync(new URL('../src/zarra.js', import.meta.url), 'utf8');
const minYol = fileURLToPath(new URL('../dist/zarra.min.js', import.meta.url));

console.log('Zarra hajm hisoboti');
console.log('───────────────────────────────');
console.log(`Xom manba:        ${kb(Buffer.byteLength(manba))} (gzip: ${kb(gzip(manba))})`);

let olchov;
let izoh;
if (existsSync(minYol)) {
  const min = readFileSync(minYol);
  olchov = gzip(min);
  izoh = `Minifikatsiya:    ${kb(min.byteLength)} (gzip: ${kb(olchov)})   ← haqiqiy o'lchov`;
} else {
  // dist yo'q — izohsiz manba bo'yicha yuqori baho
  const kichik = manba
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map((q) => q.replace(/^\s+/, ''))
    .filter((q) => q && !q.startsWith('//'))
    .join('\n');
  olchov = gzip(kichik);
  izoh = `Izohsiz (taxmin): ${kb(Buffer.byteLength(kichik))} (gzip: ${kb(olchov)})   ← yuqori baho, "npm run build" aniq o'lchaydi`;
}
console.log(izoh);
console.log('───────────────────────────────');

if (olchov > CHEGARA && existsSync(minYol)) {
  console.error(`✗ CHEGARADAN OSHDI: ${kb(olchov)} > ${kb(CHEGARA)}`);
  process.exit(1);
}
if (olchov > CHEGARA) {
  console.warn(`! Taxminiy baho chegaradan katta (${kb(olchov)}) — aniq o'lchov uchun: npm run build`);
} else {
  console.log(`✓ Chegara ichida: ${kb(olchov)} ≤ ${kb(CHEGARA)} (zaxira: ${kb(CHEGARA - olchov)})`);
}
