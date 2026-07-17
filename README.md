# Zarra

**Zarra** — o'zbekcha hujjatli, build bosqichisiz va tashqi bog'liqliksiz ishlaydigan
reaktiv JavaScript mikro freymvork. Yadro — **3.4 KB gzip** (chegara: 3.5 KB).
Zarra so'zi o'zbekchada "eng kichik bo'lak" degani — falsafasi ham shunda:
minimal yadro, maksimal natija.

Maqsad: boshlang'ich dasturchi **bir kechqurunda** o'rgansin, keyin React/Solid'ga
oson o'tsin. [Qadamchi](../qadamchi) (Composer'siz PHP mikrofreymvork) bilan bitta oila.

- Signal-asosli **fine-grained reaktivlik** — qiymat o'zgarsa, faqat tegishli DOM tuguni yangilanadi
- **Nol bog'liqlik, nol build** — bitta `<script type="module">` teg bilan ishlaydi
- Avtomatik **XSS himoya** — qiymatlar hech qachon `innerHTML`ga tushmaydi
- **Kalitlangan ro'yxat** renderi (React'dagi `key` bilan bir xil idiom)
- Hash-**router** va **store** yadroning ichida
- To'liq **TypeScript** tiplari (`Signal<T>` generics bilan)
- Butun freymvork — **bitta o'qiladigan fayl**: [`src/zarra.js`](src/zarra.js)

> Zamonaviy brauzerlar (ES2020+): Chrome, Firefox, Safari, Edge — so'nggi 2 versiya.

---

## Tez boshlash

Hech narsa o'rnatmasdan, bitta HTML fayl:

```html
<div id="app"></div>

<script type="module">
  import { zarra, html, signal } from './src/zarra.js'  // yoki CDN manzili

  const son = signal(0)

  zarra('#app', () => html`
    <h1>${son}</h1>
    <button @click=${() => son(son() + 1)}>Bosing</button>
  `)
</script>
```

Tamom. Virtual DOM ham, build ham yo'q.

npm bilan (bundler ishlatadiganlar uchun):

```bash
npm install zarra
```

---

## Butun API — 7 ta funksiya

| Funksiya | Vazifasi |
|---|---|
| `signal(qiymat)` | Reaktiv qiymat: `son()` — o'qish, `son(5)` — yozish, `son(n => n+1)` — yangilash |
| `computed(fn)` | Hosilaviy, keshlanuvchi qiymat (glitch-free) |
| `effect(fn)` | Bog'liq signallar o'zgarganda qayta ishlaydi; dispose funksiyasini qaytaradi |
| `` html`...` `` | Shablon: teshiklarga signal, funksiya, shablon yoki massiv qo'yiladi |
| `zarra(nishon, komp)` | Komponentni DOM'ga o'rnatadi; dispose funksiyasini qaytaradi |
| `router(marshrutlar)` | Hash-asosli SPA marshrutlash (`/post/:id` parametrlari bilan) |
| `store(obyekt)` | Global holat: maydonlar signal bilan qoplangan oddiy obyekt |

Direktivalar: `@click` (istalgan DOM hodisasi), `@model` (ikki tomonlama bog'lanish),
`@if` (shartli render), `key` (ro'yxat kaliti). Ro'yxatlar — oddiy `.map()` bilan:

```js
html`<ul>${() => mevalar().map(m => html`<li key=${m.id}>${m.nom}</li>`)}</ul>`
```

> **React'da bu:** xuddi shu — `items.map(...)` va `key`. Zarra'dan React'ga
> o'tganingizda bu odat aynan shu holicha ishlaydi.

---

## Namunalar (`namunalar/`)

```bash
npm run serve   # http://localhost:8090
```

| Fayl | Nimani o'rgatadi |
|---|---|
| [`01-hisoblagich.html`](namunalar/01-hisoblagich.html) | signal, computed, @click |
| [`02-todo.html`](namunalar/02-todo.html) | kalitlangan ro'yxat, @model, @submit, komponent-funksiya |
| [`03-forma.html`](namunalar/03-forma.html) | forma validatsiyasi: computed + @model + disabled |
| [`04-mini-spa.html`](namunalar/04-mini-spa.html) | router (`:id` param) + store (global savat) |

---

## Testlar va vositalar

```bash
npm test        # reaktiv yadro + router + store (Node, o'z mini runner'imiz)
npm run build   # dist/zarra.min.js (esbuild, npx orqali)
npm run hajm    # gzip hajmi ≤ 3.5 KB tekshiruvi
npm run serve   # mini statik server
```

Render qatlami testlari brauzerda: `tests/brauzer.html`ni server orqali oching.

---

## Hujjatlar (`docs/`)

- [`boshlash.md`](docs/boshlash.md) — qadam-baqadam qo'llanma (0 dan SPA gacha)
- [`api.md`](docs/api.md) — to'liq API ma'lumotnomasi
- [`react-otish.md`](docs/react-otish.md) — Zarra → React/Solid o'tish xaritasi
- [`spetsifikatsiya.md`](docs/spetsifikatsiya.md) — dizayn qarorlari va edge-case'lar

---

## Falsafa: nega yana bitta freymvork?

Ko'p loyihalar uchun React yoki Vue — ortiqcha yuk: build pipeline, yuzlab
bog'liqliklar. Zarra teskari yo'ldan boradi: brauzerda allaqachon bor
imkoniyatlardan foydalanadi va faqat yetishmayotgan qatlamni — reaktivlikni
qo'shadi. Har bir tushuncha (signal, komponent, key, store) dunyo
standartlaridagi nomi va ma'nosi bilan berilgan — o'rgangan bilimingiz
boshqa freymvorklarda ham ishlaydi.

## Litsenziya

MIT
