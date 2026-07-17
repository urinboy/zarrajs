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

/* ================================================================
 * 2-QISM · RENDER QATLAMI — html, zarra
 *
 * html`...` statik qismlarni qiymatlardan ajratadi. Statik qismlar
 * (dastur muallifi yozgani) bir marta <template> orqali parse qilinadi
 * va strings massivi bo'yicha keshlanadi. Har bir "teshik" (hole)
 * markerga aylanadi: teg ichida — atribut markeri, tashqarida —
 * <!--komment--> markeri. Keyin daraxt bir marta aylanib chiqilib,
 * har bir marker uchun "ko'rsatma" yoziladi.
 *
 * Nusxa yaratilganda (clone) har bir ko'rsatma "part"ga aylanadi:
 * matn, atribut, hodisa (@click), model (@model), shart (@if).
 * Teshik qiymati funksiya (signal ham funksiya!) bo'lsa, part o'z
 * effect'ini ochadi — qiymat o'zgarganda FAQAT shu DOM tuguni yangilanadi.
 *
 * Xavfsizlik: qiymatlar faqat createTextNode/setAttribute orqali
 * joylanadi — innerHTML'ga hech qachon tushmaydi (avtomatik XSS-escape).
 * ================================================================ */

/** Shablon natijasi: html`...` shuni qaytaradi. */
export function html(strings, ...qiymatlar) {
  return { $zarra: true, strings, qiymatlar };
}

const shablonKesh = new WeakMap(); // strings → kompilyatsiya natijasi
const MARKER = /\$zarra\$(\d+)\$/; // teshik markeri

/** Statik qismlarni bir marta parse qilib, ko'rsatmalar ro'yxatini tuzadi. */
function kompilyatsiya(strings) {
  let tayyor = shablonKesh.get(strings);
  if (tayyor) return tayyor;

  // 1) Markap yasash: teg ichida atribut markeri, tashqarida komment markeri.
  let markap = '';
  for (let i = 0; i < strings.length; i++) {
    markap += strings[i];
    if (i < strings.length - 1) {
      const tegIchida = markap.lastIndexOf('<') > markap.lastIndexOf('>');
      markap += tegIchida ? `$zarra$${i}$` : `<!--$zarra$${i}$-->`;
    }
  }

  const tpl = document.createElement('template');
  tpl.innerHTML = markap;

  // 2) Daraxtni bir marta aylanib, ko'rsatmalarni yig'amiz.
  //    tartib — tugunning aylanishdagi raqami; klonda xuddi shu raqam bilan topiladi.
  const korsatmalar = [];
  let kalitIndeks = null; // key=${...} teshigining raqami (ro'yxat reconciliation uchun)
  const yuruvchi = document.createTreeWalker(tpl.content, 129); // ELEMENT(1) | COMMENT(128)
  let tartib = 0;
  let tugun;
  while ((tugun = yuruvchi.nextNode())) {
    if (tugun.nodeType === 8) {
      const m = /^\$zarra\$(\d+)\$$/.exec(tugun.data);
      if (m) {
        tugun.data = '';
        korsatmalar.push({ tartib, tur: 'matn', i: +m[1] });
      }
    } else {
      for (const atr of [...tugun.attributes]) {
        if (!MARKER.test(atr.value)) continue;
        const nom = atr.name;
        tugun.removeAttribute(nom);
        // split: juft indekslar — statik bo'laklar, toq indekslar — teshik raqamlari
        const bolaklar = atr.value.split(/\$zarra\$(\d+)\$/);
        const indekslar = [];
        const statiklar = [];
        for (let q = 0; q < bolaklar.length; q++) {
          if (q % 2) indekslar.push(+bolaklar[q]);
          else statiklar.push(bolaklar[q]);
        }
        if (nom === 'key') {
          kalitIndeks = indekslar[0]; // DOM'ga yozilmaydi
        } else if (nom[0] === '@') {
          const tur = nom === '@if' ? 'if' : nom === '@model' ? 'model' : 'hodisa';
          korsatmalar.push({ tartib, tur, nom: nom.slice(1), i: indekslar[0] });
        } else {
          korsatmalar.push({ tartib, tur: 'attr', nom, statiklar, indekslar });
        }
      }
    }
    tartib++;
  }

  tayyor = { tpl, korsatmalar, kalitIndeks };
  shablonKesh.set(strings, tayyor);
  return tayyor;
}

