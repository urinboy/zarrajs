# Zarra — boshlash qo'llanmasi

Bu qo'llanma sizni 0 dan ishlaydigan SPA gacha olib boradi. Har bo'limda
**"React'da bu..."** eslatmasi bor — Zarra'da o'rgangan har bir tushuncha
dunyo freymvorklarida ham xuddi shu ma'noda ishlaydi.

---

## 1. Birinchi sahifa

Bitta HTML fayl yarating — build ham, npm ham kerak emas:

```html
<!DOCTYPE html>
<html>
<body>
<div id="app"></div>

<script type="module">
  import { zarra, html, signal } from './src/zarra.js'

  const ism = signal('dunyo')

  zarra('#app', () => html`<h1>Salom, ${ism}!</h1>`)
</script>
</body>
</html>
```

Faylni server orqali oching (`npm run serve` yoki istalgan statik server) —
brauzer ES modullarni `file://` dan yuklamaydi.

> **React'da bu:** `createRoot(...).render(<App />)`. Farqi: JSX yo'q,
> kompilyatsiya yo'q — brauzer tushunadigan sof JavaScript.

## 2. Signal — reaktivlikning yuragi

Signal — qiymat saqlaydigan funksiya:

```js
const son = signal(0)

son()           // o'qish  → 0
son(5)          // yozish  → 5
son(n => n + 1) // funksiya bilan yangilash → 6
```

Effect ichida o'qilgan signal **avtomatik kuzatiladi** — qiymat o'zgarsa,
effect qayta ishlaydi:

```js
import { effect } from './src/zarra.js'

effect(() => console.log(`Hozirgi son: ${son()}`))
son(10) // konsolga "Hozirgi son: 10" chiqadi
```

> **React'da bu:** `useState` + `useEffect`. Farqi: bog'liqliklar massivini
> (`[son]`) qo'lda yozish shart emas — Zarra o'zi biladi.
> **Solid'da bu:** `createSignal` — deyarli bir xil.

## 3. Shablon va teshiklar

`html` — tagged template. `${...}` teshiklariga nima qo'ysangiz, shunga
qarab ishlaydi:

```js
html`
  <p>${matn}</p>            <!-- oddiy qiymat: bir marta yoziladi -->
  <p>${sig}</p>             <!-- signal: jonli — o'zgarsa shu tugun yangilanadi -->
  <p>${() => sig() * 2}</p> <!-- funksiya: jonli ifoda -->
  <div>${IchkiKomponent()}</div>  <!-- boshqa shablon -->
  <ul>${royxat.map(...)}</ul>    <!-- massiv: ro'yxat -->
`
```

**Oltin qoida:** teshikka **funksiya** berilsa — jonli bog'lanish
(signal ham funksiya!), oddiy **qiymat** berilsa — o'sha renderdagi holat.

Xavfsizlik avtomatik: `${'<b>x</b>'}` matn sifatida chiqadi, HTML sifatida emas.

## 4. Hodisalar va formalar

```js
const ism = signal('')

zarra('#app', () => html`
  <input @model=${ism} placeholder="Ismingiz">
  <button @click=${() => alert(ism())}>Salomlashish</button>
  <p @if=${() => ism().length > 0}>Yozayapsiz: ${ism}</p>
`)
```

- `@click`, `@input`, `@submit`, ... — istalgan DOM hodisasi;
- `@model` — forma elementi bilan signal orasida ikki tomonlama bog'lanish
  (checkbox → `true/false`, `type=number` → son);
- `@if` — truthy bo'lsa element DOM'da, aks holda yo'q.

> **React'da bu:** `onClick`, `onChange` + `value` (boshqariladigan input).
> `@model` — Vue'dagi `v-model`ning aynan o'zi.

## 5. Komponent = oddiy funksiya

```js
const Tugma = ({ matn, bosilganda }) => html`
  <button class="tugma" @click=${bosilganda}>${matn}</button>
`

zarra('#app', () => html`
  <div>
    ${Tugma({ matn: 'Saqlash', bosilganda: saqla })}
    ${Tugma({ matn: 'Bekor', bosilganda: bekor })}
  </div>
`)
```

Klass yo'q, lifecycle yo'q. Holat kerak bo'lsa — yopilma (closure) ichida signal:

```js
function Hisoblagich() {
  const son = signal(0)   // har chaqiruvda o'z holati
  return html`<button @click=${() => son(son() + 1)}>${son}</button>`
}
```

> **React'da bu:** funksiya-komponent + props. Farqi: Zarra komponentni qayta
> chaqirmaydi, shuning uchun signal'ni to'g'ridan-to'g'ri closure'da saqlash mumkin.

## 6. Ro'yxatlar

Oddiy `.map()` + `key`:

```js
const mevalar = signal([
  { id: 1, nom: 'olma' },
  { id: 2, nom: 'anor' },
])

zarra('#app', () => html`
  <ul>${() => mevalar().map(m => html`<li key=${m.id}>${m.nom}</li>`)}</ul>
`)
```

`key` — elementning barqaror identifikatori. Ro'yxat qayta tartiblansa,
DOM tugunlari **ko'chiriladi**, qayta yaratilmaydi (holat va fokus saqlanadi).

> **React'da bu:** aynan shu — `items.map(...)` va `key` prop. Bilim
> to'g'ridan-to'g'ri ko'chadi.

## 7. computed — hosilaviy qiymat

```js
const narx = signal(120_000)
const soni = signal(2)
const jami = computed(() => narx() * soni())  // keshlanadi, o'zi yangilanadi
```

## 8. store — global holat

Sahifalar/komponentlar orasida umumiy holat:

```js
const doken = store({
  savat: [],
  qoshish(mahsulot) { this.savat = [...this.savat, mahsulot] },
})

doken.savat      // o'qish (effect ichida kuzatiladi)
doken.qoshish(x) // metod — this reaktiv ishlaydi
```

Diqqat: store chuqur emas — massivni o'zgartirmang, yangisini bering
(`[...eski, yangi]`). Bu React'dagi immutability odati bilan bir xil.

> **React'da bu:** Context/Zustand. **Vue'da bu:** Pinia/reactive.

## 9. router — SPA

```js
zarra('#app', router({
  '/':         ()  => BoshSahifa(),
  '/post/:id': (p) => Post(p.id),
  '*':         ()  => html`<h1>404</h1>`,
}))
```

Navigatsiya — oddiy havola: `<a href="#/post/5">`. Hash o'zgarganda kerakli
komponent renderlanadi, sahifa qayta yuklanmaydi.

## 10. Keyingi qadam

- To'liq ma'lumotnoma: [`api.md`](api.md)
- Jonli namunalar: [`../namunalar/`](../namunalar/) (`npm run serve` bilan oching)
- React/Solid'ga o'tish xaritasi: [`react-otish.md`](react-otish.md)
