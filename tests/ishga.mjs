/**
 * Barcha *.test.mjs fayllarni yuklab, testlarni ishga tushiradi:
 *   node tests/ishga.mjs
 *
 * Eslatma: bu yerda faqat DOM talab qilmaydigan testlar (reaktiv yadro, router
 * mosligi, store). Render qatlami testlari — tests/brauzer.html (brauzerda ochiladi).
 */
import { readdirSync } from 'node:fs';
import { hammasiniIshga } from './mini.mjs';

const papka = new URL('.', import.meta.url);
const fayllar = readdirSync(papka).filter((f) => f.endsWith('.test.mjs')).sort();

let jamiOtdi = 0;
let jamiYiqildi = 0;

for (const fayl of fayllar) {
  console.log(`\n${fayl}`);
  await import(new URL(fayl, papka));
  const { otdi, yiqildi } = await hammasiniIshga();
  jamiOtdi += otdi;
  jamiYiqildi += yiqildi;
}

console.log(`\nJami: ${jamiOtdi} ta o'tdi, ${jamiYiqildi} ta yiqildi`);
process.exit(jamiYiqildi ? 1 : 0);