/**
 * Umumiy "jonli bog'lanish" yordamchisi: qiymat funksiya bo'lsa (signal ham
 * funksiya!) o'z effect'ini ochadi, oddiy qiymat bo'lsa bir marta joylaydi.
 * Funksiya ichidan funksiya qaytsa — rekursiv hal qilinadi.
 */
function bogla(qoy, qoshimchaOchir) {
  const BOSH = Symbol();
  let oldingi = BOSH;
  let effOchir = null;
  return {
    yangila(v) {
      if (v === oldingi) return; // qiymat o'zgarmagan — DOM'ga tegmaymiz
      oldingi = v;
      if (effOchir) effOchir();
      if (typeof v === 'function') {
        effOchir = effect(() => {
          let x = v;
          while (typeof x === 'function') x = x();
          qoy(x);
        });
      } else {
        effOchir = null;
        qoy(v);
      }
    },
    ochir() {
      if (effOchir) effOchir();
      if (qoshimchaOchir) qoshimchaOchir();
    },
  };
}

/** Matn/kontent teshigi: oddiy qiymat, ichma-ich shablon yoki massiv (ro'yxat). */
function matnPart(ankor, i) {
  let joriyTugunlar = []; // hozir DOM'da turgan tugunlarimiz
  let ichkiNusxa = null; // {strings, nusxa} — ichma-ich shablon
  let royxat = null; // massiv rejimidagi yozuvlar
  let matnTugun = null; // oddiy matn rejimi

  function ichkiOchir() {
    if (ichkiNusxa) ichkiNusxa.nusxa.ochir();
    if (royxat) for (const e of royxat) e.nusxa && e.nusxa.ochir();
  }

  function tozalash() {
    ichkiOchir();
    if (royxat) for (const e of royxat) for (const t of e.tugunlar) t.remove();
    ichkiNusxa = null;
    royxat = null;
    matnTugun = null;
    for (const t of joriyTugunlar) t.remove();
    joriyTugunlar = [];
  }

  /** Ro'yxat yozuvi yaratish (shablon yoki oddiy matn). */
  function yozuvYarat(natija, kalit, strings) {
    if (strings) {
      const nusxa = nusxaYarat(strings);
      nusxa.yangila(natija.qiymatlar);
      return { kalit, strings, nusxa, tugunlar: nusxa.ildizlar };
    }
    const matn = String(natija ?? '');
    return { kalit, strings: null, matn, tugunlar: [document.createTextNode(matn)] };
  }

  /** Kalitlangan reconciliation: qayta ishlatish, tartiblash, ortiqchasini o'chirish. */
  function royxatYangila(yangilar) {
    const eski = royxat;
    const eskiXarita = new Map();
    for (const e of eski) if (!eskiXarita.has(e.kalit)) eskiXarita.set(e.kalit, e);

    const ishlatilgan = new Set();
    const yangiRoyxat = [];
    yangilar.forEach((natija, indeks) => {
      let strings = null;
      let kalit = indeks;
      if (natija && natija.$zarra) {
        strings = natija.strings;
        const ki = kompilyatsiya(strings).kalitIndeks;
        if (ki != null) kalit = natija.qiymatlar[ki];
      }
      const e = eskiXarita.get(kalit);
      if (e && !ishlatilgan.has(e) && e.strings === strings) {
        ishlatilgan.add(e);
        if (strings) e.nusxa.yangila(natija.qiymatlar);
        else if (e.matn !== String(natija ?? '')) {
          e.matn = String(natija ?? '');
          e.tugunlar[0].data = e.matn;
        }
        yangiRoyxat.push(e);
      } else {
        yangiRoyxat.push(yozuvYarat(natija, kalit, strings));
      }
    });

    // olib tashlanganlar: effect'lari bilan birga o'chadi (xotira oqmaydi)
    for (const e of eski) {
      if (!ishlatilgan.has(e)) {
        if (e.nusxa) e.nusxa.ochir();
        for (const t of e.tugunlar) t.remove();
      }
    }

    // DOM tartibi: orqadan oldinga, har yozuv o'z o'rnida bo'lmasa ko'chiriladi
    let keyingi = ankor;
    for (let q = yangiRoyxat.length - 1; q >= 0; q--) {
      const e = yangiRoyxat[q];
      if (!e.tugunlar.length) continue;
      if (e.tugunlar[e.tugunlar.length - 1].nextSibling !== keyingi) {
        for (const t of e.tugunlar) keyingi.parentNode.insertBefore(t, keyingi);
      }
      keyingi = e.tugunlar[0];
    }
    royxat = yangiRoyxat;
  }

  /** Hal qilingan qiymatni DOM'ga joylash. */
  function joyla(x) {
    if (x == null || typeof x === 'boolean' || x === '') {
      tozalash();
      return;
    }
    if (x.$zarra) {
      if (ichkiNusxa && ichkiNusxa.strings === x.strings) {
        ichkiNusxa.nusxa.yangila(x.qiymatlar);
        return;
      }
      tozalash();
      const nusxa = nusxaYarat(x.strings);
      nusxa.yangila(x.qiymatlar);
      ankor.before(nusxa.bolak);
      joriyTugunlar = nusxa.ildizlar;
      ichkiNusxa = { strings: x.strings, nusxa };
      return;
    }
    if (Array.isArray(x)) {
      if (!royxat) {
        tozalash();
        royxat = [];
      }
      royxatYangila(x);
      return;
    }
    // oddiy matn — createTextNode orqali (XSS-escape avtomatik)
    const s = String(x);
    if (matnTugun) {
      if (matnTugun.data !== s) matnTugun.data = s; // tez yo'l: faqat matn yangilanadi
      return;
    }
    tozalash();
    matnTugun = document.createTextNode(s);
    ankor.before(matnTugun);
    joriyTugunlar = [matnTugun];
  }

  const asos = bogla(joyla, ichkiOchir);
  return { yangila: (qiymatlar) => asos.yangila(qiymatlar[i]), ochir: asos.ochir };
}

