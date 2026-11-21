# ⟨ψ| Dolanık — kuantum devre bulmacası

Tarayıcıda çalışan, **tamamen ücretsiz ve açık kaynak** bir kuantum hesaplama oyunu.
Kapıları devreye yerleştir, genliklerin dönüşünü izle, süperpozisyonu **kulağınla duy**,
dolanıklığın Bloch kürelerindeki okları nasıl "yuttuğunu" gör.

Kurulum yok, hesap yok, reklam yok, takip yok. İlerlemen yalnızca kendi tarayıcında saklanır.

**Oyna:** https://beyzanurkarademirli.github.io/kuantum_first/ · **Türkçe / English**

**Neden var?** Kuantum bilgisayarlar bugün internet üzerinden kullanılabiliyor ve şifrelemeden ilaç
araştırmasına kadar birçok alanı etkilemesi bekleniyor; ama nasıl çalıştıkları sezgiye ters. Dolanık bu
sezgiyi oynayarak kazandırır. Sitedeki **Neden?** sekmesi altı kısmın her birinin ne kazandırdığını ve gerçek
dünyadaki karşılığını (Nobel 2022 dolanıklık deneyleri, Grover araması, Shor ve RSA, Google'ın 2024 hata
düzeltme sonucu) bir yolculuk haritasında gösterir. Her bölüm de başında "Öğreneceğin" hedefini, sonunda
"Öğrendiğin kural"ı yazar.

**Hiç bilmiyorsan:** Siteye ilk girişte kısa bir karşılama ekranı sitenin ne olduğunu anlatır. "Bana göster"
dersen bir **rehber tur** başlar: hayalet bir imleç ekranda gezer, her kısmı ışıkla vurgulayıp ne işe
yaradığını anlatır ve ilk bölümü senin gözünün önünde çözer. Turu istediğin an üstteki **Tur** düğmesiyle
yeniden izleyebilirsin. Her kısmın yanındaki **?** düğmesi de o kısmı tek cümlede açıklar.

## Tasarım: "Uzay atlası"

Koyu temada derin uzay: titreşen yıldızlar (imleçle paralaks yapan üç derinlik katmanı), bulutsular ve
ara sıra kayan yıldızlar. Açık temada kâğıt üzerine mürekkeple çizilmiş bir yıldız atlası, takımyıldız
çizgileriyle. Önünde bir uzay-zaman ağı var: imleç onu bir kütle gibi büker, tıkladığın yerden ağ boyunca
dalga yayılır. Masaüstünde imlecin arkasından minik kuantum sembolleri (ψ, ħ, |0⟩, ⊗…) dökülür. Logo,
ışık izi bırakan elektronlarıyla canlı bir atomdur. Arka planda gerçek kuantum formülleri süzülür.

Kâğıt-mürekkep paleti, yaprak köşeli butonlar, baskı gölgeleri, basınca gömülen kapı tuşları ve seçili
kapının çevresinde dönen bir kuyruklu yıldız. Her bölümün yanındaki **?** düğmesi o bölümü anlatır.
Renkli tek öğe genlik çemberleridir: oradaki renkler süs değil, fazı gösteren veridir. Yazı tipleri
(Fraunces, Manrope, JetBrains Mono, SIL OFL) siteyle birlikte gelir; dışarıya tek bir istek atılmaz.
"Hareketi azalt" tercihine uyulur.

## Neler var?

- **6 kısımda 26 bölüm** — *Temeller*, *Dolanıklık*, *Döndürmeler*, *Algoritmalar*, *Fourier*, *Hata Düzeltme*. Tek bit çevirmekten
  Bell çiftine, GHZ üçlüsüne, singlet durumuna ve "X kapısı sadece üst kübite takılabiliyor" gibi
  kısıtlı bulmacalara kadar. Her bölüm ideal kapı sayısına göre ★ ile puanlanır.
