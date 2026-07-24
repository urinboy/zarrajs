/**
 * qoshimchalar/tarix-router.js (path-asosli router) testlari — DOM'siz stublar bilan.
 * Modul singleton `yol` signalidan foydalangani uchun testlar BITTA ketma-ket
 * oqim sifatida yozilgan (haqiqiy ilova sahifa umrida qanday ishlashini aks ettiradi).
 */
import { test, teng, rost, kut } from './mini.mjs';

const tinglovchilar = [];
globalThis.window = { addEventListener: (nom, fn) => tinglovchilar.push([nom, fn]) };
globalThis.document = { addEventListener: () => {} };
globalThis.location = { pathname: '/post/7', origin: 'http://localhost' };
const pushStateChaqiruvlar = [];
globalThis.history = {
  pushState: (_holat, _sarlavha, yol) => {
    pushStateChaqiruvlar.push(yol);
    globalThis.location.pathname = yol.split('?')[0].split('#')[0];
  },
};

const { router, navigate } = await import('../qoshimchalar/tarix-router.js');
const { effect } = await import('../src/zarra.js');

const marshrutlar = {
  '/': () => 'bosh',
  '/post/:id': (p) => `post-${p.id}`,
  '/haqida': () => 'haqida',
  '*': () => '404',
};
const komp = router(marshrutlar);
const korilgan = [];
effect(() => korilgan.push(komp()));

test("router: sahifa yuklanganda joriy location.pathname'ga mos marshrut ishlaydi", () => {
  teng(korilgan, ['post-7'], "location.pathname='/post/7' bo'yicha boshlang'ich render");
});

test('navigate(): history.pushState chaqiradi va reaktiv signalni yangilaydi', async () => {
  navigate('/haqida');
  await kut();
  teng(korilgan, ['post-7', 'haqida']);
  rost(pushStateChaqiruvlar.includes('/haqida'), "pushState chaqirilgan bo'lishi kerak");
});

test("router: mos kelmagan yo'lda '*' ishlaydi", async () => {
  navigate('/yoq-sahifa');
  await kut();
  teng(korilgan, ['post-7', 'haqida', '404']);
});

test("router: brauzer orqaga/oldinga tugmasi (popstate) ham signalni yangilaydi", async () => {
  location.pathname = '/'; // brauzer o'zi joylashuvni o'zgartirdi (masalan orqaga qaytish)
  for (const [nom, fn] of tinglovchilar) if (nom === 'popstate') fn();
  await kut();
  teng(korilgan, ['post-7', 'haqida', '404', 'bosh']);
});
