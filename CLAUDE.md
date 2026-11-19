# Dolanık (kuantum_first): geliştirici notları

Tarayıcıda çalışan, bağımlılıksız bir kuantum devre bulmaca oyunu. İki dilli (Türkçe varsayılan, İngilizce);
dil tarayıcıdan algılanır.

## Kurallar
- **Bağımlılık yok.** Saf ES modülleri, derleme adımı yok. Tarayıcıya npm paketi eklenmez.
  Python/Qiskit yalnızca CI doğrulamasında kullanılır.
- **Bit sırası:** kübit 0, ket yazımında en soldaki bittir (`|q0 q1 …⟩`). Qiskit tersini kullanır;
  `tests/qiskit/verify.py` bunu `reverse_qargs()` ile düzeltir.
- `js/quantum.js`, `js/noise.js`, `js/game.js`, `js/qasm.js`, `js/levels.js` DOM'a dokunmaz (Node'da test edilir).
  DOM kodu yalnızca `js/app.js`, `js/viz.js`, `js/audio.js`, `js/space.js`, `js/burst.js` ve `js/fx.js` içindedir.
- **Performans:** hareketli arka planın üstündeki öğelerde `backdrop-filter` ya da büyük `filter: blur` kullanma
  (her karede yeniden hesaplanır). Yeni animasyonlar `prefers-reduced-motion` tercihine uymalı.
- **Metinler:** arayüze kod içinde düz metin yazma; `js/strings.js`'e her iki dilde anahtar ekle ve `t()` kullan.
  Yeni bölümün İngilizcesini `js/levels-en.js`'e ekle. `tests/i18n.test.mjs` eksikleri yakalar.
- **Tasarım dili ("Uzay atlası"):** renkleri `:root` değişkenlerinden al (kâğıt/mürekkep, zencefre, kobalt, safran,
  yeşim, gül); yaprak köşeler, baskı gölgeleri. Süs olarak gökkuşağı geçişi kullanma: çok renk yalnızca
  fazı gösteren veride (genlik çemberleri, faz tekerleği) olur. Her bölüm başlığında bir "?" açıklaması bulunur. Yeni yazı tipi eklenecekse `fonts/` altına gömülür,
  dış kaynaktan yüklenmez. Yayın iş akışı `fonts/` klasörünü de kopyalar.
- Her yeni bölüm için `tests/solutions.mjs` içine ideal kapı sayısında (`par`) bir çözüm ekle.
  Testler, her bölümün 3 yıldızla çözülebildiğini doğrular.
- Fiziksel doğruluk pazarlıksız: yeni kapı veya özellik eklerken Qiskit fixture'larının da
  kapsamasını sağla (`scripts/export-fixtures.mjs`).
- Etik: reklam, izleme, hesap, dış istek yok. İlerleme yalnızca `localStorage`'da tutulur.
  Simülasyon olduğunu her zaman dürüstçe söyle.
- Erişilebilirlik: klavye ile kullanılabilirlik, `aria-label`, hem açık hem koyu tema, 390px genişlikte
  yatay kaydırma olmaması.

## Doğrulama
```bash
npm test
```
```bash
node scripts/export-fixtures.mjs > /tmp/fx.json && python tests/qiskit/verify.py /tmp/fx.json
```
Arayüz değişikliklerinde Playwright ile masaüstü (1440px) ve mobil (390px) ekran görüntüsü alıp
konsol hatası olmadığını kontrol et.

## İş akışı
- `main` dalına push → CI (Node testleri + Qiskit) → GitHub Pages yayını.
- Her geliştirme turunda `CHANGELOG.md`'yi ve README'deki yol haritasını güncelle.
