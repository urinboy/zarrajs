/**
 * Zarra qo'shimchasi — lazy (kechiktirilgan komponent yuklash) — TypeScript
 * deklaratsiyalari.
 */
import type { Komponent, ShablonNatija, TeshikQiymat } from './zarra.js';

/**
 * Komponentni birinchi kerak bo'lganda `dynamic import()` orqali yuklaydi.
 *
 *     const Sozlamalar = lazy(() => import('./sozlamalar.js'))
 *
 * Yuklash tugamaguncha `fallback` ko'rsatiladi. Yuklashda xato bo'lsa,
 * keyingi chaqiriqda xato sinxron qayta tashlanadi (errorBoundary bilan tutish
 * mumkin).
 */
export function lazy(
  yuklovchi: () => Promise<{ default: Komponent } | Komponent>,
  fallback?: TeshikQiymat | (() => ShablonNatija | TeshikQiymat)
): Komponent;