/** Atribut teshigi: false/null → olib tashlanadi, true → bo'sh atribut. */
function attrPart(el, kor) {
  const { nom, statiklar, indekslar } = kor;
  const yakka = statiklar.length === 2 && !statiklar[0] && !statiklar[1]; // butun-teshik
  let oldingi = null;
  let effOchir = null;

  function qoy(qiymatlar) {
    const hal = indekslar.map((i) => {
      let v = qiymatlar[i];
      while (typeof v === 'function') v = v();
      return v;
    });
    if (yakka) {
      const v = hal[0];
      if (v == null || v === false) el.removeAttribute(nom);
      else el.setAttribute(nom, v === true ? '' : String(v));
    } else {
      let s = statiklar[0];
      for (let q = 0; q < hal.length; q++) {
        s += (hal[q] == null || hal[q] === false ? '' : String(hal[q])) + statiklar[q + 1];
      }
      el.setAttribute(nom, s);
    }
  }

  return {
    yangila(qiymatlar) {
      const vlar = indekslar.map((i) => qiymatlar[i]);
      if (oldingi && vlar.every((v, q) => v === oldingi[q])) return;
      oldingi = vlar;
      if (effOchir) effOchir();
      if (vlar.some((v) => typeof v === 'function')) {
        effOchir = effect(() => qoy(qiymatlar));
      } else {
        effOchir = null;
        qoy(qiymatlar);
      }
    },
    ochir() {
      if (effOchir) effOchir();
    },
  };
}

/** Hodisa teshigi: @click, @input, @submit, ... Tinglovchi bir marta qo'shiladi. */
function hodisaPart(el, kor) {
  let ishlovchi = null;
  el.addEventListener(kor.nom, (h) => ishlovchi && ishlovchi(h));
  return {
    yangila(qiymatlar) {
      ishlovchi = qiymatlar[kor.i];
    },
    ochir() {
      ishlovchi = null;
    },
  };
}

