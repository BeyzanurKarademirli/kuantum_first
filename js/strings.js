// Arayüz metinleri. {değişken} yer tutucuları t() tarafından doldurulur.
// Türkçe varsayılandır; İngilizcede eksik anahtar Türkçeye düşer.

const HELP_TR = `
<h2>Ekrandaki her şeyi nasıl okursun?</h2>
<h3>Genlik çemberleri</h3>
<p>n kübitlik bir sistem 2ⁿ tane karmaşık sayıyla (genlik) tanımlanır. Her çember bir taban durumudur, örneğin <code>|01⟩</code>.
Dolu dairenin <b>boyutu</b> genliğin büyüklüğüdür; ölçünce o sonucu görme olasılığı bunun karesidir.
<b>Renk ve ibre</b> fazı gösterir: sağ = +1, yukarı = +i, sol = −1, aşağı = −i.</p>
<h3>Faz neden önemli?</h3>
<p>Ölçüm fazı görmez, ama faz <b>girişimi</b> belirler. <i>Girişim</i> bölümünde H·Z·H dizisi fazı olasılığa çevirir: kuantum algoritmalarının çoğu bu numaraya dayanır. Arka plandaki akışkan desen de bir girişim deseni: iki dalga kaynağı, oyundaki aynı faz renkleriyle boyanmış.</p>
<h3>Bloch küreleri</h3>
<p>Her küre tek bir kübitin, diğerlerinden bağımsız bakıldığında nasıl göründüğünü çizer. Ok kürenin yüzeyindeyse kübit "kendi başına" tanımlıdır.
Ok kısalıyorsa kübit başkalarıyla <b>dolanıktır</b>: bilgisi tek başına değil, ilişkide saklıdır. Bell çiftinde ok tamamen kaybolur.</p>
<h3>Zaman kaydırıcısı</h3>
<p>Devreyi adım adım oynat: kaydırıcıyı geri çektiğinde o ana kadarki durumu görürsün.</p>
<h3>Sesli mod</h3>
<p>Her taban durumu pentatonik bir notadır. Ses şiddeti olasılığı, stereo konumu fazı izler. Süperpozisyon bir akor gibi duyulur, ölçüm tek notaya çöker.</p>
<h3>Döndürme kapıları</h3>
<p>Rx, Ry ve Rz, kübiti Bloch küresinde bir eksen etrafında istediğin θ açısıyla döndürür. H, X, S, T gibi kapılar aslında bunların özel açılarıdır (global faz farkıyla). Ry ile ölçüm olasılıklarını istediğin orana ayarlayabilirsin: P(1) = sin²(θ/2).</p>
<h3>Kontrollü faz ve Fourier</h3>
<p>CP(θ), iki kübit de |1⟩ iken e^{iθ} fazı ekler; devrede iki nokta ve aradaki açı etiketiyle görünür. Kuantum Fourier dönüşümü bu kapılardan kurulur ve Shor algoritmasındaki faz kestiriminin temelidir.</p>
<h3>Gürültü modu</h3>
<p>Serbest Laboratuvar'da gerçek donanımın kusurlarını açabilirsin. Simülatör o zaman durum vektörü yerine <b>yoğunluk matrisi</b> ρ ile çalışır ve her kapıdan sonra seçtiğin kanalı uygular: <i>depolarize</i> (rastgele Pauli hataları), <i>genlik sönümü</i> (T1: enerji kaybı) ya da <i>faz bozulması</i> (T2: faz bilgisinin kaybı). Saflık tr(ρ²) 1'den düştükçe durum "klasikleşir".</p>
<h3>Meydan okuma</h3>
<p>Laboratuvarda bir durum kur ve <b>Meydan oku</b> düğmesine bas. Kopyalanan bağlantıyı açan kişi hedef durumu görür ama devreyi görmez; aynı kapılarla aynı durumu kurmaya çalışır.</p>
<h3>Toffoli ve hata düzeltme</h3>
<p>Toffoli (CCX) kapısı iki kontrol kübiti de |1⟩ iken hedefi çevirir; kuantum bir VE kapısıdır. <i>Bit-Çevirme Kodu</i> bölümünde bunu çoğunluk oyu için kullanırsın: bir kübitin bilgisi üç kübite yayılır, biri bozulsa bile diğer ikisi onu düzeltir. Gerçek kuantum bilgisayarlar bu fikrin çok daha büyük sürümlerine (yüzey kodları) dayanır.</p>
<h3>Gizli kutular</h3>
<p>Algoritma bölümlerinde içini göremediğin kilitli kutular var. <b>Kehanet</b> (İng. <i>oracle</i>) kutuları gizli bir fonksiyonu saklar: Deutsch, Bernstein–Vazirani ve Grover algoritmaları onu klasik bir bilgisayardan daha az sorgulayarak çözer. Diğer kutular sana bilinmeyen bir mesaj, durum ya da hata verir. Devren kutunun tüm olası hallerinde doğru çalışmalı.</p>
<h3>OpenQASM ve gerçek donanım</h3>
<p><b>QASM</b> düğmesi devreni kuantum programlamanın endüstri standardı olan OpenQASM 2/3 diline çevirir. Bu kodu IBM Quantum Platform'un ücretsiz planında ya da Qiskit, Cirq, Amazon Braket gibi araçlarda çalıştırabilirsin. Dolanık'ın simülatörü her güncellemede Qiskit'e karşı otomatik olarak test edilir.</p>
<h3>Dürüstlük notu</h3>
<p>Bu bir simülasyondur: tarayıcın durum vektörünü tam olarak hesaplar. Sonuçlar gerçek bir kuantum bilgisayarla aynı olasılıkları verir, ama kübit sayısı arttıkça klasik simülasyonun maliyeti üstel olarak büyür. Gerçek kuantum avantajı tam olarak buradan gelir.</p>
`;

