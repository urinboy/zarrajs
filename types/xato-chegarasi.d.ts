/**
 * Zarra qo'shimchasi — errorBoundary — TypeScript deklaratsiyalari.
 */
import type { Komponent, ShablonNatija, TeshikQiymat } from './zarra.js';

/**
 * Komponentni "xato chegarasi" bilan o'raydi: render vaqtida sinxron xato
 * tashlansa, butun ilova emas, faqat shu bo'lak fallback bilan almashadi.
 *
 *     zarra('#app', errorBoundary(
 *       () => html`<Xavfli/>`,
 *       (xato) => html`<p>Xato: ${xato.message}</p>`,
 *     ))
 *
 * Bir marta xato tutilgach, chegara doimiy fallback holatida qoladi (qayta
 * urinish mexanizmi yo'q — komponent qayta o'rnatilishi kerak).
 */
export function errorBoundary(
  komponent: Komponent,
  fallback: TeshikQiymat | ((xato: unknown) => ShablonNatija | TeshikQiymat)
): Komponent;