/** @model: forma elementi ↔ signal ikki tomonlama bog'lanish. */
function modelPart(el, i) {
  let sig = null;
  let effOchir = null;
  const chekbox = el.type === 'checkbox';

  // element → signal
  el.addEventListener(chekbox ? 'change' : 'input', () => {
    if (!sig) return;
    if (chekbox) sig(el.checked);
    else if (el.type === 'number' || el.type === 'range') sig(el.value === '' ? '' : +el.value);
    else sig(el.value);
  });

  return {
    yangila(qiymatlar) {
      const yangi = qiymatlar[i];
      if (yangi === sig) return;
      if (typeof yangi !== 'function') {
        console.warn("Zarra: @model qiymati signal bo'lishi kerak");
        return;
      }
      sig = yangi;
      if (effOchir) effOchir();
      // signal → element
      effOchir = effect(() => {
        const v = sig();
        if (chekbox) {
          el.checked = !!v;
        } else {
          const s = v == null ? '' : String(v);
          if (el.value !== s) el.value = s; // kursor sakramasligi uchun tekshiramiz
        }
      });
    },
    ochir() {
      if (effOchir) effOchir();
    },
  };
}

/** @if: truthy — element DOM'da, aks holda o'rnida bo'sh komment turadi. */
function ifPart(el, i) {
  const ankor = document.createComment('if');
  let korinmoqda = true;
  const asos = bogla((v) => {
    const bor = !!v;
    if (bor === korinmoqda) return;
    korinmoqda = bor;
    if (bor) ankor.replaceWith(el);
    else el.replaceWith(ankor);
  });
  return {
    yangila: (qiymatlar) => asos.yangila(qiymatlar[i]),
    ochir() {
      asos.ochir();
      if (!korinmoqda) ankor.remove(); // yashiringan holatda qolgan ankorni tozalaymiz
    },
  };
}

/** Kompilyatsiya qilingan shablondan jonli nusxa (instance) yaratadi. */
function nusxaYarat(strings) {
  const { tpl, korsatmalar, kalitIndeks } = kompilyatsiya(strings);
  const bolak = tpl.content.cloneNode(true);
  if (!bolak.childNodes.length) bolak.appendChild(document.createComment(''));

  // 1-bosqich: ko'rsatmalarga mos tugunlarni topamiz (partlar DOM'ni o'zgartirishi mumkin,
  // shuning uchun avval hammasini topib, keyin partlarni yaratamiz).
  const nishonlar = [];
  if (korsatmalar.length) {
    const yuruvchi = document.createTreeWalker(bolak, 129);
    let tartib = 0;
    let k = 0;
    let tugun;
    while (k < korsatmalar.length && (tugun = yuruvchi.nextNode())) {
      while (k < korsatmalar.length && korsatmalar[k].tartib === tartib) {
        nishonlar.push([korsatmalar[k], tugun]);
        k++;
      }
      tartib++;
    }
  }

  // 2-bosqich: partlarni yaratamiz.
  const partlar = nishonlar.map(([kor, tugun]) => {
    if (kor.tur === 'matn') return matnPart(tugun, kor.i);
    if (kor.tur === 'attr') return attrPart(tugun, kor);
    if (kor.tur === 'hodisa') return hodisaPart(tugun, kor);
    if (kor.tur === 'model') return modelPart(tugun, kor.i);
    return ifPart(tugun, kor.i);
  });

  return {
    kalitIndeks,
    bolak,
    ildizlar: [...bolak.childNodes],
    yangila(qiymatlar) {
      for (const p of partlar) p.yangila(qiymatlar);
    },
    ochir() {
      for (const p of partlar) p.ochir();
    },
  };
}

const NUSXA = Symbol('zarra'); // konteynerga biriktirilgan render holati

/** Natijani konteynerga joylaydi; shablon o'zgarmagan bo'lsa faqat teshiklar yangilanadi. */
function ildizRender(natija, konteyner) {
  while (typeof natija === 'function') natija = natija();
  const holat = konteyner[NUSXA];
  if (natija && natija.$zarra) {
    if (holat && holat.strings === natija.strings) {
      holat.nusxa.yangila(natija.qiymatlar);
      return;
    }
    if (holat) holat.nusxa.ochir();
    konteyner.textContent = '';
    const nusxa = nusxaYarat(natija.strings);
    nusxa.yangila(natija.qiymatlar);
    konteyner.appendChild(nusxa.bolak);
    konteyner[NUSXA] = { strings: natija.strings, nusxa };
  } else {
    if (holat) {
      holat.nusxa.ochir();
      konteyner[NUSXA] = null;
    }
    konteyner.textContent = natija == null || natija === false ? '' : String(natija);
  }
}

