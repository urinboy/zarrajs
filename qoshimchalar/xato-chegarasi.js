/**
 * Zarra qo'shimchasi — errorBoundary: bir bo'lakdagi render xatosi butun ilovani
 * yiqitmasin, o'rniga fallback ko'rsatilsin.
 *
 * Yadroning o'zi bunga muhtoj emas (signal + effect bilan userland darajasida
 * yoziladi), shuning uchun alohida, ixtiyoriy faylda — yadro hajm byudjetiga
 * (3.5 KB) kirmaydi.
 *
 *   zarra('#app', errorBoundary(
 *     () => html`<Xavfli/>`,
 *     (xato) => html`<p>Nimadir xato ketdi: ${xato.message}</p>`,
 *   ))
 *
 * Cheklov: faqat komponent funksiyasining o'zi (sinxron) tashlagan xatoni
 * ushlaydi — ichidagi alohida teshiklarning (${() => ...}) o'z effect'ida
 * keyinroq tashlangan xatosini emas (ular fine-grained bo'lgani uchun allaqachon
 * izolyatsiyalangan — faqat o'sha bitta teshik yangilanishdan to'xtaydi).
 */
import { signal } from '../src/zarra.js';

export function errorBoundary(komponent, fallback) {
  const xato = signal(null);
  return function ChegaralanganKomponent(...argl) {
    const joriyXato = xato();
    if (joriyXato != null) {
      return typeof fallback === 'function' ? fallback(joriyXato) : fallback;
    }
    try {
      return komponent(...argl);
    } catch (x) {
      xato(x);
      return typeof fallback === 'function' ? fallback(x) : fallback;
    }
  };
}
