/**
 * Zarra qo'shimchasi — komponentni birinchi kerak bo'lganda (dynamic `import()`
 * orqali) yuklaydi. Build vositasisiz kod bo'lish (code-splitting): brauzer
 * `import()`ni build vositasi bo'lmasa ham tushunadi.
 *
 *   const Sozlamalar = lazy(() => import('./sozlamalar.js'), () => html`<p>Yuklanmoqda...</p>`)
 *   zarra('#app', () => html`<div>${Sozlamalar}</div>`)
 *
 * Yuklash tugamaguncha `fallback` ko'rsatiladi. Yuklashda xato bo'lsa, keyingi
 * chaqiriqda xato sinxron qayta tashlanadi — buni errorBoundary bilan tutish
 * mumkin: `errorBoundary(lazy(...), (xato) => ...)`.
 */
import { signal } from '../src/zarra.js';

export function lazy(yuklovchi, fallback = '') {
  const komp = signal(null);
  const xato = signal(null);
  let boshlandi = false;
  return function KechiktirilganKomponent(...argl) {
    const x = xato();
    if (x) throw x;
    if (!boshlandi) {
      boshlandi = true;
      yuklovchi()
        .then((m) => komp(() => (m && m.default) || m))
        .catch((e) => xato(e));
    }
    const K = komp();
    if (K) return K(...argl);
    return typeof fallback === 'function' ? fallback() : fallback;
  };
}