- **Gerçek algoritmalar ve protokoller** — *Deutsch*, *Bernstein–Vazirani*, *Grover*,
  *süper yoğun kodlama*, *kuantum ışınlanma*, *kuantum Fourier dönüşümü*, *faz kestirimi* ve
  *3 kübitlik bit-çevirme kodu* (kuantum hata düzeltme). İçi görünmeyen kilitli kutular (kehanet, mesaj,
  bilinmeyen durum) var; devren kutunun her olası halinde doğru çalışmalı.
- **14 kapı** — H, X, Y, Z, S, T, CNOT, CZ, SWAP, Toffoli (CCX), kontrollü faz CP(θ) ve açılı döndürmeler
  Rx(θ), Ry(θ), Rz(θ).
- **Gürültü modu** — yoğunluk matrisi simülatörü; depolarize, genlik sönümü (T1) ve faz bozulması (T2)
  kanalları. Bloch oklarının dekoheransla küçülüşünü, saflığın düşüşünü ve hatalı ölçümleri gör.
- **Meydan okuma bağlantıları** — laboratuvarda kurduğun durumu bulmaca olarak arkadaşına gönder.
- **Öğrendiğin kural** — her bölüm çözülünce o bölümün öğrettiği fikir tek cümleyle özetlenir.
- **Zorluk etiketleri** — kısımlar Başlangıç / Orta / İleri olarak işaretli.
- **İki dil** — Türkçe ve İngilizce; tarayıcı diline göre kendiliğinden seçilir, tek tıkla değişir.
- **Açık ve koyu tema** — sistem tercihine uyar, elle de değiştirilebilir.
- **OpenQASM 2.0 / 3.0** — devreni endüstri standardı dile aktar, IBM Quantum, Qiskit, Cirq ya da
  Amazon Braket'te (gerçek donanım dahil) çalıştır. Başka yerde yazılmış QASM kodunu içe aktar.
