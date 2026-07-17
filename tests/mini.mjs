/**
 * Mini test-runner — tashqi bog'liqliksiz (Qadamchi'ning `php qadamchi test` falsafasi).
 * Testlar `test(nom, fn)` bilan ro'yxatga olinadi, `hammasiniIshga()` ketma-ket bajaradi.
 */

const testlar = [];

export function test(nom, fn) {
  testlar.push({ nom, fn });
}

/** Chuqur tenglik (JSON orqali — testlar uchun yetarli). */
export function teng(haqiqiy, kutilgan, izoh = 'qiymatlar teng emas') {
  const h = JSON.stringify(haqiqiy);
  const k = JSON.stringify(kutilgan);
  if (h !== k) throw new Error(`${izoh}\n    kutilgan: ${k}\n    haqiqiy:  ${h}`);
}

export function rost(qiymat, izoh = 'qiymat rost (truthy) emas') {
  if (!qiymat) throw new Error(izoh);
}

/** Barcha microtask/macrotask'lar tugashini kutadi (batching testlari uchun). */
export const kut = () => new Promise((r) => setTimeout(r, 0));

/** Ro'yxatdagi testlarni bajarib, ro'yxatni tozalaydi. {otdi, yiqildi} qaytaradi. */
export async function hammasiniIshga() {
  let otdi = 0;
  let yiqildi = 0;
  for (const t of testlar) {
    try {
      await t.fn();
      console.log(`  \x1b[32m✓\x1b[0m ${t.nom}`);
      otdi++;
    } catch (x) {
      console.error(`  \x1b[31m✗ ${t.nom}\x1b[0m\n    ${x.message}`);
      yiqildi++;
    }
  }
  testlar.length = 0;
  return { otdi, yiqildi };
}