const HELP_EN = `
<h2>How to read everything on screen</h2>
<h3>Amplitude circles</h3>
<p>An n-qubit system is described by 2ⁿ complex numbers (amplitudes). Each circle is one basis state, e.g. <code>|01⟩</code>.
The <b>size</b> of the filled disc is the amplitude's magnitude; the probability of measuring that outcome is its square.
<b>Colour and needle</b> show the phase: right = +1, up = +i, left = −1, down = −i.</p>
<h3>Why does phase matter?</h3>
<p>Measurement can't see phase, but phase decides <b>interference</b>. In the <i>Interference</i> level the sequence H·Z·H turns phase into probability: most quantum algorithms rely on this trick. The flowing background is an interference pattern too: two wave sources, painted with the same phase colours as the game.</p>
<h3>Bloch spheres</h3>
<p>Each sphere shows one qubit as seen on its own. If the arrow touches the surface, the qubit is well-defined by itself.
If the arrow shrinks, the qubit is <b>entangled</b> with others: its information lives in the relationship, not in the qubit. In a Bell pair the arrow vanishes completely.</p>
<h3>Time slider</h3>
<p>Step through the circuit: drag the slider back to see the state at that moment.</p>
<h3>Sound mode</h3>
<p>Each basis state is a pentatonic note. Loudness follows probability, stereo position follows phase. A superposition sounds like a chord; a measurement collapses it to a single note.</p>
<h3>Rotation gates</h3>
<p>Rx, Ry and Rz rotate the qubit on the Bloch sphere around an axis by any angle θ. Gates like H, X, S and T are special angles of these (up to a global phase). Ry lets you dial in any measurement probability: P(1) = sin²(θ/2).</p>
<h3>Controlled phase and Fourier</h3>
<p>CP(θ) adds a phase e^{iθ} when both qubits are |1⟩; it appears as two dots with an angle label. The quantum Fourier transform is built from these gates and is the heart of phase estimation in Shor's algorithm.</p>
<h3>Noise mode</h3>
<p>In the Free Lab you can switch on the imperfections of real hardware. The simulator then works with a <b>density matrix</b> ρ instead of a state vector and applies your chosen channel after each gate: <i>depolarising</i> (random Pauli errors), <i>amplitude damping</i> (T1: energy loss) or <i>dephasing</i> (T2: loss of phase information). As the purity tr(ρ²) drops below 1, the state becomes "classical".</p>
<h3>Challenges</h3>
<p>Build a state in the lab and press <b>Challenge</b>. Whoever opens the copied link sees the target state but not your circuit, and tries to build it with the same gates.</p>
<h3>Toffoli and error correction</h3>
<p>The Toffoli (CCX) gate flips the target when both controls are |1⟩: a quantum AND. In the <i>Bit-Flip Code</i> level you use it for a majority vote: one qubit's information is spread over three, so if one is corrupted the other two repair it. Real quantum computers rely on much larger versions of this idea (surface codes).</p>
<h3>Hidden boxes</h3>
<p>The algorithm levels contain locked boxes you can't look inside. <b>Oracle</b> boxes hide a function: the Deutsch, Bernstein–Vazirani and Grover algorithms uncover it with fewer queries than any classical computer. Other boxes hand you an unknown message, state or error. Your circuit must work for every possible box.</p>
<h3>OpenQASM and real hardware</h3>
<p>The <b>QASM</b> button turns your circuit into OpenQASM 2/3, the industry-standard language for quantum programs. Run that code on the free tier of IBM Quantum Platform or in Qiskit, Cirq or Amazon Braket. Dolanık's simulator is automatically tested against Qiskit on every update.</p>
<h3>Honesty note</h3>
<p>This is a simulation: your browser computes the state vector exactly. Results give the same probabilities as a real quantum computer, but the cost of classical simulation grows exponentially with the number of qubits. That is exactly where real quantum advantage comes from.</p>
`;

