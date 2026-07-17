# Zarra — API ma'lumotnomasi (v0.1.0)

Butun ochiq API — 7 ta funksiya va `VERSION` konstantasi. Hammasi
[`src/zarra.js`](../src/zarra.js) dan import qilinadi.

```js
import { signal, computed, effect, html, zarra, router, store, VERSION } from 'zarra'
```

---

## signal(boshlangichQiymat) → sig

Reaktiv qiymat yaratadi. Qaytgan `sig` — funksiya:

| Chaqiruv | Ma'nosi |
|---|---|
| `sig()` | O'qish. Effect/computed ichida bo'lsa — avtomatik kuzatiladi |
| `sig(yangi)` | Yozish. Obunachilar **keyingi microtask'da** yangilanadi (batching) |
| `sig(f)` | `f` funksiya bo'lsa: `sig(f(joriy))` — eski qiymatdan yangisini hisoblash |

- Bir xil qiymat yozilsa (`Object.is`), obunachilar bezovta qilinmaydi.
- Funksiyani **qiymat** sifatida saqlash: `sig(() => meningFunksiyam)`.

```js
const son = signal(0)
son(5); son(6); son(7)  // effect'lar faqat BIR marta, 7 bilan ishlaydi
```

## computed(fn) → () => qiymat

Hosilaviy qiymat. Xususiyatlari:

- **Keshlanadi** — bog'liqliklar o'zgarmaguncha `fn` qayta chaqirilmaydi;
- **Dangasa** — o'zgarish faqat "iflos" belgisini qo'yadi, hisob keyingi o'qishda;
- **Glitch-free** — romb bog'liqliklarda oraliq qiymat hech qachon ko'rinmaydi;
- Zanjir bo'ladi: computed ichida boshqa computed o'qish mumkin.

## effect(fn) → ochirish

`fn`ni darhol ishga tushiradi va ichida o'qilgan signallarga obuna qiladi.
Ular o'zgarsa `fn` qayta ishlaydi (microtask'da). Har qayta ishlashda obunalar
qaytadan yig'iladi — shartli (`if`) o'qishlar to'g'ri ishlaydi.

`ochirish()` chaqirilsa effect o'ladi: barcha obunalar uziladi, navbatdan chiqadi.

## html\`...\` → ShablonNatija

Tagged template. Statik qismlar strings massivi bo'yicha **bir marta** parse
qilinadi va keshlanadi; teshiklar DOM bog'lanishlariga aylanadi.

### Teshik qiymatlari (kontent pozitsiyasida)

| Qiymat | Natija |
|---|---|
| `string` / `number` | Matn tuguni — **avtomatik XSS-escape** |
| `null` / `undefined` / `true` / `false` / `''` | Hech narsa |
| funksiya (signal ham) | **Jonli bog'lanish**: o'z effect'i bor, qiymat rekursiv hal qilinadi |
| `` html`...` `` | Ichma-ich shablon |
| massiv | Ro'yxat (kalitlangan reconciliation) |

### Atribut pozitsiyasida

```js
html`<button disabled=${band} class="tugma ${rang}">`
```

- `false`/`null`/`undefined` → atribut olib tashlanadi;
- `true` → bo'sh atribut (`disabled=""`);
- boshqa → `String(qiymat)`; aralash (statik + teshik) qiymatlar birlashtiriladi;
- funksiya/signal → jonli atribut.

### Direktivalar

| Direktiva | Qiymat | Tavsif |
|---|---|---|
| `@click=${fn}` | funksiya | Hodisa tinglovchisi. Istalgan DOM hodisasi: `@input`, `@submit`, `@keydown`... (kichik harfda) |
| `@model=${sig}` | signal | Ikki tomonlama bog'lanish. text/textarea/select → `value`; checkbox → `checked` (boolean); `type=number/range` → son |
| `@if=${qiymat}` | signal/funksiya/qiymat | Truthy → element DOM'da; falsy → o'rnida bo'sh komment. Yashiringan elementning ichki holati saqlanadi |
| `key=${qiymat}` | istalgan | Ro'yxat elementining barqaror kaliti. DOM'ga atribut sifatida **yozilmaydi** |

### Ro'yxatlar

```js
html`<ul>${() => narsalar().map(n => html`<li key=${n.id}>${n.nom}</li>`)}</ul>`
```

- `key` berilsa — qayta tartiblashda tugunlar **ko'chiriladi** (holat/fokus saqlanadi);
- `key`siz — indeks bo'yicha solishtiriladi (oxiriga qo'shish/olib tashlash uchun yetarli);
- olib tashlangan element bilan birga uning barcha effect'lari o'chadi.

### Cheklovlar (v0.1)

- Shablon matnida yalang'och `<` yozmang — `&lt;` ishlating;
- direktiva qiymati faqat butun teshik: `@click="x ${y}"` — ishlamaydi;
- `@if`ni `.map()` ro'yxat elementining ildiz tegiga qo'ymang (o'rniga ternary
  yoki ichki element ishlating);
- SVG va xom HTML kiritish qo'llab-quvvatlanmaydi;
- HTML kommentlari ichida teshik ishlamaydi.

## zarra(nishon, komponent) → ochirish

Komponentni DOM tuguniga o'rnatadi.

- `nishon` — CSS selektor (`'#app'`) yoki `Element`; topilmasa — xato;
- `komponent` — shablon qaytaruvchi funksiya (yoki tayyor shablon/matn);
- komponent funksiyasi effect ichida ishlaydi: ichida **chaqirilgan** signallar
  (`${son()}` uslubi) o'zgarsa qayta chaqiriladi — lekin DOM'da faqat qiymati
  o'zgargan teshiklar yangilanadi;
- `ochirish()` — butun daraxt effect'lari bilan tozalanadi.

## router(marshrutlar) → komponent

Hash-asosli marshrutlash. Kalitlar — naqshlar, qiymatlar — komponent funksiyalar:

```js
zarra('#app', router({
  '/':          ()  => html`...`,
  '/post/:id':  (p) => html`...${p.id}...`,   // p — {id: '5'} (string)
  '*':          ()  => html`<h1>404</h1>`,    // hech biri mos kelmasa
}))
```

- `#/post/5` → `/post/5`; bo'sh hash → `/`;
- `:nom` segmenti `params[nom]`ga tushadi (`decodeURIComponent` bilan);
- segment soni mos kelishi shart (`/post` naqsh `/post/5` yo'lga mos emas);
- navigatsiya: `<a href="#/yol">` yoki `location.hash = '#/yol'`.

## store(obyekt) → proxy

Global reaktiv holat (Proxy asosida):

```js
const doken = store({
  son: 0,
  royxat: [],
  qoshish() { this.son++ },   // metod: this — proxy, reaktiv ishlaydi
})
```

- Funksiya bo'lmagan har bir maydon — yashirin signal;
- o'qish effect ichida kuzatiladi, yozish obunachilarni yangilaydi;
- keyin qo'shilgan yangi maydonlar ham reaktiv;
- **shallow**: `doken.royxat.push(x)` kuzatilmaydi —
  `doken.royxat = [...doken.royxat, x]` yozing.

## VERSION

Joriy versiya, masalan `'0.1.0'` (SemVer; yagona manba — `src/zarra.js`).
