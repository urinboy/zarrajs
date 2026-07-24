/** qoshimchalar/xato-chegarasi.js (errorBoundary) testlari — DOM talab qilmaydi. */
import { test, teng, rost, kut } from './mini.mjs';
import { effect, signal, html } from '../src/zarra.js';
import { errorBoundary } from '../qoshimchalar/xato-chegarasi.js';

test("errorBoundary: xato bo'lmasa, komponent natijasini aynan qaytaradi", () => {
  const Komp = errorBoundary(() => 'salom', () => 'xato');
  teng(Komp(), 'salom');
});

test('errorBoundary: komponent xato tashlasa, fallback qaytariladi (xato tashqariga chiqmaydi)', () => {
  const Komp = errorBoundary(() => {
    throw new Error('portla');
  }, () => 'fallback');
  teng(Komp(), 'fallback');
});

test("errorBoundary: fallback funksiya bo'lsa, xato obyekti unga uzatiladi", () => {
  let olinganXato = null;
  const Komp = errorBoundary(
    () => {
      throw new Error('sabab');
    },
    (x) => {
      olinganXato = x;
      return 'fallback';
    }
  );
  Komp();
  rost(olinganXato instanceof Error);
  teng(olinganXato.message, 'sabab');
});

test("errorBoundary: fallback oddiy qiymat (funksiya emas) bo'lsa ham ishlaydi", () => {
  const Komp = errorBoundary(() => {
    throw new Error('x');
  }, 'statik-xabar');
  teng(Komp(), 'statik-xabar');
});

test("errorBoundary: bir marta xato tutilgach, komponent qaytadan chaqirilmaydi", () => {
  let chaqiruvSoni = 0;
  const Komp = errorBoundary(() => {
    chaqiruvSoni++;
    throw new Error('x');
  }, () => 'fallback');
  Komp();
  Komp();
  teng(chaqiruvSoni, 1, "xato tutilgach, komponent qayta chaqirilmasligi kerak");
});

test('errorBoundary: effect ichida ishlatilganda, xatodan keyin ham reaktivlik davom etadi', async () => {
  const bayroq = signal(false);
  const Komp = errorBoundary(() => {
    if (bayroq()) throw new Error('portladi');
    return 'togri';
  }, () => 'fallback');
  const korilgan = [];
  effect(() => korilgan.push(Komp()));
  teng(korilgan, ['togri']);
  bayroq(true);
  await kut();
  // errorBoundary o'zi ham `xato` signalini o'qiydi — tutilgan xato uni yozgach,
  // effect bitta qo'shimcha marta o'zini o'zi qayta ishga tushiradi ("barqarorlashish").
  teng(korilgan, ['togri', 'fallback', 'fallback']);
});

test('errorBoundary: html shablon qaytaruvchi komponent bilan ishlaydi', () => {
  const Komp = errorBoundary(() => html`<p>${'ok'}</p>`, () => html`<p>xato</p>`);
  const natija = Komp();
  rost(natija.$zarra);
  teng(natija.qiymatlar, ['ok']);
});