export const STRINGS = {
  tr: {
    'meta.title': 'Dolanık — Kuantum Devre Bulmacası',
    'meta.desc': 'Tarayıcıda çalışan, ücretsiz ve açık kaynak kuantum devre bulmaca oyunu. Kapıları yerleştir, genlikleri gör, süperpozisyonu dinle.',
    'brand.tag': 'kuantum devre bulmacası',
    'lang.switch': 'English',
    'lang.aria': 'Switch to English',
    'theme.aria': 'Açık / koyu tema',
    'mode.level': 'Bölümler',
    'mode.sandbox': 'Laboratuvar',
    'mode.help': 'Nasıl okunur?',
    'gate.pick': 'Bir kapı seç, sonra devrede bir hücreye tıkla. Yerleşmiş bir kapıya tıklayınca silinir.',
    'gate.target': 'Şimdi aynı sütunda hedef kübite tıkla.',
    'gate.second': 'Şimdi aynı sütunda ikinci kübite tıkla.',
    'gate.secondCtrl': 'Şimdi aynı sütunda ikinci kontrol kübitine tıkla.',
    'gate.angle': 'Döndürme açısı',
    'gates.aria': 'Kapılar',
    'circuit.aria': 'Kuantum devresi',
    'cell.aria': 'sütun {c}, kübit {r}{what}',
    'cell.locked': ': kilitli gizli kutu',
    'cell.gate': ': {g} (silmek için tıkla)',
    'toast.pairBad': '{g} bu bölümde bu kübitler arasına konamaz.',
    'toast.cellsBad': 'Kübitler aynı sütunda, boş hücrelerde ve farklı olmalı.',
    'toast.locked': 'Bu kutu kilitli: içini göremezsin, yalnızca devrende kullanabilirsin.',
    'toast.pickFirst': 'Önce yukarıdan bir kapı seç.',
    'toast.rowBad': '{g} bu bölümde yalnızca belirli kübitlere takılabilir.',
    'toast.needQubits': 'Bu kapı için en az {k} kübit gerekir.',
    'toast.result': 'Sonuç: {ket}. Durum bu sonuca çöktü (devre değişmedi).',
    'toast.linkCopied': 'Bağlantı kopyalandı.',
    'toast.linkBar': 'Adres çubuğundaki bağlantıyı paylaşabilirsin.',
    'toast.qasmCopied': 'OpenQASM kodu kopyalandı.',
    'toast.imported': '{k} kapı içe aktarıldı.',
    'toast.challengeCopied': 'Meydan okuma bağlantısı kopyalandı. Arkadaşına gönder!',
    'toast.needGates': 'Önce devreye birkaç kapı koy.',
    'prompt.share': 'Bu bağlantıyı paylaş:',
    'ctl.time': 'Zaman',
    'ctl.all': 'tümü',
    'ctl.undo': 'Geri',
    'ctl.undoTitle': 'Geri al (Ctrl+Z)',
    'ctl.clear': 'Temizle',
    'ctl.listen': 'Dinle',
    'ctl.listenTitle': 'Durumu dinle',
    'ctl.sound': 'sesli mod',
    'ctl.qasmTitle': 'OpenQASM olarak dışa/içe aktar',
    'ctl.share': 'Paylaş',
    'ctl.challenge': 'Meydan oku',
    'ctl.challengeTitle': 'Bu durumu arkadaşına bulmaca olarak gönder',
    'm.title': 'Ölçüm',
    'm.once': 'Bir kez ölç',
    'm.many': '256 kez ölç',
    'm.empty': 'Ölçüm yapınca sonuçlar burada belirir.',
    'm.note': 'Rastgelelik tarayıcının kriptografik üretecinden gelir. Bu bir simülasyon: gerçek bir kuantum bilgisayarın ürettiği olasılık dağılımının aynısını üretir.',
    'v.state': 'Durum',
    'v.legend': 'çember boyu = genlik, renk ve ibre = faz',
    'v.target': 'Hedef',
    'v.bloch': 'Bloch küreleri',
    'v.blochSub': 'her kübit tek başına',
    'v.fid': 'benzerlik {p}%',
    'v.solved': '{a}/{b} durum çözüldü',
    'v.variantsIntro': 'Kutunun içi gizli. Devren aşağıdaki olasılıkların hepsinde doğru sonucu vermeli. Birine tıklayıp devreni o haliyle izle:',
    'v.entropy': 'entropi',
    'v.entangle': 'dolanıklık',
    'v.noiseInfo': 'Gürültülü donanımda: ideal duruma benzerlik {f}%, saflık tr(ρ²) = {p}. Çemberler ideal durumu, Bloch küreleri ve ölçümler gürültülü sonucu gösterir.',
    'ent.noise': 'Gürültü açık: oklar hem dolanıklık hem de çevreyle etkileşim (dekoherans) yüzünden kısalır. Entropi artık ikisini birlikte ölçer.',
    'ent.single': 'Tek kübit: dolanıklık için en az iki kübit gerekir.',
    'ent.max': 'Maksimum dolanıklık! Kübitlerin tek tek bilgisi kalmadı; her şey ilişkide.',
    'ent.partial': 'Kısmen dolanık: oklar kürenin içine çekiliyor.',
    'ent.product': 'Çarpım durumu: her kübit kendi başına tanımlı.',
    'side.levels': 'Bölümler',
    'side.qubits': 'Kübit sayısı',
    'side.labNote': 'Her kapı serbest. Kendi durumlarını keşfet, sesini dinle, bağlantıyla paylaş.',
    'side.total': 'Toplam ★ {a} / {b}',
    'noise.title': 'Gürültü',
    'noise.off': 'Kapalı (ideal donanım)',
    'noise.kind': 'Gürültü türü',
    'noise.p': 'Kapı başına gürültü olasılığı',
    'noise.applied': '{desc} Her kapıdan sonra, kapının dokunduğu her kübite uygulanır.',
    'noise.intro': 'Gerçek kuantum bilgisayarlar kusursuz değil. Bir gürültü türü seç ve Bloch oklarının nasıl küçüldüğünü izle.',
    'lab.title': 'Serbest Laboratuvar',
    'lab.story': 'Kural yok. On dört kapı, dört kübite kadar, on iki sütun. Bir GHZ durumu kur ve dinle; Ry ile olasılıkları ayarla; ya da Rz ile fazları döndürüp renk tekerleğini gez.',
    'story.boxes': 'Gizli kutular {cols} sütunlarda kilitli',
    'story.and': ' ve ',
    'story.box': 'Gizli kutu {col}. sütunda kilitli',
    'story.target': 'Hedef: {state}',
    'story.par': 'ideal: {k} kapı',
    'story.hint': 'İpucu',
    'win.title': 'Başardın!',
    'win.challenge': 'Meydan okumayı kazandın!',
    'win.allDone': 'Tüm bölümler bitti!',
    'win.text': '{k} kapı kullandın (ideal: {par}). {extra}',
    'win.retry': 'Daha az kapıyla tekrar dene?',
    'win.perfect': 'Kusursuz devre.',
    'win.stay': 'Devrede kal',
    'win.next': 'Sonraki bölüm',
    'qasm.intro': 'OpenQASM, kuantum devreleri için endüstri standardı dildir. Bu kodu IBM Quantum Platform, Qiskit, Amazon Braket ya da Cirq gibi araçlara yapıştırıp <b>gerçek kuantum donanımında</b> çalıştırabilirsin. Laboratuvarda başka bir yerden kod yapıştırıp içe de aktarabilirsin.',
    'qasm.version': 'Sürüm',
    'qasm.copy': 'Kopyala',
    'qasm.import': 'İçe aktar',
    'qasm.close': 'Kapat',
    'qasm.codeAria': 'OpenQASM kodu',
    'qasm.c1': 'Dolanık ile oluşturuldu.',
    'qasm.c2': 'Not: burada q[0], Dolanık\'taki ket yazımının EN SOLUNDAKİ kübittir.',
    'qasm.c3': 'Gizli kutu "{v}" haliyle açıldı.',
    'qasm.e.multiReg': 'Yalnızca tek bir kübit yazmacı destekleniyor.',
    'qasm.e.unparsed': 'Anlaşılamayan satır: "{st}"',
    'qasm.e.unsupported': 'Desteklenmeyen kapı: {g} (desteklenen: {list})',
    'qasm.e.needAngle': '{g} kapısı bir açı ister: {g}(pi/4) q[0];',
    'qasm.e.noAngle': '{g} kapısı açı almaz.',
    'qasm.e.reg': 'Bilinmeyen yazmaç: {r}',
    'qasm.e.arity': '{g} kapısına yanlış sayıda kübit verildi.',
    'qasm.e.noQubits': 'Kübit tanımı bulunamadı (qubit[n] q; ya da qreg q[n];).',
    'qasm.e.tooMany': 'En fazla {max} kübit destekleniyor ({n} istendi).',
    'qasm.e.range': 'Kübit indeksi aralık dışında: q[{q}]',
    'qasm.e.distinct': 'Çok kübitli bir kapının kübitleri farklı olmalı.',
    'qasm.e.cols': 'Devre {k} sütuna sığmıyor.',
    'qasm.e.angle': 'Açı anlaşılamadı: "{src}"',
    'challenge.title': 'Meydan Okuma',
    'challenge.story': 'Bir arkadaşın {n} kübitle bu durumu kurdu ve sana meydan okuyor: aynısını kurabilir misin? Yalnızca onun kullandığı kapılar elinde. O, {k} kapı kullandı.',
    'challenge.hint': 'Hedefteki çemberlerin boyutuna (olasılık) ve rengine (faz) bak. Bloch oklarının kısalması dolanıklığı ele verir.',
    'foot': 'Açık kaynak · MIT lisansı · reklam yok, takip yok, hesap yok. İlerlemen yalnızca kendi tarayıcında saklanır.',
    'help.html': HELP_TR,
  },
  en: {
    'meta.title': 'Dolanık — a quantum circuit puzzle',
    'meta.desc': 'A free, open-source quantum circuit puzzle game that runs in your browser. Place gates, watch amplitudes, listen to superposition.',
    'brand.tag': 'a quantum circuit puzzle',
    'lang.switch': 'Türkçe',
    'lang.aria': 'Türkçeye geç',
    'theme.aria': 'Light / dark theme',
    'mode.level': 'Levels',
    'mode.sandbox': 'Lab',
    'mode.help': 'How to read',
    'gate.pick': 'Pick a gate, then click a cell in the circuit. Click a placed gate to remove it.',
    'gate.target': 'Now click the target qubit in the same column.',
    'gate.second': 'Now click the second qubit in the same column.',
    'gate.secondCtrl': 'Now click the second control qubit in the same column.',
    'gate.angle': 'Rotation angle',
    'gates.aria': 'Gates',
    'circuit.aria': 'Quantum circuit',
    'cell.aria': 'column {c}, qubit {r}{what}',
    'cell.locked': ': locked hidden box',
    'cell.gate': ': {g} (click to remove)',
    'toast.pairBad': '{g} can\'t be placed between these qubits in this level.',
    'toast.cellsBad': 'Qubits must be distinct, in the same column, on empty cells.',
    'toast.locked': 'This box is locked: you can\'t look inside, only build around it.',
    'toast.pickFirst': 'Pick a gate first.',
    'toast.rowBad': '{g} can only go on certain qubits in this level.',
    'toast.needQubits': 'This gate needs at least {k} qubits.',
    'toast.result': 'Result: {ket}. The state collapsed to it (the circuit is unchanged).',
    'toast.linkCopied': 'Link copied.',
    'toast.linkBar': 'Share the link in the address bar.',
    'toast.qasmCopied': 'OpenQASM code copied.',
    'toast.imported': 'Imported {k} gates.',
    'toast.challengeCopied': 'Challenge link copied. Send it to a friend!',
    'toast.needGates': 'Put a few gates in the circuit first.',
    'prompt.share': 'Share this link:',
    'ctl.time': 'Time',
    'ctl.all': 'all',
    'ctl.undo': 'Undo',
    'ctl.undoTitle': 'Undo (Ctrl+Z)',
    'ctl.clear': 'Clear',
    'ctl.listen': 'Listen',
    'ctl.listenTitle': 'Listen to the state',
    'ctl.sound': 'sound mode',
    'ctl.qasmTitle': 'Export / import as OpenQASM',
    'ctl.share': 'Share',
    'ctl.challenge': 'Challenge',
    'ctl.challengeTitle': 'Send this state to a friend as a puzzle',
    'm.title': 'Measurement',
    'm.once': 'Measure once',
    'm.many': 'Measure 256×',
    'm.empty': 'Measure to see the outcomes here.',
    'm.note': 'Randomness comes from your browser\'s cryptographic generator. This is a simulation: it reproduces exactly the probability distribution a real quantum computer would.',
    'v.state': 'State',
    'v.legend': 'circle size = amplitude, colour & needle = phase',
    'v.target': 'Target',
    'v.bloch': 'Bloch spheres',
    'v.blochSub': 'each qubit on its own',
    'v.fid': 'fidelity {p}%',
    'v.solved': '{a}/{b} cases solved',
    'v.variantsIntro': 'The box is hidden. Your circuit must give the right answer in every case below. Click one to watch your circuit with it:',
    'v.entropy': 'entropy',
    'v.entangle': 'entanglement',
    'v.noiseInfo': 'On noisy hardware: fidelity to the ideal state {f}%, purity tr(ρ²) = {p}. Circles show the ideal state; Bloch spheres and measurements show the noisy result.',
    'ent.noise': 'Noise is on: arrows shrink from entanglement and from interaction with the environment (decoherence). Entropy now measures both together.',
    'ent.single': 'A single qubit: entanglement needs at least two.',
    'ent.max': 'Maximal entanglement! No qubit holds information alone; it all lives in the relationship.',
    'ent.partial': 'Partly entangled: the arrows are pulled into the sphere.',
    'ent.product': 'Product state: every qubit is well-defined on its own.',
    'side.levels': 'Levels',
    'side.qubits': 'Qubits',
    'side.labNote': 'Every gate is free. Explore your own states, listen to them, share them with a link.',
    'side.total': 'Total ★ {a} / {b}',
    'noise.title': 'Noise',
    'noise.off': 'Off (ideal hardware)',
    'noise.kind': 'Noise type',
    'noise.p': 'Noise probability per gate',
    'noise.applied': '{desc} Applied after every gate, to every qubit the gate touches.',
    'noise.intro': 'Real quantum computers aren\'t perfect. Pick a noise type and watch the Bloch arrows shrink.',
    'lab.title': 'Free Lab',
    'lab.story': 'No rules. Fourteen gates, up to four qubits, twelve columns. Build a GHZ state and listen to it; dial probabilities with Ry; or spin phases around the colour wheel with Rz.',
    'story.boxes': 'Hidden boxes locked in columns {cols}',
    'story.and': ' and ',
    'story.box': 'Hidden box locked in column {col}',
    'story.target': 'Target: {state}',
    'story.par': 'par: {k} gates',
    'story.hint': 'Hint',
    'win.title': 'Solved!',
    'win.challenge': 'Challenge won!',
    'win.allDone': 'All levels complete!',
    'win.text': 'You used {k} gates (par: {par}). {extra}',
    'win.retry': 'Try again with fewer gates?',
    'win.perfect': 'A perfect circuit.',
    'win.stay': 'Stay here',
    'win.next': 'Next level',
    'qasm.intro': 'OpenQASM is the industry-standard language for quantum circuits. Paste this code into IBM Quantum Platform, Qiskit, Amazon Braket or Cirq to run it on <b>real quantum hardware</b>. In the Lab you can also paste code from elsewhere and import it.',
    'qasm.version': 'Version',
    'qasm.copy': 'Copy',
    'qasm.import': 'Import',
    'qasm.close': 'Close',
    'qasm.codeAria': 'OpenQASM code',
    'qasm.c1': 'Made with Dolanık.',
    'qasm.c2': 'Note: here q[0] is the LEFTMOST qubit in Dolanık\'s ket notation.',
    'qasm.c3': 'Hidden box expanded as "{v}".',
    'qasm.e.multiReg': 'Only a single qubit register is supported.',
    'qasm.e.unparsed': 'Could not understand: "{st}"',
    'qasm.e.unsupported': 'Unsupported gate: {g} (supported: {list})',
    'qasm.e.needAngle': '{g} needs an angle: {g}(pi/4) q[0];',
    'qasm.e.noAngle': '{g} takes no angle.',
    'qasm.e.reg': 'Unknown register: {r}',
    'qasm.e.arity': 'Wrong number of qubits for {g}.',
    'qasm.e.noQubits': 'No qubit declaration found (qubit[n] q; or qreg q[n];).',
    'qasm.e.tooMany': 'At most {max} qubits are supported ({n} requested).',
    'qasm.e.range': 'Qubit index out of range: q[{q}]',
    'qasm.e.distinct': 'A multi-qubit gate needs distinct qubits.',
    'qasm.e.cols': 'The circuit doesn\'t fit in {k} columns.',
    'qasm.e.angle': 'Could not understand angle: "{src}"',
    'challenge.title': 'Challenge',
    'challenge.story': 'A friend built this state with {n} qubits and challenges you: can you build the same? You only have the gates they used. They needed {k} gates.',
    'challenge.hint': 'Look at the size (probability) and colour (phase) of the target circles. Shrinking Bloch arrows give entanglement away.',
    'foot': 'Open source · MIT licence · no ads, no tracking, no accounts. Your progress is stored only in your own browser.',
    'help.html': HELP_EN,
    // kısım adları
    'chapter.Temeller': 'Basics',
    'chapter.Dolanıklık': 'Entanglement',
    'chapter.Döndürmeler': 'Rotations',
    'chapter.Algoritmalar': 'Algorithms',
    'chapter.Fourier': 'Fourier',
    'chapter.Hata Düzeltme': 'Error Correction',
    // kapılar
    'gate.H.name': 'Hadamard',
    'gate.H.desc': 'Creates an equal superposition of |0⟩ and |1⟩. Apply it twice and you\'re back.',
    'gate.X.name': 'Pauli-X (NOT)',
    'gate.X.desc': 'Flips the bit: |0⟩ ↔ |1⟩. A 180° turn around the X axis of the Bloch sphere.',
    'gate.Y.name': 'Pauli-Y',
    'gate.Y.desc': 'Flips the bit and adds a phase. A 180° turn around the Y axis.',
    'gate.Z.name': 'Pauli-Z',
    'gate.Z.desc': 'Flips the sign of the |1⟩ component (phase 180°). Probabilities don\'t change!',
    'gate.S.name': 'S (phase 90°)',
    'gate.S.desc': 'Multiplies the |1⟩ component by i. A quarter turn around Z.',
    'gate.T.name': 'T (phase 45°)',
    'gate.T.desc': 'Multiplies the |1⟩ component by e^{iπ/4}. An eighth of a turn.',
    'gate.CNOT.name': 'CNOT',
    'gate.CNOT.desc': 'Flips the target if the control is |1⟩. The key to entanglement. Pick the control first, then the target in the same column.',
    'gate.CZ.name': 'Controlled-Z',
    'gate.CZ.desc': 'Adds a phase of −1 when both qubits are |1⟩. Symmetric.',
    'gate.SWAP.name': 'SWAP',
    'gate.SWAP.desc': 'Swaps the states of two qubits.',
    'gate.CCX.name': 'Toffoli (CCX)',
    'gate.CCX.desc': 'Flips the target if both controls are |1⟩: a quantum AND. Pick both controls, then the target in the same column.',
    'gate.CP.name': 'Controlled phase CP(θ)',
    'gate.CP.desc': 'Adds a phase e^{iθ} when both qubits are |1⟩. Symmetric; CP(π) = CZ. The building block of the quantum Fourier transform.',
    'gate.RX.name': 'Rx(θ)',
    'gate.RX.desc': 'Rotates by θ around the X axis of the Bloch sphere. Choose the angle next to the gates.',
    'gate.RY.name': 'Ry(θ)',
    'gate.RY.desc': 'Rotates by θ around the Y axis. Amplitudes stay real; the way to dial in any probability.',
    'gate.RZ.name': 'Rz(θ)',
    'gate.RZ.desc': 'Rotates by θ around the Z axis: changes only the relative phase.',
    // gürültü kanalları
    'channel.depolarize.name': 'Depolarising',
    'channel.depolarize.desc': 'With probability p a random X, Y or Z error hits the qubit. The arrow shrinks equally in every direction.',
    'channel.sonum.name': 'Amplitude damping (T1)',
    'channel.sonum.desc': 'The qubit leaks energy to its surroundings and decays to |0⟩. The arrow is slowly pulled to the north pole.',
    'channel.faz.name': 'Dephasing (T2)',
    'channel.faz.desc': 'Probabilities survive but phase information is lost. The arrow shrinks horizontally, not vertically: superposition turns into a classical coin toss.',
  },
};
