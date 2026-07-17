# O'zgarishlar tarixi

Format: [Keep a Changelog](https://keepachangelog.com/), versiyalash: [SemVer](https://semver.org/).
Bo'limlar: Qo'shildi / O'zgartirildi / Tuzatildi / Olib tashlandi.

## [0.1.0] — 2026-07-17

### Qo'shildi
- Reaktiv yadro: `signal`, `computed` (dangasa, glitch-free), `effect`
  (microtask batching, dinamik bog'liqlik kuzatuvi, idempotent dispose).
- Render qatlami: `html` tagged template, `zarra()` o'rnatish funksiyasi;
  fine-grained DOM bog'lanishlar (matn, atribut), shablon kompilyatsiyasi keshi.
- Direktivalar: `@hodisa` (@click, @input, ...), `@model` (text/checkbox/select/number),
  `@if` (shartli render), `key` (kalitlangan ro'yxat reconciliation).
- `router()` — hash-asosli SPA marshrutlash (`:param`, `*` fallback).
- `store()` — Proxy asosidagi global reaktiv holat (metodlarda `this` reaktiv).
- Avtomatik XSS himoya: qiymatlar faqat `createTextNode`/`setAttribute` orqali.
- TypeScript deklaratsiyalari (`types/zarra.d.ts`, `Signal<T>` generics).
- Testlar: 26 ta Node testi (o'z mini runner) + 26 ta brauzer testi.
- Vositalar: `tools/hajm.mjs` (3.5 KB gzip nazorati), `tools/server.mjs` (mini statik server).
- 4 ta jonli namuna: hisoblagich, todo, forma validatsiyasi, mini-SPA.
- Hujjatlar: spetsifikatsiya, boshlash, API ma'lumotnomasi, React'ga o'tish xaritasi.
