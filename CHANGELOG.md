# Değişiklik günlüğü

## 0.10.0 — 2026-11-19
- Tarayıcı testleri (E2E) depoya ve CI'a eklendi: 15 kullanıcı senaryosu gerçek Chromium'da çalışır;
  geçmezse site yayına çıkmaz. Bağımlılık eklenmedi (yerleşik http sunucusu, CI'da Playwright).
- "Öğrendiğin kural" kartı: 26 bölümün her biri çözülünce öğrettiği fikri iki dilde özetler.
- Kısımlarda zorluk etiketleri: Başlangıç / Orta / İleri.
- Karşılama mesajı: "Kuantum bilgisayarını kod yazmadan öğren. Devreyi kur. Sonucu gör. Mantığı keşfet."
  Simülasyon olduğu açıkça belirtiliyor.
- E2E testlerinin bulduğu hatalar düzeltildi:
  - Turda hızlı geçilince ya da noktayla atlanınca hayalet imlecin işi yapılmıyor, anlatım devreyle
    uyuşmuyordu; atlanan adımların işleri artık sırayla tamamlanıyor.
  - "Nasıl okunur?" açıkken gizli tuvale negatif yarıçaplı çizim konsola hata yazıyordu.

## 0.9.2 — 2026-11-19
- İmlecin kendi ışığı kaldırıldı: kartlarda imleci izleyen altın ışık lekesi ve arka plan ağındaki imleç parıltısı yok.

## 0.9.1 — 2026-11-19
- Kaydırıcılar arka plandan ayrışıyor: geçilen kısım safran, kalan kısım belirgin gri, safran kenarlı tutamaç.
- Rehber turda alttaki noktalar tıklanabilir: istenen adıma doğrudan atlanır (ekran okuyucu etiketli).
- İmleç sembol izindeki altın parıltı kaldırıldı; semboller sade ve yumuşak.
- Seçili kapıdaki dönen halka yerine sakin, yavaşça ışıyan sabit çerçeve.

## 0.9.0 — 2026-11-19
- İlk ziyarette karşılama ekranı: sitenin amacı, öğretecekleri, ön bilgi gerekmediği.
- Rehber tur (11 adım): hayalet imleç sayfada gezer, her kısmı ışık halkasıyla vurgular, anlatım
  balonu açar ve ilk bölümü gerçekten tıklayarak çözer. İleri/geri, klavye (← → Esc), mobilde altta balon.
  Tur sırasında yıldız verilmez; bitince bölüm temiz başlar. Üstte her zaman "Tur" düğmesi.
- Düzeltme: mod değişimi gövdedeki diğer sınıfları silmiyor.

## 0.8.0 — 2026-11-19
- Arka plan uzaya döndü: koyu temada titreşen yıldızlar, bulutsular ve kayan yıldızlar; açık temada
  takımyıldız çizgili mürekkep yıldız atlası. Süs olarak kullanılan bütün gökkuşağı geçişleri kaldırıldı
  (yalnızca anlamı olan faz renkleri kaldı).
- İmleç izi: uzun renkli çizgi yerine imlecin arkasından dökülen, kısa ömürlü kuantum sembolleri.
- Her bölümün yanında "?" düğmesi: üzerine gelince, klavyeyle odaklanınca ya da dokununca açıklama.
- Bölüm listesindeki noktalar yıldıza (✦) dönüştü; üzerine gelince "2/3 yıldız" yazar.
- Seçili kapının çevresinde tek renkli dönen kuyruklu yıldız; kazanınca yıldız kıvılcımı patlaması.

## 0.7.0 — 2026-11-19
- İmleçle etkileşimli efektler: imlecin bir kütle gibi büktüğü uzay-zaman ağı, tıklamayla ağda yayılan
  dalgalar, faz renklerinde foton izi ve girişim halkaları, ışık izli elektronlarıyla canlı atom logosu,
  arka planda paralaksla süzülen kuantum denklemleri, kartlarda imleci izleyen ışık, kapı tuşlarında 3B eğilme.
- Performans: her karede yeniden hesaplanan bulanıklık filtreleri kaldırıldı (yazılımla çizimde 13 → 61 kare/sn).
- Yayın düzeltmesi: CSS/JS adreslerine commit etiketi eklenir; güncellemeden sonra tarayıcının eski
  CSS'i önbellekten getirip sayfayı bozması engellendi.

## 0.6.0 — 2026-11-19
- Yeni görsel kimlik "Ebru": arka planda canlı dalga girişimi (faz renkleriyle), kâğıt-mürekkep paleti,
  yaprak köşeler ve baskı gölgeleri, mürekkep taşı kapı tuşları, dönen faz halkası, kayan mod göstergesi,
  kısım ilerleme çubukları, yeni genlik ve Bloch çizimleri.
- Animasyonlar: kapı yerleşme dalgası, kablolarda sinyal akışı, ölçüm çökmesi, kazanma patlaması,
  sırayla beliren yıldızlar. "Hareketi azalt" tercihine uyulur.
- Gömülü yazı tipleri: Fraunces, Manrope, JetBrains Mono (SIL OFL; dış istek yok).
- İngilizce dil desteği: tüm arayüz, 26 bölüm, yardım, kapılar, gürültü kanalları, gizli kutu
  senaryoları ve QASM hataları. Dil tarayıcıdan algılanır, seçim hatırlanır.
- Elle açık/koyu tema seçimi.
- Metindeki ket'ler (|01⟩) eşit aralıklı etiketlerle gösteriliyor; gizli kutu etiketlerinde alt simge.
- Çeviri bütünlüğü testleri (63 test).

## 0.5.0 — 2026-11-19
- Toffoli (CCX) kapısı: üç tıklamayla yerleşim (iki kontrol, bir hedef), QASM `ccx`, gürültü desteği.
- Yeni "Hata Düzeltme" kısmı: Bit-Çevirme Kodu (2 bilinmeyen durum × 4 hata senaryosu). Toplam 26 bölüm.
- Gizli kutu altyapısı aynı bölümde birden fazla kutuyu destekliyor (hazırlık + hata kutusu).
- QASM ayrıştırıcı keyfi sayıda kübit argümanı alıyor; paylaşım bağlantıları üç kübitli kapıları taşıyor.
- Qiskit doğrulaması Toffoli içeren devreleri kapsıyor (246/246).

## 0.4.0 — 2026-11-19
- Kontrollü faz kapısı CP(θ) (QASM 3'te `cp`, QASM 2'de `cu1`).
- Yeni "Fourier" kısmı: Fourier Saati (QFT) ve Faz Kestirimi (4 gizli faz). Toplam 25 bölüm.
- Gürültü modu: yoğunluk matrisi simülatörü; depolarize, genlik sönümü (T1), faz bozulması (T2);
  saflık ve ideal duruma benzerlik göstergesi; gürültülü ölçüm.
- Meydan okuma bağlantıları: laboratuvardaki durumu bulmaca olarak paylaş.
- Qiskit doğrulamasına gürültülü yoğunluk matrisleri eklendi (230/230).

## 0.3.0 — 2026-11-19
- Döndürme kapıları Rx(θ), Ry(θ), Rz(θ); açı seçici; devrede açı etiketi (π/3, −π/4…).
- Yeni bölümler: Çeyrek Şans, Altıda Bir Tur, Yarım Gönüllü Dolanıklık, Bernstein–Vazirani,
  Süper Yoğun Kodlama, Kuantum Işınlanma (toplam 23).
- Bölümler 4 kısma ayrıldı: Temeller, Dolanıklık, Döndürmeler, Algoritmalar.
- Gizli kutu altyapısı genelleşti: tek kübitlik kutular (mesaj, bilinmeyen durum), bölüm başına
  kübit çifti kısıtları (ışınlanmada 3-CNOT takas hilesi engellendi).
- OpenQASM: `rx(pi/3)` gibi açılı kapılar; içe aktarmada `eval` kullanmayan güvenli açı ayrıştırıcı.
- Qiskit doğrulaması rastgele açılı döndürmeleri kapsıyor (196/196).
- Düzeltmeler: karmaşık sayılarda eksi işareti, paylaşım bağlantısında zaman kaydırıcısı,
  mobilde seçili bölümün görünür olması.

## 0.2.0 — 2026-11-19
- Deutsch'un Kehaneti ve Grover'ın Arayışı bölümleri: kilitli kehanet kutuları, varyant başına kontrol.
- OpenQASM 2.0/3.0 dışa aktarma (tüm modlarda) ve içe aktarma (Serbest Laboratuvar).
- Serbest Laboratuvar 12 sütuna çıktı.
- Qiskit çapraz doğrulaması CI'a eklendi (166/166 uyum).
- Kehanet ve QASM için "Nasıl okunur?" bölümleri.

## 0.1.0 — 2026-11-19
- İlk sürüm: durum-vektörü simülatörü, 15 bölüm, Serbest Laboratuvar, Bloch küreleri,
  dolanıklık entropisi, zaman kaydırıcısı, sesli mod, ölçüm histogramı, GitHub Pages yayını.