/**
 * Komponentni DOM tuguniga o'rnatadi.
 *
 *   zarra('#app', () => html`<h1>Salom, ${ism()}!</h1>`)
 *
 * Komponent funksiyasi effect ichida ishlaydi: ichida o'qilgan signallar
 * o'zgarsa qayta chaqiriladi, lekin DOM'da faqat qiymati o'zgargan
 * teshiklar yangilanadi. Qaytgan funksiya ilovani butunlay o'chiradi.
 */
export function zarra(nishon, komponent) {
  const ildiz = typeof nishon === 'string' ? document.querySelector(nishon) : nishon;
  if (!ildiz) throw new Error(`Zarra: "${nishon}" selektoriga mos element topilmadi`);
  const effOchir = effect(() => {
    ildizRender(typeof komponent === 'function' ? komponent() : komponent, ildiz);
  });
  return () => {
    effOchir();
    const holat = ildiz[NUSXA];
    if (holat) holat.nusxa.ochir();
    ildiz[NUSXA] = null;
    ildiz.textContent = '';
  };
}

/* ================================================================
 * 3-QISM · ROUTER — hash-asosli SPA marshrutlash
 * ================================================================ */

/** `#/post/5` → `/post/5`; hash bo'sh bo'lsa → `/`. */
function joriyYol() {
  const h = location.hash.slice(1);
  return h === '' ? '/' : h;
}

/** `/post/:id` naqshini yo'lga solishtiradi; mos kelsa params, aks holda null. */
function yolMos(naqsh, yol) {
  const nBolaklar = naqsh.split('/');
  const yBolaklar = yol.split('/');
  if (nBolaklar.length !== yBolaklar.length) return null;
  const params = {};
  for (let i = 0; i < nBolaklar.length; i++) {
    if (nBolaklar[i][0] === ':') params[nBolaklar[i].slice(1)] = decodeURIComponent(yBolaklar[i]);
    else if (nBolaklar[i] !== yBolaklar[i]) return null;
  }
  return params;
}

/**
 * Hash-asosli marshrutlash. Natijasi — komponent, `zarra()`ga beriladi:
 *
 *   zarra('#app', router({
 *     '/':         ()       => html`<h1>Bosh sahifa</h1>`,
 *     '/post/:id': (params) => html`<h1>Post №${params.id}</h1>`,
 *     '*':         ()       => html`<h1>404</h1>`,
 *   }))
 *
 * Navigatsiya — oddiy havola: <a href="#/post/5">.
 */
export function router(marshrutlar) {
  const yol = signal(joriyYol());
  window.addEventListener('hashchange', () => yol(joriyYol()));
  return () => {
    const hozirgi = yol(); // effect ichida o'qiladi — hash o'zgarsa qayta render
    for (const naqsh in marshrutlar) {
      if (naqsh === '*') continue;
      const params = yolMos(naqsh, hozirgi);
      if (params) return marshrutlar[naqsh](params);
    }
    return marshrutlar['*'] ? marshrutlar['*']({}) : '';
  };
}

/* ================================================================
 * 4-QISM · STORE — global holat
 * ================================================================ */

/**
 * Oddiy obyektni reaktiv global holatga aylantiradi: har bir maydon
 * signal bilan qoplanadi, metodlar ichida `this` reaktiv ishlaydi.
 *
 *   const doken = store({ son: 0, qoshish() { this.son++ } })
 *   doken.son      // o'qish (effect ichida — kuzatiladi)
 *   doken.son = 5  // yozish — obunachilar yangilanadi
 *
 * Chuqur emas (shallow): massiv/obyekt ichini o'zgartirish kuzatilmaydi,
 * yangisini beriladi: doken.royxat = [...doken.royxat, x]
 */
export function store(obyekt) {
  const signallar = new Map();
  for (const k in obyekt) {
    if (typeof obyekt[k] !== 'function') signallar.set(k, signal(obyekt[k]));
  }
  return new Proxy(obyekt, {
    get(nishon, k, qabul) {
      const sig = signallar.get(k);
      if (sig) return sig();
      const v = Reflect.get(nishon, k, qabul);
      return typeof v === 'function' ? v.bind(qabul) : v;
    },
    set(nishon, k, v) {
      const sig = signallar.get(k);
      if (sig) sig(typeof v === 'function' ? () => v : v);
      else if (typeof v !== 'function') signallar.set(k, signal(v)); // yangi maydon ham reaktiv
      nishon[k] = v;
      return true;
    },
  });
}
