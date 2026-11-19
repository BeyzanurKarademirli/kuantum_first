# Değişiklik günlüğü

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
