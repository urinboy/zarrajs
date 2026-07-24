# Versiyalash qoidasi

Bu loyihada versiya (`patch`/`minor`/`major`) qo'lda emas, **commit xabarlaridan avtomatik** hisoblanadi ([semantic-release](https://semantic-release.gitbook.io/) orqali, `master`ga har push'da GitHub Actions ichida ishlaydi — `.github/workflows/release.yml`).

Buning uchun har bir commit xabari [Conventional Commits](https://www.conventionalcommits.org/) formatida yozilishi shart:

```
<tur>[ixtiyoriy qamrov]: <qisqa tavsif>

[ixtiyoriy batafsil tavsif]

[ixtiyoriy footer]
```

## Turlar va ular qaysi versiyani ko'taradi

| Commit turi | Versiya | Misol |
|---|---|---|
| `fix:` | **patch** (0.1.0 → 0.1.1) | `fix: effect dispose'dan keyin ham ishga tushib qolishi` |
| `feat:` | **minor** (0.1.0 → 0.2.0) | `feat: computed'ga ikkinchi argument sifatida equals funksiyasi` |
| `feat!:` yoki footer'da `BREAKING CHANGE:` | **major** (0.x davrida ham minor'ga teng ko'tariladi, semantic-release'da 0.x default xatti-harakati — quyidagi eslatmaga qara) | `feat!: store() metodlarida this endi avtomatik bog'lanmaydi` |
| `docs:`, `chore:`, `style:`, `refactor:`, `test:` | versiya ko'tarilmaydi | `docs: README'ga router misoli qo'shildi` |

**Muhim:** turni tanlashda commit necha qatorni o'zgartirganiga emas, balki **paket foydalanuvchisiga ta'siriga** qarang:

- Ochiq API (`signal`, `computed`, `effect`, `html`, `zarra`, `router`, `store` va ularning imzosi/xatti-harakati) buziladigan har qanday o'zgarish — hajmidan qat'i nazar — **major** (`!` bilan yoki `BREAKING CHANGE:` footer bilan belgilang).
- Eski kodni buzmaydigan yangi funksiya/parametr/direktiva — **minor**.
- Tashqi API o'zgarmaydigan tuzatish (reaktivlik bug'i, noto'g'ri render) — **patch**.

> **0.x eslatma:** `package.json`dagi versiya hali `0.x.y`. semantic-release'ning standart xatti-harakati bo'yicha 0.x davrida ham `major` turi versiyaning ikkinchi raqamini (`minor` pozitsiyasini) oshiradi (masalan `0.1.0 -> 0.2.0`), chunki `1.0.0`dan oldin butun paket "beqaror" deb hisoblanadi. Birinchi barqaror API'ga tayyor bo'lganda `npm version major` bilan qo'lda `1.0.0`ga o'tkaziladi.

## Release qanday ishlaydi

1. `master`ga push qilinganda GitHub Actions avval `npm test` va `node tools/hajm.mjs` (3.5 KB gzip chegarasi) ni ishga tushiradi — ikkalasi ham o'tmasa, release umuman boshlanmaydi.
2. Testlar o'tsa, `semantic-release` oxirgi tag'dan beri barcha commit'larni o'qib, eng yuqori darajadagi o'zgarishni aniqlaydi.
3. `package.json` va `src/zarra.js`dagi `VERSION` konstantasi (`tools/versiya-sinxron.mjs` orqali) yangi versiyaga sinxronlanadi, `dist/zarra.min.js` qayta build qilinadi, `CHANGELOG.md` yangilanadi, git tag yaratiladi, GitHub Release ochiladi va `npm publish` qilinadi — hammasi avtomatik.
4. Agar push qilingan commit'lar orasida `fix`/`feat` bo'lmasa (masalan faqat `docs`/`chore`), yangi versiya chiqarilmaydi.

Shuning uchun qo'lda `npm version` yoki `npm publish` ishlatish **kerak emas** — shunchaki to'g'ri prefiks bilan commit yozib, `master`ga push qilish yetarli. Push hali ham avtomatik emas — CLAUDE.md/AGENTS.md'dagi qoidaga ko'ra aniq so'ralmaguncha bajarilmaydi.
