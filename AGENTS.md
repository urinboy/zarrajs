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

## Versiyalash qoidasi (SemVer, avtomatik)

- Versiya qo'lda emas, commit xabarlaridan **avtomatik** hisoblanadi
  ([semantic-release](https://semantic-release.gitbook.io/), `master`ga push'da
  GitHub Actions'da ishlaydi — `.github/workflows/release.yml`,
  `.releaserc.json`). To'liq qoida: [CONTRIBUTING.md](./CONTRIBUTING.md).
- Har bir commit [Conventional Commits](https://www.conventionalcommits.org/)
  formatida yozilishi shart: `fix:` -> patch, `feat:` -> minor,
  `feat!:`/`BREAKING CHANGE:` -> major, `docs:`/`chore:`/`refactor:`/`test:`/
  `style:` -> versiya ko'tarilmaydi.
- Versiya yagona manbasi baribir `src/zarra.js` dagi `VERSION` konstantasi —
  CI'da `tools/versiya-sinxron.mjs` uni `package.json` bilan avtomatik
  sinxronlaydi (qo'lda tahrirlanmaydi).
- `CHANGELOG.md` (Keep a Changelog uslubida, o'zbekcha bo'limlar: Qo'shildi /
  O'zgartirildi / Tuzatildi) release paytida avtomatik yangilanadi.
- Qo'lda `npm version`/`npm publish` ishlatilmaydi — to'g'ri commit prefiksi va
  `master`ga push yetarli. Push hali ham avtomatik emas — pastdagi "Commit
  qilish qoidasi"ga ko'ra aniq so'ralmaguncha bajarilmaydi.
