# Zarra → React / Solid / Vue — o'tish xaritasi

Zarra'ning maqsadi sizni o'zida ushlab qolish emas — dunyo standartlariga
tayyorlash. Bu hujjat Zarra'da o'rgangan har bir tushunchangiz katta
freymvorklarda qanday atalishini ko'rsatadi
(Qadamchi'dagi [`laravel-otish.md`](../../qadamchi/docs/laravel-otish.md) falsafasi).

---

## Tushunchalar lug'ati

| Zarra | React | Solid | Vue 3 |
|---|---|---|---|
| `signal(0)` | `useState(0)` | `createSignal(0)` | `ref(0)` |
| `son()` (o'qish) | `son` | `son()` | `son.value` |
| `son(5)` (yozish) | `setSon(5)` | `setSon(5)` | `son.value = 5` |
| `computed(fn)` | `useMemo(fn, [deps])` | `createMemo(fn)` | `computed(fn)` |
| `effect(fn)` | `useEffect(fn, [deps])` | `createEffect(fn)` | `watchEffect(fn)` |
| `` html`...` `` | JSX | JSX | template |
| `@click=${fn}` | `onClick={fn}` | `onClick={fn}` | `@click="fn"` |
| `@model=${sig}` | `value` + `onChange` | `value` + `onInput` | `v-model` |
| `@if=${sharti}` | `{sharti && <.../>}` | `<Show when={...}>` | `v-if` |
| `.map()` + `key=${id}` | `.map()` + `key={id}` | `<For each={...}>` | `v-for` + `:key` |
| `store({...})` | Context / Zustand | createStore | Pinia / reactive |
| `router({...})` | React Router | Solid Router | Vue Router |
| `zarra('#app', App)` | `createRoot(el).render(<App/>)` | `render(App, el)` | `createApp(App).mount()` |

## Eng yaqin qarindosh — Solid

Zarra'ning reaktivlik modeli Solid bilan deyarli bir xil:

- komponent funksiyasi **bir marta** ishlaydi (fine-grained uslubda), React'dagidek
  har o'zgarishda qayta chaqirilmaydi;
- signal o'qish — funksiya chaqiruvi: `son()` — Solid'da ham aynan shunday;
- bog'liqliklar avtomatik kuzatiladi — dependency array yo'q.

Solid'ga o'tganingizda faqat sintaksis o'zgaradi (JSX), fikrlash modeli emas.

## React'ga o'tganda nimalarga tayyor turish kerak

1. **Komponent har renderda qayta chaqiriladi.** Zarra'da closure ichidagi signal
   yashayveradi; React'da holat `useState` orqali bo'lishi shart.
2. **O'qish uchun chaqiruv yo'q:** `son()` emas, `son`. Yozish alohida funksiya:
   `setSon`.
3. **Bog'liqliklar massivi:** `useEffect(fn, [a, b])` — Zarra/Solid'da avtomatik
   bo'lgan narsani React'da qo'lda yozasiz.
4. **JSX**: `html\`...\`` o'rniga `<div>...</div>` sintaksisi va build bosqichi
   (Vite). `class` → `className`, `@click` → `onClick`.
5. **Immutability odati** sizda allaqachon bor: store'da `[...eski, yangi]`
   yozgan bo'lsangiz, React state bilan ham xuddi shunday ishlaysiz.

## Bir xil kod — uch freymvorkda

Hisoblagich Zarra'da:

```js
const son = signal(0)
zarra('#app', () => html`<button @click=${() => son(son() + 1)}>${son}</button>`)
```

Solid'da:

```jsx
const [son, setSon] = createSignal(0)
render(() => <button onClick={() => setSon(son() + 1)}>{son()}</button>, el)
```

React'da:

```jsx
function App() {
  const [son, setSon] = useState(0)
  return <button onClick={() => setSon(son + 1)}>{son}</button>
}
```

Ko'rib turganingizdek — nomlar boshqa, g'oya bitta. Zarra'ni o'rgangan bo'lsangiz,
qolganlari — bir hafta ichida.
