/**
 * Zarra — reaktiv JavaScript mikro freymvork uchun TypeScript deklaratsiyalari.
 * JSDoc bilan birga ishlaydi: JS faylida `// @ts-check` yozsangiz ham kifoya.
 */

/**
 * Reaktiv qiymat (signal). Funksiya sifatida ishlaydi:
 * - `sig()` — o'qish (effect ichida bo'lsa, avtomatik kuzatiladi);
 * - `sig(yangi)` — yozish;
 * - `sig(oldingi => yangi)` — funksiya bilan yangilash.
 */
export interface Signal<T> {
  /** O'qish — effect/computed ichida avtomatik kuzatiladi. */
  (): T;
  /** Yozish — obunachilar keyingi microtask'da yangilanadi. */
  (qiymat: T | ((oldingi: T) => T)): T;
}

/** `html\`...\`` shablonining natijasi — zarra() yoki boshqa shablon ichida ishlatiladi. */
export interface ShablonNatija {
  readonly $zarra: true;
  readonly strings: TemplateStringsArray;
  readonly qiymatlar: unknown[];
}

/** Shablon teshigiga (hole) qo'yish mumkin bo'lgan qiymatlar. */
export type TeshikQiymat =
  | string
  | number
  | boolean
  | null
  | undefined
  | ShablonNatija
  | TeshikQiymat[]
  | (() => TeshikQiymat)
  | Signal<any>
  | ((hodisa: Event) => void);

/** Komponent — shablon (yoki matn) qaytaruvchi oddiy funksiya. */
export type Komponent = () => ShablonNatija | TeshikQiymat;

/** Joriy versiya (SemVer). */
export const VERSION: string;

/**
 * Reaktiv qiymat yaratadi.
 *
 *     const son = signal(0)
 *     son()           // 0
 *     son(5)          // yozish
 *     son(n => n + 1) // yangilash
 *
 * Eslatma: funksiyani QIYMAT sifatida saqlash uchun `son(() => meningFunksiyam)`.
 */
export function signal<T>(boshlangichQiymat: T): Signal<T>;

/**
 * Hosilaviy, keshlanuvchi qiymat. Dangasa: bog'liqlik o'zgarganda faqat
 * "iflos" belgilanadi, qayta hisoblash keyingi o'qishda bo'ladi. Glitch-free.
 */
export function computed<T>(fn: () => T): () => T;

/**
 * Bog'liq signallar o'zgarganda qayta ishlaydigan funksiya.
 * @returns effect'ni butunlay o'chiruvchi funksiya (obunalar tozalanadi).
 */
export function effect(fn: () => void): () => void;

/**
 * Shablon yaratadi. Qiymatlar avtomatik XSS-escape qilinadi.
 *
 *     html`<h1>${ism}</h1><button @click=${bosildi}>OK</button>`
 *
 * Direktivalar: `@click` (istalgan DOM hodisasi), `@model` (signal bilan
 * ikki tomonlama bog'lanish), `@if` (shartli render), `key` (ro'yxat kaliti).
 */
export function html(strings: TemplateStringsArray, ...qiymatlar: TeshikQiymat[]): ShablonNatija;

/**
 * Komponentni DOM tuguniga o'rnatadi.
 *
 *     zarra('#app', () => html`<h1>Salom, ${ism()}!</h1>`)
 *
 * @param nishon    CSS selektor yoki Element
 * @param komponent shablon qaytaruvchi funksiya (yoki tayyor shablon)
 * @returns ilovani butunlay o'chiruvchi funksiya
 */
export function zarra(
  nishon: string | Element,
  komponent: Komponent | ShablonNatija | string
): () => void;

/** Marshrut parametrlari: `/post/:id` → `{ id: '5' }`. */
export type Marshrutlar = Record<string, (params: Record<string, string>) => ShablonNatija | TeshikQiymat>;

/**
 * Hash-asosli SPA marshrutlash. Natijasi — komponent, `zarra()`ga beriladi:
 *
 *     zarra('#app', router({
 *       '/':         ()  => html`<h1>Bosh sahifa</h1>`,
 *       '/post/:id': (p) => html`<h1>Post №${p.id}</h1>`,
 *       '*':         ()  => html`<h1>404</h1>`,
 *     }))
 */
export function router(marshrutlar: Marshrutlar): Komponent;

/**
 * Global reaktiv holat: har bir maydon signal bilan qoplanadi,
 * metodlar ichida `this` reaktiv ishlaydi. Chuqur emas (shallow).
 *
 *     const doken = store({ son: 0, qoshish() { this.son++ } })
 */
export function store<T extends object>(obyekt: T): T;
