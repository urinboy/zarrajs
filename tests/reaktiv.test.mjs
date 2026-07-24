/** Reaktiv yadro testlari: signal, computed, effect. */
import { test, teng, rost, kut } from './mini.mjs';
import { signal, computed, effect } from '../src/zarra.js';

test("signal: o'qish va yozish", () => {
  const son = signal(0);
  teng(son(), 0);
  son(5);
  teng(son(), 5);
});

test('signal: funksiya bilan yangilash', () => {
  const son = signal(10);
  son((n) => n + 1);
  teng(son(), 11);
});

test('signal: yozish yangi qiymatni qaytaradi', () => {
  const son = signal(1);
  teng(son(2), 2);
});

test("effect: signalga obuna bo'lib, o'zgarishda qayta ishlaydi", async () => {
  const son = signal(0);
  const korilgan = [];
  effect(() => korilgan.push(son()));
  teng(korilgan, [0], 'effect darhol bir marta ishlashi kerak');
  son(1);
  await kut();
  teng(korilgan, [0, 1]);
});

test('batching: bitta microtask ichidagi bir nechta yozuv — bitta qayta ishlash', async () => {
  const a = signal(1);
  const b = signal(2);
  let ishlashSoni = 0;
  effect(() => {
    a();
    b();
    ishlashSoni++;
  });
  a(10);
  a(20);
  b(30);
  await kut();
  teng(ishlashSoni, 2, 'boshlanish 1 + yangilanish 1 = 2 bo\'lishi kerak');
});

test("signal: bir xil qiymat yozilsa obunachilar bezovta qilinmaydi", async () => {
  const son = signal(7);
  let ishlashSoni = 0;
  effect(() => {
    son();
    ishlashSoni++;
  });
  son(7);
  await kut();
  teng(ishlashSoni, 1);
});

test('computed: keshlanadi — qiymat faqat kerak bo\'lganda qayta hisoblanadi', async () => {
  const son = signal(2);
  let hisobSoni = 0;
  const kvadrat = computed(() => {
    hisobSoni++;
    return son() * son();
  });
  teng(kvadrat(), 4);
  teng(kvadrat(), 4);
  teng(hisobSoni, 1, 'ikkinchi o\'qish keshdan bo\'lishi kerak');
  son(3);
  teng(kvadrat(), 9);
  teng(hisobSoni, 2);
});

test('computed: dangasa — hech kim o\'qimasa qayta hisoblanmaydi', async () => {
  const son = signal(1);
  let hisobSoni = 0;
  const c = computed(() => {
    hisobSoni++;
    return son() * 10;
  });
  c();
  teng(hisobSoni, 1);
  son(2);
  son(3);
  await kut();
  teng(hisobSoni, 1, 'o\'qilmagunga qadar qayta hisob yo\'q');
  teng(c(), 30);
  teng(hisobSoni, 2);
});

test('glitch-free: romb (diamond) bog\'liqlikda effect bir marta, to\'g\'ri qiymat bilan', async () => {
  const a = signal(1);
  const b = computed(() => a() * 2);
  const c = computed(() => a() + 1);
  const korilgan = [];
  effect(() => korilgan.push(b() + c()));
  teng(korilgan, [4], '1*2 + 1+1 = 4');
  a(5);
  await kut();
  teng(korilgan, [4, 16], '5*2 + 5+1 = 16; oraliq (glitch) qiymat bo\'lmasligi kerak');
});

test('computed zanjiri: c2 → c1 → signal', async () => {
  const s = signal(1);
  const c1 = computed(() => s() + 1);
  const c2 = computed(() => c1() * 10);
  const korilgan = [];
  effect(() => korilgan.push(c2()));
  teng(korilgan, [20]);
  s(4);
  await kut();
  teng(korilgan, [20, 50]);
});

test("dinamik bog'liqlik: shart o'zgarganda eski obuna uziladi", async () => {
  const bayroq = signal(true);
  const a = signal('a');
  const b = signal('b');
  let ishlashSoni = 0;
  effect(() => {
    ishlashSoni++;
    bayroq() ? a() : b();
  });
  teng(ishlashSoni, 1);
  bayroq(false); // endi faqat b kuzatiladi
  await kut();
  teng(ishlashSoni, 2);
  a('yangi-a'); // a'ga obuna uzilgan — effect ishlamasligi kerak
  await kut();
  teng(ishlashSoni, 2, "a o'zgarishi effect'ni ishlatmasligi kerak");
  b('yangi-b');
  await kut();
  teng(ishlashSoni, 3);
});

