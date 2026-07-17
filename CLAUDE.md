# CLAUDE.md

Zarra — build bosqichisiz, tashqi bog'liqliksiz ishlaydigan, hajmi 3.5 KB (gzip) dan
oshmaydigan reaktiv JavaScript mikro freymvork. Qadamchi (D:\qadamchi — Composer'siz PHP
mikrofreymvork) bilan bitta oila: ikkalasining maqsadi — o'zbekistonlik yangi dasturchilar
tez o'rgansin va keyin dunyo standartlariga (React/Solid, Laravel) oson o'tsin.

Texnik topshiriq: `docs/Zarra_TZ.docx`. API dizayn qarorlari: `docs/spetsifikatsiya.md`.

## Asosiy tamoyillar

- **Yagona fayl**: butun freymvork `src/zarra.js` ichida — o'quvchi bir faylni o'qib butun
  freymvorkni tushunadi (Qadamchi'dagi `install.php` falsafasi).
- **Nol runtime bog'liqlik**, build bosqichisiz ishlaydi (ESM `<script type="module">`).
- **Hajm chegarasi**: yadro ≤ 3.5 KB gzip (minifikatsiyadan keyin) — `node tools/hajm.mjs`
  bilan tekshiriladi; har katta o'zgarishdan keyin ishga tushirilsin.
- **Xavfsizlik**: interpolyatsiya qilingan qiymatlar hech qachon `innerHTML`ga tushmaydi —
  faqat `textContent`/`setAttribute` orqali (avtomatik XSS-escape).
- Kod ichidagi izohlar va identifikatorlar (lokal o'zgaruvchilar) — o'zbekcha; ochiq API
  nomlari — xalqaro (signal, computed, effect, html, zarra, router, store).
- Testlar: `node tests/ishga.mjs` (o'z mini test-runner'imiz, tashqi bog'liqliksiz);
  render qatlami `tests/brauzer.html` orqali brauzerda tekshiriladi.

## Commit qilish qoidasi

- Har bir tugallangan mustaqil ish (bitta modul, bitta xususiyat, bitta tuzatish) darhol,
  foydalanuvchidan so'ramasdan, alohida git commit sifatida saqlanadi.
- Bir-biriga aloqasi yo'q o'zgarishlarni bitta commitga qo'shma.
- Commit xabari **o'zbek tilida**, qisqa va aniq: birinchi qator — imperativ sarlavha;
  zarur bo'lsa bo'sh qatordan so'ng 1-3 qatorli tushuntiruvchi tana.
- Faqat local commit qil — `git push` hech qachon avtomatik bajarilmaydi, aniq so'ralmaguncha.

## Versiyalash qoidasi (SemVer)

- Versiya yagona manbasi: `src/zarra.js` dagi `VERSION` konstantasi. `package.json` shu
  qiymatga moslab yangilanadi.
- Format — `MAJOR.MINOR.PATCH`. v0.x davrida breaking change'larga ruxsat, lekin
  `CHANGELOG.md`da (Keep a Changelog uslubida, o'zbekcha bo'limlar: Qo'shildi /
  O'zgartirildi / Tuzatildi / Olib tashlandi) qayd etiladi.
- Versiya oshirish alohida so'rovsiz qilinmaydi.
