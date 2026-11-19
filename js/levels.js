// Bölümler. Hedefler genlik dizileri olarak verilir; normalize edilir.
// Her bölüm: n kübit, izin verilen kapılar, hedef durum, "par" (ideal kapı sayısı).
// allowedRows: { X: [0] } → X kapısı yalnızca kübit 0'a konabilir.
// allowedPairs: { CNOT: [[0, 1]] } → iki kübitli kapı yalnızca bu çiftlere (yön fark etmez).

const i = [0, 1];
const e4 = [Math.SQRT1_2, Math.SQRT1_2]; // e^{iπ/4}
const e3 = [Math.cos(Math.PI / 3), Math.sin(Math.PI / 3)]; // e^{iπ/3}
const r3 = Math.sqrt(3) / 2;

const RAW = [
  {
    id: 'bit-cevir',
    title: 'Bit Çevir',
    story: 'Laboratuvara hoş geldin. Elinde tek bir kübit var ve |0⟩ durumunda uyuyor. Onu |1⟩ yap.',
    hint: 'X kapısı klasik NOT gibidir.',
    n: 1, gates: ['X'], target: [0, 1], par: 1,
  },
  {
    id: 'superpozisyon',
    title: 'Süperpozisyon',
    story: 'Şimdi kübit aynı anda hem 0 hem 1 olsun: (|0⟩ + |1⟩)/√2. Ölçersen yarı yarıya yazı-tura.',
    hint: 'Hadamard tam bunun için var.',
    n: 1, gates: ['H', 'X'], target: [1, 1], par: 1,
  },
  {
    id: 'eksi-dunya',
    title: 'Eksi Dünya',
    story: '(|0⟩ − |1⟩)/√2 durumu: olasılıklar yine yarı yarıya, ama gizli bir eksi işareti var. Ölçümle göremezsin; girişimle görürsün.',
    hint: 'Ya önce çevir sonra H, ya da H sonra fazı çevir.',
    n: 1, gates: ['H', 'X', 'Z'], target: [1, -1], par: 2,
  },
  {
    id: 'hayali-yon',
    title: 'Hayali Yön',
    story: 'Genlikler karmaşık sayıdır. (|0⟩ + i|1⟩)/√2 durumu Bloch küresinde Y eksenini gösterir. Oraya ulaş.',
    hint: 'S kapısı |1⟩ bileşenini i ile çarpar.',
    n: 1, gates: ['H', 'S', 'Z'], target: [1, i], par: 2,
  },
  {
    id: 'sekizde-bir',
    title: 'Sekizde Bir Tur',
    story: 'Ekvatorda 45° dön: (|0⟩ + e^{iπ/4}|1⟩)/√2. Renk tekerleğinde fazın turuncuya kaydığını izle.',
    hint: 'T kapısı = 45° faz.',
    n: 1, gates: ['H', 'T', 'S'], target: [1, e4], par: 2,
  },
  {
    id: 'girisim',
    title: 'Girişim',
    story: 'X kapısını kaybettik! Sadece H ve Z ile kübiti |1⟩ yap. İpucu: dalgalar birbirini söndürebilir.',
    hint: 'H · Z · H = X. Faz, girişimle olasılığa dönüşür.',
    n: 1, gates: ['H', 'Z'], target: [0, 1], par: 3,
  },
  {
    id: 'bell',
    title: 'Bell Çifti',
    story: 'İlk dolanıklığın. (|00⟩ + |11⟩)/√2: iki kübit ayrı ayrı rastgele, ama her zaman aynı sonucu verir. Bloch kürelerindeki okların nasıl küçüldüğüne bak!',
    hint: 'Birini süperpozisyona sok, sonra onu kontrol olarak kullan.',
    n: 2, gates: ['H', 'X', 'CNOT'], target: [1, 0, 0, 1], par: 2,
  },
  {
    id: 'hadamard-yagmuru',
    title: 'Hadamard Yağmuru',
    story: 'Üç kübit, sekiz olasılık, hepsi eşit. 2ⁿ genliği n kapıyla doldurmak: kuantum paralelliğinin ilk tadı.',
    hint: 'Her kübite bir yağmur damlası.',
    n: 3, gates: ['H', 'X'], target: [1, 1, 1, 1, 1, 1, 1, 1], par: 3,
  },
  {
    id: 'kardes-bitler',
    title: 'Kardeş Bitler',
    story: '(|01⟩ + |10⟩)/√2: bu sefer kübitler hep zıt sonuç versin.',
    hint: 'Bell çifti kur, sonra birini çevir.',
    n: 2, gates: ['H', 'X', 'CNOT'], target: [0, 1, 1, 0], par: 3,
  },
  {
    id: 'hayali-bell',
    title: 'Hayali Bell',
    story: '(|00⟩ + i|11⟩)/√2. Dolanık bir çiftin ortak fazını döndür.',
    hint: 'Faz kapısını nereye koyduğun önemli mi? Dene!',
    n: 2, gates: ['H', 'S', 'CNOT'], target: [1, 0, 0, i], par: 3,
  },
  {
    id: 'gizli-faz',
    title: 'Gizli Faz',
    story: '½(|00⟩ + |01⟩ + |10⟩ − |11⟩). Olasılıklar düzgün; tek fark |11⟩ üzerindeki eksi. Bu, "grafik durumu" denen kaynakların en küçüğü.',
    hint: 'CZ, iki kübit de 1 iken eksi ekler.',
    n: 2, gates: ['H', 'CZ'], target: [1, 1, 1, -1], par: 3,
  },
  {
    id: 'singlet',
    title: 'Singlet',
    story: '(|01⟩ − |10⟩)/√2: fizikteki en ünlü dolanık durum. Hangi eksende ölçersen ölç, sonuçlar zıt çıkar.',
    hint: 'Eksi işaretini dolanıklıktan önce koymak daha kolay.',
    n: 2, gates: ['H', 'X', 'Z', 'CNOT'], target: [0, 1, -1, 0], par: 4,
  },
  {
    id: 'ghz',
    title: 'GHZ Üçlüsü',
    story: '(|000⟩ + |111⟩)/√2: üç kübitlik dolanıklık. Biri ölçüldüğü an, üçü birden belirlenir.',
    hint: 'Bell çiftini bir kübit daha uzat.',
    n: 3, gates: ['H', 'CNOT'], target: [1, 0, 0, 0, 0, 0, 0, 1], par: 3,
  },
  {
    id: 'takasci',
    title: 'Takasçı',
    story: 'X kapısı yalnızca üst kübite takılabiliyor ve SWAP bozuk. Ama |01⟩ (alttaki kübit 1) lazım. CNOT\'larla takas yapabilir misin?',
    hint: 'Üç CNOT, yönleri değişerek, bir SWAP eder. Ama burada üst kübitin 0\'a dönmesi lazım…',
    n: 2, gates: ['X', 'CNOT'], allowedRows: { X: [0] }, target: [0, 1, 0, 0], par: 3,
  },
  {
    id: 'faz-labirenti',
    title: 'Faz Labirenti',
    story: 'Son sınav: ½(|00⟩ + i|01⟩ + |10⟩ + i|11⟩). Dolanık mı, değil mi? Bloch kürelerine bakıp karar ver, sonra kur.',
    hint: 'Ok uzunlukları 1 ise durum çarpım durumudur: her kübiti ayrı hazırla.',
    n: 2, gates: ['H', 'S', 'T', 'CNOT', 'CZ'], target: [1, i, 1, i], par: 3,
  },
  {
    id: 'deutsch',
    title: 'Deutsch\'un Kehaneti',
    story: 'İlk kuantum algoritması (1985). Kilitli U_f kutusu tek bitlik gizli bir f fonksiyonu saklıyor: ya sabit (f(0) = f(1)) ya da dengeli. Klasik bir bilgisayar kutuyu iki kez sorgulamak zorunda. Sen tek sorguyla bul: devrenin sonunda q0, sabit kutularda 0, dengeli kutularda 1 ölçülmeli. Devren dört olası kutunun hepsinde çalışmalı.',
    hint: 'q1\'i |−⟩ durumuna getir (X sonra H), q0\'ı süperpozisyona sok. Kutu, f(x)\'i faz olarak q0\'a "geri teper". Sonra q0\'a bir H daha.',
    n: 2, gates: ['H', 'X'], oracle: { kind: 'deutsch', col: 2 }, par: 4,
  },
  {
    id: 'grover',
    title: 'Grover\'ın Arayışı',
    story: 'Dört kutudan birinde hazine var ve U_ω kehaneti hazinenin fazını çevirerek "işaretliyor". Klasik olarak ortalama 2,25 kez bakarsın. Grover algoritması 2 kübitte tek sorguda kesin bulur. Devren hangi kutu işaretli olursa olsun, sonunda tam olarak o durumu vermeli.',
    hint: 'Önce eşit süperpozisyon. Kehanetten sonra "ortalama etrafında yansıtma" (difüzyon): H H, X X, CZ, X X, H H.',
    n: 2, gates: ['H', 'X', 'CZ'], oracle: { kind: 'grover', col: 1 }, par: 11,
  },
  {
    id: 'ceyrek-sans',
    title: 'Çeyrek Şans',
    story: 'Hadamard hep yarı yarıya verir. Ama ya ölçümde %25 ihtimalle 1 görmek istersen? Hedef: (√3/2)|0⟩ + (1/2)|1⟩. Ry kapısı kübiti Bloch küresinde istediğin açıyla eğer.',
    hint: 'Ry(θ) sonrası 1 olasılığı sin²(θ/2). sin²(θ/2) = 1/4 için θ = ?',
    n: 1, gates: ['RY', 'H', 'X'], target: [r3, 0.5], par: 1,
  },
  {
    id: 'altida-bir',
    title: 'Altıda Bir Tur',
    story: '(|0⟩ + e^{iπ/3}|1⟩)/√2: ekvatorda 60° dön. S (90°) ve T (45°) bu açıyı veremez; Rz verebilir. Rz\'nin |0⟩\'a da faz eklediğini fark edeceksin: ama ortak (global) faz fiziksel olarak görünmez.',
    hint: 'Önce ekvatora çık, sonra Z ekseni etrafında dön.',
    n: 1, gates: ['H', 'RZ', 'S', 'T'], target: [1, e3], par: 2,
  },
  {
    id: 'yarim-dolanik',
    title: 'Yarım Gönüllü Dolanıklık',
    story: '(√3/2)|00⟩ + (1/2)|11⟩: kübitler yine hep aynı sonucu verir ama artık eşit şansla değil. Dolanıklık bir açma-kapama düğmesi değil, bir kaydırıcıdır: Bloch oklarının yarı yarıya kısaldığını gör.',
    hint: 'Bell çiftindeki H yerine eğik bir Ry kullan.',
    n: 2, gates: ['RY', 'H', 'CNOT'], target: [r3, 0, 0, 0.5], par: 2,
  },
  {
    id: 'bernstein-vazirani',
    title: 'Bernstein–Vazirani',
    story: 'U_s kutusu iki bitlik gizli bir s dizisi saklıyor ve f(x) = s·x (mod 2) hesaplıyor. Klasik olarak s\'nin her bitini bulmak için ayrı bir sorgu gerekir. Kuantumda tek sorgu yeter: devrenin sonunda q0q1 doğrudan s\'yi göstermeli. q2 yardımcı kübittir.',
    hint: 'Deutsch\'taki numaranın aynısı: yardımcı kübit |−⟩, girdiler süperpozisyonda, sonra girdilere tekrar H.',
    n: 3, gates: ['H', 'X'], oracle: { kind: 'bv', col: 2 }, par: 6,
  },
  {
    id: 'super-yogun',
    title: 'Süper Yoğun Kodlama',
    story: 'Ayşe ile Bora bir Bell çifti paylaşıyor: q0 Ayşe\'de, q1 Bora\'da. Ayşe kendi kübitine kilitli M kutusuyla iki bitlik bir mesaj kodluyor ve kübitini Bora\'ya yolluyor. Tek bir kübitle iki klasik bit! Önce çifti kur, sonra Bora olarak mesajı çöz: sonunda |b1 b2⟩ ölçülmeli.',
    hint: 'Kutudan önce Bell çifti kur. Kutudan sonra Bell çiftini tersine çöz: aynı kapılar, ters sırada.',
    n: 2, gates: ['H', 'CNOT'], oracle: { kind: 'dense', col: 2 }, par: 4,
  },
  {
    id: 'isinlanma',
    title: 'Kuantum Işınlanma',
    story: 'q0, ψ kutusunda bilinmeyen bir duruma hazırlanıyor. Görevin bu durumu q2\'ye taşımak. Ama q0 ile q2 birbirinden uzak: aralarında CNOT kullanamazsın. Ortadaki q1 ile dolanıklık kurup köprü yap. Gerçek protokolde Ayşe ölçer ve Bora\'ya iki klasik bit yollar; burada o düzeltmeleri kontrollü kapılarla yapıyoruz (ertelenmiş ölçüm ilkesi). q0→q2 arasındaki CZ, o klasik bitlerden birinin yerini tutar.',
    hint: 'q1–q2 arasında Bell çifti; sonra q0 ile q1\'i "Bell tabanında" ölç: CNOT 0→1 ve H q0. Son olarak q1 kontrollü X ve q0 kontrollü Z ile q2\'yi düzelt.',
    n: 3, gates: ['H', 'CNOT', 'CZ'], oracle: { kind: 'teleport', col: 0 }, par: 6,
    allowedPairs: { CNOT: [[0, 1], [1, 2]] },
  },
  {
    id: 'fourier-saati',
    title: 'Fourier Saati',
    story: 'Kuantum Fourier dönüşümü (QFT) bir sayıyı fazlara yazar. Hedef QFT|001⟩: sekiz genliğin her biri bir öncekinden 45° ileride, bir saat gibi. Renk tekerleğinin tam bir tur döndüğünü göreceksin. Sır: bu durum aslında hiç dolanık değil; her kübit kendi hızında dönen ayrı bir ibre.',
    hint: 'q0 yarım tur (180°), q1 çeyrek tur (90°), q2 sekizde bir tur (45°) dönmeli. Her biri için önce H.',
    n: 3, gates: ['H', 'X', 'S', 'T', 'CP'], target: Array.from({ length: 8 }, (_, y) => [Math.cos(Math.PI * y / 4), Math.sin(Math.PI * y / 4)]), par: 6,
  },
  {
    id: 'faz-kestirimi',
    title: 'Faz Kestirimi',
    story: 'Shor algoritmasının kalbi. U^k kutusu, q2 üzerindeki U = P(2πφ) kapısını q1 kontrollü bir kez, q0 kontrollü iki kez uyguluyor. q2 = |1⟩ ise U onu değiştirmez, yalnızca e^{2πiφ} fazı ekler; bu faz kontrol kübitlerine "geri teper". Görevin φ\'yi iki bitlik bir sayı olarak okumak: sonunda q0q1 = 4φ olmalı.',
    hint: 'Önce q2\'yi |1⟩ yap ve sayaç kübitlerini süperpozisyona sok. Kutudan sonra ters QFT: SWAP, H q1, CP(−π/2), H q0.',
    n: 3, gates: ['H', 'X', 'CP', 'SWAP'], oracle: { kind: 'qpe', col: 2 }, par: 7,
  },
];

const CHAPTERS = [
  ['Temeller', ['bit-cevir', 'superpozisyon', 'eksi-dunya', 'hayali-yon', 'sekizde-bir', 'girisim']],
  ['Dolanıklık', ['bell', 'hadamard-yagmuru', 'kardes-bitler', 'hayali-bell', 'gizli-faz', 'singlet', 'ghz', 'takasci', 'faz-labirenti']],
  ['Döndürmeler', ['ceyrek-sans', 'altida-bir', 'yarim-dolanik']],
  ['Algoritmalar', ['deutsch', 'bernstein-vazirani', 'grover', 'super-yogun', 'isinlanma']],
  ['Fourier', ['fourier-saati', 'faz-kestirimi']],
];

const byId = Object.fromEntries(RAW.map((l) => [l.id, l]));
export const LEVELS = CHAPTERS.flatMap(([chapter, ids]) => ids.map((id) => {
  if (!byId[id]) throw new Error(`Bölüm bulunamadı: ${id}`);
  return { ...byId[id], chapter };
}));
if (LEVELS.length !== RAW.length) throw new Error('Her bölüm bir kısma atanmalı');