- **Serbest Laboratuvar** — 4 kübite kadar, 12 sütun, bütün kapılar.
  Devreni bağlantı olarak paylaşabilirsin (URL'de saklanır).
- **Genlik çemberleri** — boyut = genlik büyüklüğü, renk ve ibre = faz.
- **Bloch küreleri** — her kübitin indirgenmiş durumu. Ok kısalıyorsa kübit dolanıktır;
  dolanıklık entropisi bit cinsinden gösterilir.
- **Zaman kaydırıcısı** — devreyi sütun sütun ileri-geri oynat.
- **Sesli mod** — her taban durumu pentatonik bir nota; ses şiddeti olasılığı, stereo konum fazı izler.
  Süperpozisyon akor, ölçüm tek nota.
- **Ölçüm** — tek atış ya da 256 atışlık histogram, tarayıcının kriptografik rastgeleliğiyle.

## Çalıştır

Herhangi bir statik sunucu yeterli (ES modülleri `file://` üzerinden açılmaz):

```bash
python3 -m http.server 8000
```

Sonra `http://localhost:8000` adresini aç.

## Test ve doğrulama

Simülatör, QASM ayrıştırıcı ve her bölümün ideal kapı sayısıyla çözülebilirliği bağımlılıksız testlerle doğrulanır:

```bash
npm test
```

**Tarayıcı testleri (E2E):** 15 senaryo gerçek bir Chromium'da, kullanıcı gibi tıklayarak çalışır:
ilk ziyaret ve rehber tur, bölüm çözme ve yıldızlar, gizli kutular, kural kısıtları, laboratuvar, QASM
içe/dışa aktarma, paylaşım ve meydan okuma bağlantıları, gürültü, dil ve tema, klavye, "?" açıklamaları,
390px mobil ve 26 bölümün hepsinin hatasız açılması. Yerelde (Playwright kuruluysa):

```bash
npm run test:e2e
```

**Qiskit çapraz doğrulaması:** Her push'ta CI, bütün bölüm çözümlerini (kehanet varyantları dahil) ve
60 tohumlu rastgele devreyi OpenQASM 2 ve 3 olarak IBM Qiskit'e yükler; Qiskit'in durum vektörünü
Dolanık'ınkiyle karşılaştırır. Gürültülü devrelerde Qiskit `DensityMatrix` + `Kraus` kanallarıyla
yoğunluk matrisi eleman eleman karşılaştırılır (246/246 birebir uyum). Yerelde:

```bash
pip install -r tests/qiskit/requirements.txt
```

```bash
node scripts/export-fixtures.mjs > fixtures.json && python tests/qiskit/verify.py fixtures.json
```

## Yayın

`main` dalına her push'ta GitHub Actions testleri çalıştırır ve siteyi GitHub Pages'e yayınlar.
İlk seferde depo ayarlarında **Settings → Pages → Source: GitHub Actions** seçilmelidir.

## Mimari

| Dosya | Görev |
|---|---|
| `js/quantum.js` | Durum-vektörü simülatörü: kapılar, Bloch vektörü, dolanıklık entropisi, ölçüm |
| `js/levels.js` | Bölümler ve hedef durumlar |
| `js/game.js` | Kehanet kutuları, bölüm değerlendirme, yıldızlar |
| `js/noise.js` | Yoğunluk matrisi simülatörü ve gürültü kanalları |
| `js/i18n.js`, `js/strings.js`, `js/levels-en.js` | Çeviri katmanı ve metinler |
| `js/space.js` | Uzay arka planı: yıldızlar, bulutsular, kayan yıldızlar, açık temada yıldız atlası |
| `js/burst.js` | Kazanınca yıldız kıvılcımı patlaması |
| `js/tour.js` | Karşılama sonrası rehber tur: hayalet imleç, ışık halkası, anlatım balonları |
| `js/fx.js` | Uzay-zaman ağı, kuantum sembolü izi, ışıldayan atom, denklemler, kart ışığı |
| `scripts/cache-bust.sh` | Yayında CSS/JS adreslerine sürüm etiketi ekler (eski önbellek sorunu olmaz) |
| `js/qasm.js` | OpenQASM 2/3 dışa-içe aktarma (ASAP katmanlama) |
| `js/viz.js` | Canvas çizimleri: genlik çemberleri, Bloch küreleri |
| `js/audio.js` | Web Audio ile "süperpozisyonu dinle" |
| `js/app.js` | Arayüz, devre düzenleyici, ilerleme, paylaşım |
| `tests/` | `node --test` birim testleri, `tests/e2e/` tarayıcı testleri, `tests/qiskit/` Qiskit doğrulaması |
| `scripts/` | Doğrulama verisi üretimi |

Kural: kübit 0 ket gösteriminde en soldaki bittir (`|q0 q1 q2⟩`).

## Dürüstlük notu

Bu bir **simülasyondur**. Tarayıcı durum vektörünü tam hesaplar; sonuçlar gerçek bir kuantum
bilgisayarla aynı olasılık dağılımlarını verir. Ama klasik simülasyonun maliyeti kübit sayısıyla
üstel büyür. Gerçek kuantum donanımının önemi de buradan gelir.

## Yol haritası

- [x] Döndürme kapıları (Rx, Ry, Rz) ve bunlara dayalı bölümler
- [ ] W durumu ve serbest açı girişi
- [x] Algoritma bölümleri: Deutsch, Grover (2 kübit)
- [x] OpenQASM 2/3 dışa-içe aktarma
- [x] Qiskit ile otomatik çapraz doğrulama
- [x] Bernstein–Vazirani, kuantum ışınlanma, süper yoğun kodlama
- [x] Kuantum Fourier dönüşümü ve faz kestirimi
- [x] Kuantum hata düzeltme: 3 kübitlik bit-çevirme kodu (Toffoli ile çoğunluk oyu)
- [ ] Faz-çevirme kodu ve gürültü modunda kodlu/kodsuz karşılaştırma
- [ ] Orta-devre ölçümü ve klasik kontrol
- [x] Gürültü modu: dekoherans kürenin içine nasıl çeker?
- [x] İngilizce dil seçeneği
- [x] Özgün görsel kimlik ("Uzay atlası" tasarımı)
- [x] Kendi bölümünü tasarla ve bağlantıyla paylaş (meydan okuma)

## Lisans

MIT
