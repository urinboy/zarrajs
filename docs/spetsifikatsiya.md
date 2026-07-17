# Zarra — API spetsifikatsiyasi (v0.1)

TZ'ning 1-bosqichi natijasi: har bir ochiq funksiya imzosi, edge-case'lar va TZ'dan
qilingan ongli chetlanishlar (sababi bilan). Bu hujjat — implementatsiya uchun yagona
haqiqat manbasi.

---

## Ochiq API — 7 ta funksiya + 1 konstanta

| Nomi | Imzo | Vazifasi |
|---|---|---|
| `signal(boshlangich)` | `→ sig` (funksiya) | Reaktiv qiymat. `sig()` — o'qish, `sig(yangi)` — yozish, `sig(f => f + 1)` — funksiya bilan yangilash |
| `computed(fn)` | `→ () => qiymat` | Hosilaviy, keshlanuvchi, glitch-free qiymat |
| `effect(fn)` | `→ ochirish()` | Bog'liq signallar o'zgarganda qayta ishlaydi; qaytgan funksiya effect'ni o'chiradi |
| `html` | tagged template | Shablon yaratadi: `` html`<h1>${ism}</h1>` `` |
| `zarra(nishon, komponent)` | `→ ochirish()` | Komponentni DOM tuguniga o'rnatadi (`'#app'` yoki Element) |
| `router(marshrutlar)` | `→ komponent` | Hash-asosli SPA marshrutlash; natijasi `zarra()`ga beriladi |
| `store(obyekt)` | `→ proxy` | Global holat: har bir maydon signal bilan qoplangan oddiy obyekt |
| `VERSION` | `string` | Joriy versiya (SemVer) |

## TZ'dan chetlanishlar va sabablari

### 1. `html` tagged template qo'shildi (7-funksiya)

TZ'dagi namunalar oddiy template string ishlatadi:

```js
zarra('#app', () => `<button @click=${() => son(son()+1)}>+</button>`)
```

Oddiy string ichida `${funksiya}` **matnga aylanib ketadi** — hodisa tinglovchisini
haqiqiy funksiya sifatida uzatishning iloji yo'q. Bundan tashqari TZ o'zi ikkita talabni
qo'yadi: (a) barcha qiymatlar avtomatik XSS-escape bo'lsin, (b) fine-grained binding
bo'lsin. Ikkalasi ham faqat **tagged template** bilan bajariladi: tag statik qismlarni
qiymatlardan ajratib oladi, qiymatlar `textContent` orqali joylanadi (escape avtomatik),
har bir "teshik" (hole) alohida DOM bog'lanishiga aylanadi.

Bu dunyo standarti bilan ham mos: lit-html, uhtml, htm — hammasi shu yo'ldan boradi.

### 2. `@for` direktivasi o'rniga `.map()` + `key`

```js
html`<ul>${mevalar().map(m => html`<li key=${m.id}>${m.nom}</li>`)}</ul>`
```

