# ⟨ψ| Dolanık — kuantum devre bulmacası

Tarayıcıda çalışan, **tamamen ücretsiz ve açık kaynak** bir kuantum hesaplama oyunu.
Kapıları devreye yerleştir, genliklerin dönüşünü izle, süperpozisyonu **kulağınla duy**,
dolanıklığın Bloch kürelerindeki okları nasıl "yuttuğunu" gör.

Kurulum yok, hesap yok, reklam yok, takip yok. İlerlemen yalnızca kendi tarayıcında saklanır.

## Neler var?

- **5 kısımda 25 bölüm** — *Temeller*, *Dolanıklık*, *Döndürmeler*, *Algoritmalar*, *Fourier*. Tek bit çevirmekten
  Bell çiftine, GHZ üçlüsüne, singlet durumuna ve "X kapısı sadece üst kübite takılabiliyor" gibi
  kısıtlı bulmacalara kadar. Her bölüm ideal kapı sayısına göre ★ ile puanlanır.
- **Gerçek algoritmalar ve protokoller** — *Deutsch*, *Bernstein–Vazirani*, *Grover*,
  *süper yoğun kodlama*, *kuantum ışınlanma*, *kuantum Fourier dönüşümü* ve *faz kestirimi*. İçi görünmeyen kilitli kutular (kehanet, mesaj,
  bilinmeyen durum) var; devren kutunun her olası halinde doğru çalışmalı.
- **13 kapı** — H, X, Y, Z, S, T, CNOT, CZ, SWAP, kontrollü faz CP(θ) ve açılı döndürmeler Rx(θ), Ry(θ), Rz(θ).
- **Gürültü modu** — yoğunluk matrisi simülatörü; depolarize, genlik sönümü (T1) ve faz bozulması (T2)
  kanalları. Bloch oklarının dekoheransla küçülüşünü, saflığın düşüşünü ve hatalı ölçümleri gör.
- **Meydan okuma bağlantıları** — laboratuvarda kurduğun durumu bulmaca olarak arkadaşına gönder.
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

**Qiskit çapraz doğrulaması:** Her push'ta CI, bütün bölüm çözümlerini (kehanet varyantları dahil) ve
60 tohumlu rastgele devreyi OpenQASM 2 ve 3 olarak IBM Qiskit'e yükler; Qiskit'in durum vektörünü
Dolanık'ınkiyle karşılaştırır. Gürültülü devrelerde Qiskit `DensityMatrix` + `Kraus` kanallarıyla
yoğunluk matrisi eleman eleman karşılaştırılır (230/230 birebir uyum). Yerelde:

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
| `js/qasm.js` | OpenQASM 2/3 dışa-içe aktarma (ASAP katmanlama) |
| `js/viz.js` | Canvas çizimleri: genlik çemberleri, Bloch küreleri |
| `js/audio.js` | Web Audio ile "süperpozisyonu dinle" |
| `js/app.js` | Arayüz, devre düzenleyici, ilerleme, paylaşım |
| `tests/` | `node --test` birim testleri, `tests/qiskit/` Qiskit doğrulaması |
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
- [ ] Kuantum hata düzeltme (3 kübitlik bit-çevirme kodu, gürültüyle birlikte)
- [ ] Orta-devre ölçümü ve klasik kontrol
- [x] Gürültü modu: dekoherans kürenin içine nasıl çeker?
- [ ] İngilizce dil seçeneği
- [x] Kendi bölümünü tasarla ve bağlantıyla paylaş (meydan okuma)

## Lisans

MIT
