/** qoshimchalar/lazy.js testlari — DOM talab qilmaydi. */
import { test, teng, rost, kut } from './mini.mjs';
import { effect } from '../src/zarra.js';
import { lazy } from '../qoshimchalar/lazy.js';
import { errorBoundary } from '../qoshimchalar/xato-chegarasi.js';

test("lazy: promise hal bo'lguncha fallback ko'rsatiladi", () => {
  const Komp = lazy(() => new Promise(() => {}), 'yuklanmoqda');
  teng(Komp(), 'yuklanmoqda');
});

test("lazy: promise hal bo'lgach, haqiqiy komponent ishlatiladi", async () => {
  const Ichki = (props) => `salom-${props.ism}`;
  const Komp = lazy(() => Promise.resolve({ default: Ichki }), 'yuklanmoqda');
  const korilgan = [];
  effect(() => korilgan.push(Komp({ ism: 'ali' })));
  teng(korilgan, ['yuklanmoqda']);
  await kut();
  teng(korilgan, ['yuklanmoqda', 'salom-ali']);
});

test('lazy: yuklovchi faqat bir marta chaqiriladi', async () => {
  let chaqiruvSoni = 0;
  const Komp = lazy(() => {
    chaqiruvSoni++;
    return Promise.resolve({ default: () => 'ok' });
  }, '...');
  Komp();
  Komp();
  Komp();
  await kut();
  teng(chaqiruvSoni, 1, "bir necha marta chaqirilsa ham yuklovchi faqat bir marta ishga tushishi kerak");
});

test("lazy: module.default bo'lmasa, modulning o'zi komponent sifatida ishlatiladi", async () => {
  const Funksiya = () => 'togridan-togri';
  const Komp = lazy(() => Promise.resolve(Funksiya), '...');
  const korilgan = [];
  effect(() => korilgan.push(Komp()));
  await kut();
  teng(korilgan, ['...', 'togridan-togri']);
});

test('lazy: yuklashda xato bo\'lsa, keyingi chaqiriqda xato qayta tashlanadi', async () => {
  const Komp = lazy(() => Promise.reject(new Error('tarmoq xatosi')), '...');
  Komp(); // yuklashni boshlaydi (effect tashqarisida — obuna bo'lmaydi)
  await kut();
  let ushlandi = null;
  try {
    Komp();
  } catch (x) {
    ushlandi = x;
  }
  rost(ushlandi instanceof Error);
  teng(ushlandi.message, 'tarmoq xatosi');
});

test("lazy + errorBoundary: yuklash xatosi fallback UI bilan ushlanadi", async () => {
  const Ilova = errorBoundary(
    lazy(() => Promise.reject(new Error("yuklab bo'lmadi")), 'yuklanmoqda'),
    (x) => `xato: ${x.message}`
  );
  const korilgan = [];
  effect(() => korilgan.push(Ilova()));
  teng(korilgan[0], 'yuklanmoqda', "boshida yuklanish holati ko'rsatilishi kerak");
  await kut();
  await kut(); // ichki kaskad (lazy xato -> errorBoundary xato) to'liq barqarorlashishi uchun
  teng(
    korilgan[korilgan.length - 1],
    "xato: yuklab bo'lmadi",
    "oxir-oqibat errorBoundary fallback'i ko'rsatilishi kerak"
  );
});