Sabab: alohida sikl sintaksisini o'rganish shart emas — oddiy JavaScript `.map()`
ishlatiladi, **React'da ham xuddi shunday** (o'tish oson — Qadamchi'ning "Laravel'da bu..."
falsafasi). `key` atributi kalitlangan reconciliation uchun (React'dagi `key` bilan bir xil
ma'no). `key` berilmasa — indeks bo'yicha solishtiriladi.

`@if` direktivasi saqlanadi (TZ bo'yicha), lekin ternary ham ishlaydi:
`${ochiq() ? html`...` : ''}`.

## Reaktivlik modeli

### Ikki uslub — ikkalasi ham to'g'ri

```js
// 1) Oson uslub (boshlovchi): signalni chaqirib qo'yish
zarra('#app', () => html`<h1>${son()}</h1>`)
// komponent funksiyasi effect ichida ishlaydi: son o'zgarsa komponent qayta chaqiriladi,
// lekin DOM'da faqat qiymati o'zgargan teshiklar yangilanadi (qiymat diff — DOM diff emas).

// 2) Fine-grained uslub: signalning o'zini (yoki funksiya) berish
zarra('#app', () => html`<h1>${son}</h1>`)
// komponent BIR marta chaqiriladi; teshik o'z effect'iga ega bo'lib,
// son o'zgarganda faqat shu matn tuguni yangilanadi.
```

Qoida: **teshikka funksiya berilsa — jonli bog'lanish** (signal ham funksiya!), oddiy
qiymat berilsa — o'sha renderdagi qiymat.

### Batching

Bitta microtask ichidagi barcha yozuvlar bitta yangilanishga yig'iladi
(`queueMicrotask`). Effect'lar yozuvdan keyin sinxron emas, microtask'da ishlaydi.

### Glitch-free computed

`computed` dangasa (lazy) va keshlanadi: bog'liqlik o'zgarganda faqat "iflos" deb
belgilanadi, qiymat keyingi o'qishda qayta hisoblanadi. Effect'lar microtask'da ishlagani
uchun romb (diamond) bog'liqliklarda ham oraliq (noto'g'ri) qiymat hech qachon ko'rinmaydi,
va bitta o'zgarish uchun effect faqat bir marta ishlaydi.

### Xotira

- `effect()` qaytargan funksiya chaqirilsa, barcha obunalar bekor qilinadi.
- `zarra()` qaytargan funksiya butun daraxtdagi effect'larni o'chiradi.
- Ro'yxatdan olib tashlangan element, `@if` bilan yashiringan bo'lak — bog'liq effect'lari
  bilan birga tozalanadi (aniqroq: ro'yxat elementi o'chirilganda effect'lari dispose
  bo'ladi; `@if`da element DOM'dan chiqadi, lekin ichki effect'lar tirik qoladi — qayta
  ko'rsatilganda holat saqlanib qolishi uchun; bu hujjatlashtirilgan qaror).

## Direktivalar

| Direktiva | Qiymat | Vazifasi |
|---|---|---|
| `@click=${fn}` (istalgan hodisa: `@input`, `@submit`, ...) | funksiya | `addEventListener(nom, fn)` |
| `@model=${sig}` | **signal** | Ikki tomonlama bog'lanish: text/textarea/select → `value`+`input/change`, checkbox → `checked`+`change`, `type=number/range` → songa aylantiriladi |
| `@if=${sig \| fn \| qiymat}` | ixtiyoriy | Truthy bo'lsa element DOM'da, aks holda o'rnida bo'sh komment turadi |
| `key=${qiymat}` | ixtiyoriy | Ro'yxat reconciliation kaliti; DOM'ga atribut sifatida yozilmaydi |

## Atribut bog'lanishlari

```js
html`<button disabled=${band} class="tugma ${rang()}">`
```

- `false` / `null` / `undefined` → atribut olib tashlanadi (boolean atributlar uchun qulay);
- `true` → bo'sh atribut (`disabled=""`);
- boshqa → `String(qiymat)` (aralash statik+dinamik qiymatlar birlashtiriladi).

## Teshik (hole) qiymatlarining turlari

| Qiymat | Natija |
|---|---|
| `string` / `number` | Matn tuguni (escape avtomatik) |
| `null` / `undefined` / `false` / `true` | Hech narsa (bo'sh) |
| funksiya (signal ham) | Jonli bog'lanish: o'z effect'i, qiymati rekursiv hal qilinadi |
| `` html`...` `` | Ichma-ich shablon (o'z partlari bilan) |
| massiv | Kalitlangan ro'yxat renderi |

## router()

```js
zarra('#app', router({
  '/':          ()       => html`<h1>Bosh sahifa</h1>`,
  '/post/:id':  (params) => html`<h1>Post №${params.id}</h1>`,
  '*':          ()       => html`<h1>404</h1>`,
}))
```

- Hash-asosli: `#/post/5` → `/post/5`; hash bo'sh bo'lsa → `/`.
- `:nom` segmentlari `params` obyektiga tushadi (string sifatida).
- `*` — hech biri mos kelmasa. `*` ham yo'q bo'lsa — bo'sh render.
- Navigatsiya — oddiy havola: `<a href="#/post/5">`.

## store()

```js
const doken = store({
  son: 0,
  qoshish() { this.son++ },
})
doken.son      // o'qish (effect ichida — kuzatiladi)
doken.son = 5  // yozish (obunachilar yangilanadi)
```

- Har bir funksiya-bo'lmagan maydon signal bilan qoplanadi (Proxy).
- Metodlar ichida `this` — proxy'ning o'zi: `this.son++` reaktiv ishlaydi.
- Keyin qo'shilgan yangi maydonlar ham reaktiv bo'ladi.
- Chuqur emas (shallow): `doken.royxat.push(x)` kuzatilmaydi —
  `doken.royxat = [...doken.royxat, x]` ishlatiladi (React'dagi immutability odati bilan bir xil).

## Ko'lamga kirmaydi (v0.1)

- SSR, virtual DOM, JSX (TZ bo'yicha ham).
- SVG namespace'li shablonlar.
- Xom HTML kiritish (ataylab yo'q — xavfsizlik; kerak bo'lsa kelajakda alohida, oshkora API).
- Shablon matnida yalang'och `<` belgisi (`&lt;` yozilsin) — parser cheklovi.
- `@if` / `@model` / `@hodisa` qiymati faqat butun-teshik bo'lishi kerak
  (`@click="x ${y}"` kabi aralash qiymat — xato).

## Qabul mezonlari (TZ §6 bilan mos)

1. Yadro ≤ 3.5 KB gzip (`node tools/hajm.mjs`).
2. Reaktiv yadro Node testlari to'liq o'tadi (`node tests/ishga.mjs`).
3. Render qatlami brauzer testlari o'tadi (`tests/brauzer.html`).
4. Effect dispose → obunalar to'liq tozalanadi (test bilan).
5. Ochiq API to'liq tiplangan (`types/zarra.d.ts`).
