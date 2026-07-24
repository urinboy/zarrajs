/**
 * Zarra qo'shimchasi — History API (path) asosidagi SPA marshrutlash.
 *
 * Yadrodagi `router()` hash-asosli (`#/post/5`) — build vositasisiz eng oddiy
 * yechim. Bu qo'shimcha esa toza yo'llar kerak bo'lganda (`/post/5`, SEO,
 * server bilan bir xil URL tuzilishi) ishlatiladi. Ikkalasi bir xil nomni
 * (`router`) eksport qiladi — loyihada faqat bittasi tanlanadi.
 *
 *   import { router, navigate } from 'zarrajs/tarix-router'
 *
 *   zarra('#app', router({
 *     '/':          ()  => html`<h1>Bosh sahifa</h1>`,
 *     '/post/:id':  (p) => html`<h1>Post №${p.id}</h1>`,
 *     '*':          ()  => html`<h1>404</h1>`,
 *   }))
 *
 * Oddiy <a href="/post/5"> havolalar avtomatik ushlanadi (to'liq sahifa
 * qayta yuklanmaydi) — yangi tab/target/tashqi domen/Ctrl+bosish holatlari
 * brauzerning odatiy xatti-harakatiga qoldiriladi.
 */
import { signal } from '../src/zarra.js';

let yol = null; // birinchi router()/navigate() chaqiruvida yaratiladi (import paytida location'ga tegmaslik uchun)

function joriyYol() {
  return location.pathname || '/';
}

/** `/post/:id` naqshini yo'lga solishtiradi; mos kelsa params, aks holda null. */
function yolMos(naqsh, hozirgiYol) {
  const nBolaklar = naqsh.split('/');
  const yBolaklar = hozirgiYol.split('/');
  if (nBolaklar.length !== yBolaklar.length) return null;
  const params = {};
  for (let i = 0; i < nBolaklar.length; i++) {
    if (nBolaklar[i][0] === ':') params[nBolaklar[i].slice(1)] = decodeURIComponent(yBolaklar[i]);
    else if (nBolaklar[i] !== yBolaklar[i]) return null;
  }
  return params;
}

/** Global tinglovchilarni bir marta (lazy, idempotent) o'rnatadi. */
function ornat() {
  if (yol) return yol;
  yol = signal(joriyYol());
  window.addEventListener('popstate', () => yol(joriyYol()));
  document.addEventListener('click', (h) => {
    if (h.defaultPrevented || h.button !== 0 || h.metaKey || h.ctrlKey || h.shiftKey || h.altKey) return;
    const a = h.target.closest && h.target.closest('a');
    if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download') || a.origin !== location.origin) {
      return;
    }
    h.preventDefault();
    navigate(a.pathname + a.search + a.hash);
  });
  return yol;
}

/** Dasturiy navigatsiya: brauzer tarixiga yozadi va marshrutni yangilaydi. */
export function navigate(yangiYol) {
  ornat();
  history.pushState(null, '', yangiYol);
  yol(joriyYol());
}

/**
 * Path-asosli SPA marshrutlash. Natijasi — komponent, `zarra()`ga beriladi
 * (imzosi yadrodagi hash-router bilan bir xil).
 */
export function router(marshrutlar) {
  const y = ornat();
  return () => {
    const hozirgi = y();
    for (const naqsh in marshrutlar) {
      if (naqsh === '*') continue;
      const params = yolMos(naqsh, hozirgi);
      if (params) return marshrutlar[naqsh](params);
    }
    return marshrutlar['*'] ? marshrutlar['*']({}) : '';
  };
}
