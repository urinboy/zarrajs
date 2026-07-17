/**
 * Zarra — reaktiv JavaScript mikro freymvork.
 *
 * Butun freymvork mana shu bitta faylda: reaktiv yadro (signal, computed, effect),
 * render qatlami (html, zarra), router va store. Fayl boshidan oxirigacha o'qib
 * chiqish = butun freymvorkni tushunish.
 *
 * Falsafa (Qadamchi bilan bir xil):
 *   - build bosqichisiz, tashqi bog'liqliksiz ishlaydi;
 *   - yadro 3.5 KB (gzip) dan kichik;
 *   - interpolyatsiya qilingan qiymatlar hech qachon innerHTML'ga tushmaydi
 *     (avtomatik XSS himoya);
 *   - API dunyo standartlariga mos — keyin Solid/React'ga o'tish oson.
 *
 * @author  UrinboyDev
 * @license MIT
 */

export const VERSION = '0.1.0';

/* ================================================================
 * 1-QISM · REAKTIV YADRO — signal, computed, effect
 *
 * Model: har bir signal o'z obunachilar to'plamini saqlaydi.
 * Effect ishlayotganda o'qilgan har bir signal uni obunachi qilib
 * yozib oladi (dependency tracking). Signal o'zgarganda:
 *   - computed'lar "iflos" deb belgilanadi (dangasa — darhol hisoblanmaydi),
 *   - effect'lar navbatga qo'yilib, bitta microtask'da ishlaydi (batching).
 * Shu tufayli romb (diamond) bog'liqliklarda ham oraliq qiymat
 * ko'rinmaydi — glitch-free.
 * ================================================================ */

let joriy = null; // hozir bajarilayotgan kuzatuvchi (effect yoki computed tuguni)
const navbat = new Set(); // microtask'da ishlashi rejalangan effect'lar
let yuvishRejalangan = false;

/** Effect'ni navbatga qo'yadi; bitta microtask ichidagi yozuvlar birlashadi. */
function rejalashtir(ef) {
  navbat.add(ef);
  if (!yuvishRejalangan) {
    yuvishRejalangan = true;
    queueMicrotask(() => {
      yuvishRejalangan = false;
      for (const e of [...navbat]) {
        navbat.delete(e);
        if (!e.olik) e.ishga();
      }
    });
  }
}

/** Obunachilarga xabar: computed'lar ifloslanadi, effect'lar navbatga qo'yiladi. */
function xabarBer(obunachilar) {
  for (const k of [...obunachilar]) {
    if (k.iflosla) k.iflosla();
    else rejalashtir(k);
  }
}

/** Kuzatuvchining barcha obunalarini bekor qiladi (qayta ishlashdan oldin). */
function obunalarniUz(k) {
  for (const s of k.obunalar) s.delete(k);
  k.obunalar.length = 0;
}

/** Joriy kuzatuvchini berilgan obunachilar to'plamiga qo'shib qo'yadi. */
function kuzat(obunachilar) {
  if (joriy) {
    obunachilar.add(joriy);
    joriy.obunalar.push(obunachilar);
  }
}

/**
 * Reaktiv qiymat yaratadi.
 *
 *   const son = signal(0)
 *   son()            // o'qish  → 0   (effect ichida bo'lsa — kuzatiladi)
 *   son(5)           // yozish  → obunachilar yangilanadi
 *   son(n => n + 1)  // funksiya bilan yangilash
 *
 * Eslatma: funksiyani QIYMAT sifatida saqlash kerak bo'lsa,
 * `son(() => meningFunksiyam)` deb yozing.
 */
export function signal(qiymat) {
  const obunachilar = new Set();
  return function sig(...argl) {
    if (argl.length === 0) {
      kuzat(obunachilar);
      return qiymat;
    }
    const yangi = typeof argl[0] === 'function' ? argl[0](qiymat) : argl[0];
    if (!Object.is(yangi, qiymat)) {
      qiymat = yangi;
      xabarBer(obunachilar);
    }
    return qiymat;
  };
}

/**
 * Bog'liq signallar o'zgarganda qayta ishlaydigan funksiya.
 * Qaytargan funksiya effect'ni butunlay o'chiradi (obunalar tozalanadi).
 */
export function effect(fn) {
  const ef = {
    obunalar: [], // qaysi signal to'plamlariga obuna bo'lganmiz
    olik: false,
    ishga() {
      if (ef.olik) return;
      obunalarniUz(ef); // har safar toza obuna — dinamik bog'liqliklar to'g'ri ishlaydi
      const oldingi = joriy;
      joriy = ef;
      try {
        fn();
      } finally {
        joriy = oldingi;
      }
    },
  };
  ef.ishga();
  return () => {
    ef.olik = true;
    obunalarniUz(ef);
    navbat.delete(ef);
  };
}

/**
 * Hosilaviy, keshlanuvchi qiymat. Dangasa: bog'liqlik o'zgarganda faqat
 * "iflos" belgilanadi, qayta hisoblash keyingi o'qishda bo'ladi.
 */
export function computed(fn) {
  let qiymat;
  let iflos = true;
  const obunachilar = new Set();
  const tugun = {
    obunalar: [],
    iflosla() {
      if (!iflos) {
        iflos = true;
        xabarBer(obunachilar); // ifloslik zanjir bo'ylab pastga tarqaladi
      }
    },
  };
  return function hisoblangan() {
    kuzat(obunachilar);
    if (iflos) {
      obunalarniUz(tugun);
      const oldingi = joriy;
      joriy = tugun;
      try {
        qiymat = fn();
      } finally {
        joriy = oldingi;
      }
      iflos = false;
    }
    return qiymat;
  };
}
