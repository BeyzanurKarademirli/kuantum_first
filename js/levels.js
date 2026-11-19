// Bölümler. Hedefler genlik dizileri olarak verilir; normalize edilir.
// Her bölüm: n kübit, izin verilen kapılar, hedef durum, "par" (ideal kapı sayısı).
// allowedRows: { X: [0] } → X kapısı yalnızca kübit 0'a konabilir.

const i = [0, 1];
const e4 = [Math.SQRT1_2, Math.SQRT1_2]; // e^{iπ/4}

export const LEVELS = [
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
];
