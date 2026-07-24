/**
 * Zarra qo'shimchasi — History API (path) router — TypeScript deklaratsiyalari.
 */
import type { Komponent, Marshrutlar } from './zarra.js';

/**
 * Path-asosli SPA marshrutlash (`/post/5`). Yadrodagi hash-router bilan bir
 * xil imzo — natijasi `zarra()`ga beriladi. Oddiy `<a href="/yol">`
 * havolalar avtomatik ushlanadi (sahifa qayta yuklanmaydi).
 */
export function router(marshrutlar: Marshrutlar): Komponent;

/** Dasturiy navigatsiya: brauzer tarixiga yozadi va marshrutni yangilaydi. */
export function navigate(yangiYol: string): void;
