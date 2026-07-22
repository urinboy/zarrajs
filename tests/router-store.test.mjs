/** Router (DOM'siz — window/location stub bilan) va store testlari. */
import { test, teng, rost, kut } from './mini.mjs';

// router modul yuklanganda emas, chaqirilganda window/location'ga murojaat qiladi —
// shuning uchun Node'da stub bilan sinash mumkin.
const tinglovchilar = [];
globalThis.window = {
  addEventListener: (nom, fn) => tinglovchilar.push([nom, fn]),
};
globalThis.location = { hash: '' };

const { router, store, signal, effect, html } = await import('../src/zarra.js');

test("router: bo'sh hash → '/' marshruti", () => {
  location.hash = '';
  const komp = router({ '/': () => 'bosh', '*': () => '404' });
  teng(komp(), 'bosh');
});

test('router: parametrli marshrut params beradi', () => {
  location.hash = '#/post/42';
  const komp = router({ '/post/:id': (p) => `post-${p.id}`, '*': () => '404' });
  teng(komp(), 'post-42');
});

test('router: bir nechta parametr va decodeURIComponent', () => {
  location.hash = '#/user/ali%20vali/kitob/7';
  const komp = router({ '/user/:ism/kitob/:id': (p) => `${p.ism}|${p.id}` });
  teng(komp(), 'ali vali|7');
});

test("router: mos kelmasa '*' ishlaydi, '*' ham bo'lmasa bo'sh string", () => {
  location.hash = '#/yoq/sahifa';
  teng(router({ '/': () => 'bosh', '*': () => '404' })(), '404');
  teng(router({ '/': () => 'bosh' })(), '');
});

test("router: segment soni mos kelmasa marshrut tanlanmaydi", () => {
  location.hash = '#/post';
  const komp = router({ '/post/:id': (p) => 'xato', '*': () => 'togri' });
  teng(komp(), 'togri');
});

test("router: hashchange'da signal yangilanib, effect qayta ishlaydi", async () => {
  location.hash = '#/';
  const komp = router({ '/': () => 'bosh', '/haqida': () => 'haqida' });
  const korilgan = [];
  effect(() => korilgan.push(komp()));
  teng(korilgan, ['bosh']);
  // hash o'zgarishini qo'lda taqlid qilamiz
  location.hash = '#/haqida';
  for (const [nom, fn] of tinglovchilar) if (nom === 'hashchange') fn();
  await kut();
  teng(korilgan, ['bosh', 'haqida']);
});

test("store: o'qish/yozish va effect kuzatuvi", async () => {
  const doken = store({ son: 0 });
  const korilgan = [];
  effect(() => korilgan.push(doken.son));
  teng(korilgan, [0]);
  doken.son = 5;
  await kut();
  teng(korilgan, [0, 5]);
});

test("store: metod ichida this reaktiv ishlaydi", async () => {
  const doken = store({
    son: 10,
    qoshish() {
      this.son++;
    },
  });
  const korilgan = [];
  effect(() => korilgan.push(doken.son));
  doken.qoshish();
  teng(doken.son, 11);
  await kut();
  teng(korilgan, [10, 11]);
});

test("store: keyin qo'shilgan yangi maydon ham reaktiv", async () => {
  const doken = store({ bor: 1 });
  doken.yangi = 'salom';
  const korilgan = [];
  effect(() => korilgan.push(doken.yangi));
  doken.yangi = 'hayr';
  await kut();
  teng(korilgan, ['salom', 'hayr']);
});

test('store: funksiya qiymatni saqlash mumkin (metod emas, qiymat sifatida)', () => {
  const doken = store({ x: 1 });
  const f = () => 99;
  doken.x = f;
  teng(doken.x(), 99, "saqlangan funksiya chaqirilganda o'z natijasini berishi kerak");
});

test('html: strings va qiymatlarni ajratib beradi (DOM talab qilmaydi)', () => {
  const natija = html`<h1>${'salom'}</h1>`;
  rost(natija.$zarra);
  teng(natija.qiymatlar, ['salom']);
  teng([...natija.strings], ['<h1>', '</h1>']);
});

test("router: bir nechta naqsh mos kelsa, obyektda birinchi yozilgani g'olib chiqadi", () => {
  location.hash = '#/post/yangi';
  // ':id' parametrli marshrut ANIQ '/post/yangi' marshrutidan OLDIN yozilgan —
  // shuning uchun 'yangi' ham :id sifatida ushlanadi, pastdagi aniq marshrut ishlamaydi.
  const komp = router({
    '/post/:id': (p) => `id-${p.id}`,
    '/post/yangi': () => 'yangi-sahifa',
  });
  teng(komp(), 'id-yangi', "obyekt xususiyat tartibi marshrut ustuvorligini belgilaydi");
});

test("store: boshlang'ich null/false qiymatlar ham reaktiv signalga o'raladi", async () => {
  const doken = store({ tanlangan: null, yoqilgan: false });
  const korilgan = [];
  effect(() => korilgan.push([doken.tanlangan, doken.yoqilgan]));
  doken.tanlangan = 'ali';
  doken.yoqilgan = true;
  await kut();
  teng(korilgan, [
    [null, false],
    ['ali', true],
  ]);
});