test("effect: dispose qilingach signal o'zgarishi uni ishlatmaydi", async () => {
  const son = signal(0);
  let ishlashSoni = 0;
  const ochir = effect(() => {
    son();
    ishlashSoni++;
  });
  ochir();
  son(99);
  await kut();
  teng(ishlashSoni, 1, "dispose'dan keyin qayta ishlash bo'lmasligi kerak");
});

test("effect: navbatda turganida dispose qilinsa ham ishlamaydi", async () => {
  const son = signal(0);
  let ishlashSoni = 0;
  const ochir = effect(() => {
    son();
    ishlashSoni++;
  });
  son(1); // navbatga qo'yildi
  ochir(); // yuvishdan oldin o'chirildi
  await kut();
  teng(ishlashSoni, 1);
});

test("effect ichida yozish: keyingi microtask'da kaskad ishlaydi", async () => {
  const a = signal(1);
  const b = signal(0);
  effect(() => b(a() * 2));
  const korilgan = [];
  effect(() => korilgan.push(b()));
  teng(korilgan, [2]);
  a(10);
  await kut();
  teng(korilgan, [2, 20]);
});

test("computed: effect ichida o'qilsa, signal kabi kuzatiladi", async () => {
  const son = signal(1);
  const ikki = computed(() => son() * 2);
  const korilgan = [];
  effect(() => korilgan.push(ikki()));
  son(2);
  await kut();
  son(2); // o'zgarmadi
  await kut();
  teng(korilgan, [2, 4]);
});

test("signal: konstruktordagi funksiya chaqirilmasdan, qiymat sifatida saqlanadi", () => {
  const f = () => 42;
  const sig = signal(f);
  rost(sig() === f, "signal(fn) — fn o'zi qiymat bo'lishi kerak, natijasi emas");
});

test('effect: fn birinchi ishga tushganda xato tashlasa, xato yutilmaydi', () => {
  let ushlandi = false;
  try {
    effect(() => {
      throw new Error('atayin');
    });
  } catch (x) {
    ushlandi = true;
    teng(x.message, 'atayin');
  }
  rost(ushlandi, "effect() ichidagi xato tashqariga chiqishi kerak");
});

test("effect: bitta effect xato tashlagandan keyin ham boshqalar normal ishlaydi", async () => {
  const a = signal(1);
  try {
    effect(() => {
      throw new Error('x');
    });
  } catch {}
  const korilgan = [];
  effect(() => korilgan.push(a()));
  a(2);
  await kut();
  teng(korilgan, [1, 2], "oldingi effect'dagi xatodan keyin ham reaktivlik buzilmasligi kerak");
});

test("computed: hisoblashda xato tashlansa, keyingi o'qishda qayta hisoblanadi", () => {
  const rejim = signal('xato');
  let hisobSoni = 0;
  const c = computed(() => {
    hisobSoni++;
    if (rejim() === 'xato') throw new Error("hisoblab bo'lmadi");
    return rejim().length;
  });
  let birinchiXato = null;
  try {
    c();
  } catch (x) {
    birinchiXato = x;
  }
  rost(birinchiXato !== null, 'birinchi oqishda xato chiqishi kerak');
  rejim('togri');
  teng(c(), 5, "xatodan keyin ham qayta hisoblash ishlashi kerak");
  teng(hisobSoni, 2, "xato holatda natija keshlanmasligi, qayta urinish bo'lishi kerak");
});

test("effect: microtask paketida biri xato tashlasa, boshqalari baribir ishlaydi", async () => {
  const a = signal(0);
  const b = signal(0);
  let bIshladi = 0;
  effect(() => {
    if (a() === 1) throw new Error('atayin');
  });
  effect(() => {
    b();
    bIshladi++;
  });
  a(1); // birinchi effect qayta ishlaganda xato tashlaydi
  b(1); // xuddi shu batch'da b ham o'zgargan — u baribir yangilanishi kerak
  await kut();
  teng(bIshladi, 2, "bitta effect'ning xatosi bir xil batch'dagi boshqalarni to'xtatmasligi kerak");
});

test("effect: bitta signalni bir necha marta o'qisa ham, o'zgarishda faqat bir marta ishga tushadi", async () => {
  const a = signal(1);
  let ishlashSoni = 0;
  effect(() => {
    a();
    a();
    a();
    ishlashSoni++;
  });
  teng(ishlashSoni, 1);
  a(2);
  await kut();
  teng(ishlashSoni, 2, "bitta o'zgarish uchun effect faqat bir marta ishga tushishi kerak");
});
