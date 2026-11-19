import {
  GATES, runCircuit, zeroState, cloneState, stateFromAmplitudes, blochVector,
  entanglementEntropy, measureShots, sample, formatState, ketLabel,
} from './quantum.js';
import { LEVELS } from './levels.js';
import { drawAmplitudes, drawBloch, lerpState } from './viz.js';
import { playState, click } from './audio.js';
import {
  evaluateLevel, expandOracle, lockedOps, oracleOf, playerGateCount, starsFor,
} from './game.js';
import { toQasm, fromQasm } from './qasm.js';

const LEVEL_COLS = 8, LAB_COLS = 12;
let COLS = LEVEL_COLS;
const CW = 54, CH = 54, LW = 52; // hücre genişliği/yüksekliği, etiket genişliği
const $ = (id) => document.getElementById(id);

const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* gizli pencere vb. */ } },
};

const ui = {
  mode: 'level',
  levelIdx: store.get('dolanik.level', 0),
  sandboxN: 3,
  ops: [],
  history: [],
  selected: null,
  pending: null,
  step: COLS,
  shown: zeroState(1),
  target: null,
  progress: store.get('dolanik.progress', {}),
  won: false,
  lastHit: null,
  variant: 0,
};

const level = () => LEVELS[ui.levelIdx];
const nQubits = () => (ui.mode === 'level' ? level().n : ui.sandboxN);
const gateList = () => (ui.mode === 'level' ? level().gates : Object.keys(GATES));

function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast.h);
  toast.h = setTimeout(() => t.classList.remove('show'), 2200);
}

// ---------- devre modeli ----------
function span(op) {
  if (op.g === 'ORACLE') return [0, nQubits() - 1];
  const a = op.q, b = op.q2 ?? op.q;
  return [Math.min(a, b), Math.max(a, b)];
}
function occupant(col, row) {
  return ui.ops.find((op) => {
    if (op.col !== col) return false;
    const [lo, hi] = span(op);
    return row >= lo && row <= hi;
  });
}
function rangeFree(col, a, b) {
  const lo = Math.min(a, b), hi = Math.max(a, b);
  for (let r = lo; r <= hi; r++) if (occupant(col, r)) return false;
  return true;
}
function rowAllowed(g, row) {
  const rows = ui.mode === 'level' ? level().allowedRows?.[g] : null;
  return !rows || rows.includes(row);
}
function commit(newOps) {
  ui.history.push(ui.ops);
  if (ui.history.length > 100) ui.history.shift();
  ui.ops = newOps;
  ui.won = false;
  update();
}

function onCell(col, row) {
  const p = ui.pending;
  if (p) {
    ui.pending = null;
    if (col === p.col && row !== p.q && rangeFree(col, p.q, row) && rowAllowed(p.g, row)) {
      click(880);
      setDesc();
      commit([...ui.ops, { g: p.g, q: p.q, q2: row, col }]);
    } else {
      toast('İkinci kübit aynı sütunda, boş bir hücrede olmalı.');
      setDesc();
      renderCircuit();
    }
    return;
  }
  const occ = occupant(col, row);
  if (occ?.locked) { toast('Kehanet kutusu kilitli: içini göremezsin, yalnızca bir kez sorgulayabilirsin.'); return; }
  if (occ) { click(330); commit(ui.ops.filter((o) => o !== occ)); return; }
  const g = ui.selected;
  if (!g) { toast('Önce yukarıdan bir kapı seç.'); return; }
  if (!rowAllowed(g, row)) { toast(`${GATES[g].name} bu bölümde yalnızca belirli kübitlere takılabilir.`); return; }
  if (GATES[g].arity === 2) {
    if (nQubits() < 2) { toast('Bu kapı için en az iki kübit gerekir.'); return; }
    ui.pending = { g, q: row, col };
    $('gateDesc').textContent = g === 'CNOT' ? 'Şimdi aynı sütunda hedef kübite tıkla.' : 'Şimdi aynı sütunda ikinci kübite tıkla.';
    renderCircuit();
    return;
  }
  click(660);
  commit([...ui.ops, { g, q: row, col }]);
}

// ---------- çizim ----------
const NS = 'http://www.w3.org/2000/svg';
function el(tag, attrs, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  parent?.appendChild(e);
  return e;
}

function renderCircuit() {
  const n = nQubits();
  const svg = $('circuit');
  const W = LW + COLS * CW + 10, H = n * CH + 8;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('width', W);
  svg.setAttribute('height', H);
  svg.replaceChildren();
  const cy = (r) => 4 + r * CH + CH / 2;
  const cx = (c) => LW + c * CW + CW / 2;

  if (ui.step < COLS) {
    el('rect', { class: 'now', x: LW + ui.step * CW, y: 0, width: (COLS - ui.step) * CW, height: H }, svg);
  }
  for (let r = 0; r < n; r++) {
    el('line', { class: 'wire', x1: LW - 8, y1: cy(r), x2: W - 4, y2: cy(r) }, svg);
    const t = el('text', { class: 'qlabel', x: 6, y: cy(r) + 4 }, svg);
    t.textContent = `q${r} |0⟩`;
  }
  // yerleşim kısıtı olan satırları soluklaştır
  if (ui.selected && ui.mode === 'level' && level().allowedRows?.[ui.selected]) {
    for (let r = 0; r < n; r++) {
      if (!rowAllowed(ui.selected, r)) el('rect', { class: 'disabled', x: LW, y: 4 + r * CH, width: COLS * CW, height: CH }, svg);
    }
  }
  for (const op of ui.ops) {
    const g = el('g', op.col >= ui.step ? { class: 'future' } : {}, svg);
    const x = cx(op.col);
    if (op.g === 'ORACLE') {
      el('rect', { class: 'oracle', x: x - 22, y: 10, width: 44, height: n * CH - 12, rx: 10 }, g);
      const t = el('text', { class: 'otext', x, y: 4 + (n * CH) / 2 + 5, 'text-anchor': 'middle' }, g);
      t.textContent = oracleOf(level()).label;
      continue;
    }
    if (GATES[op.g].arity === 2) {
      el('line', { class: 'link', x1: x, y1: cy(op.q), x2: x, y2: cy(op.q2) }, g);
      if (op.g === 'CNOT') {
        el('circle', { class: 'dot', cx: x, cy: cy(op.q), r: 6 }, g);
        el('circle', { class: 'oplus', cx: x, cy: cy(op.q2), r: 13 }, g);
        el('line', { class: 'link', x1: x - 13, y1: cy(op.q2), x2: x + 13, y2: cy(op.q2) }, g);
        el('line', { class: 'link', x1: x, y1: cy(op.q2) - 13, x2: x, y2: cy(op.q2) + 13 }, g);
      } else if (op.g === 'CZ') {
        el('circle', { class: 'dot', cx: x, cy: cy(op.q), r: 6 }, g);
        el('circle', { class: 'dot', cx: x, cy: cy(op.q2), r: 6 }, g);
      } else {
        for (const r of [op.q, op.q2]) {
          el('line', { class: 'link', x1: x - 8, y1: cy(r) - 8, x2: x + 8, y2: cy(r) + 8 }, g);
          el('line', { class: 'link', x1: x - 8, y1: cy(r) + 8, x2: x + 8, y2: cy(r) - 8 }, g);
        }
      }
    } else {
      el('rect', { class: 'gbox', x: x - 19, y: cy(op.q) - 19, width: 38, height: 38, rx: 8 }, g);
      const t = el('text', { class: 'gtext', x, y: cy(op.q) + 6, 'text-anchor': 'middle' }, g);
      t.textContent = op.g;
    }
  }
  if (ui.pending) {
    el('circle', { class: 'pending', cx: cx(ui.pending.col), cy: cy(ui.pending.q), r: 18 }, svg);
  }
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < n; r++) {
      const rect = el('rect', { class: 'cell', x: LW + c * CW, y: 4 + r * CH, width: CW, height: CH, tabindex: 0 }, svg);
      const occ = occupant(c, r);
      const what = occ?.locked ? ': kilitli kehanet kutusu' : occ ? `: ${occ.g} (silmek için tıkla)` : '';
      rect.setAttribute('aria-label', `sütun ${c + 1}, kübit ${r}${what}`);
      rect.addEventListener('click', () => onCell(c, r));
      rect.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onCell(c, r); } });
    }
  }
}

function renderPalette() {
  const pal = $('palette');
  pal.replaceChildren();
  for (const g of gateList()) {
    const b = document.createElement('button');
    b.className = `gate${GATES[g].arity === 2 ? ' two' : ''}${ui.selected === g ? ' sel' : ''}`;
    b.textContent = g === 'CNOT' ? 'CNOT' : g === 'SWAP' ? 'SWAP' : GATES[g].label;
    b.title = `${GATES[g].name}: ${GATES[g].desc}`;
    b.addEventListener('click', () => selectGate(g));
    pal.appendChild(b);
  }
}

function setDesc() {
  const g = ui.selected;
  $('gateDesc').textContent = g
    ? `${GATES[g].name} — ${GATES[g].desc}`
    : 'Bir kapı seç, sonra devrede bir hücreye tıkla. Kapıya tekrar tıklayınca silinir.';
}

function selectGate(g) {
  ui.selected = g;
  ui.pending = null;
  setDesc();
  renderPalette();
  renderCircuit();
}

function renderSide() {
  const side = $('side');
  side.replaceChildren();
  const card = document.createElement('div');
  card.className = 'card';
  if (ui.mode === 'sandbox') {
    card.innerHTML = '<h3>Kübit sayısı</h3>';
    const qc = document.createElement('div');
    qc.className = 'qcount';
    for (let k = 1; k <= 4; k++) {
      const b = document.createElement('button');
      b.textContent = k;
      if (k === ui.sandboxN) b.className = 'on';
      b.addEventListener('click', () => {
        ui.sandboxN = k;
        ui.ops = ui.ops.filter((o) => o.q < k && (o.q2 ?? 0) < k);
        ui.history = [];
        ui.shown = zeroState(k);
        renderAll();
      });
      qc.appendChild(b);
    }
    card.appendChild(qc);
    const p = document.createElement('p');
    p.className = 'fine';
    p.textContent = 'Her kapı serbest. Kendi durumlarını keşfet, sesini dinle, bağlantıyla paylaş.';
    card.appendChild(p);
  } else {
    card.innerHTML = '<h3>Bölümler</h3>';
    const list = document.createElement('div');
    list.className = 'levels';
    LEVELS.forEach((lv, i) => {
      const b = document.createElement('button');
      if (i === ui.levelIdx && ui.mode === 'level') b.className = 'on';
      const stars = ui.progress[lv.id] || 0;
      b.innerHTML = `<span><span class="num">${i + 1}</span><span class="ttl"></span></span><span class="st">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</span>`;
      b.querySelector('.ttl').textContent = lv.title;
      b.addEventListener('click', () => { setMode('level'); loadLevel(i); });
      list.appendChild(b);
    });
    card.appendChild(list);
    const total = Object.values(ui.progress).reduce((a, b) => a + b, 0);
    const p = document.createElement('p');
    p.className = 'fine';
    p.textContent = `Toplam ★ ${total} / ${LEVELS.length * 3}`;
    card.appendChild(p);
  }
  side.appendChild(card);
}

function renderStory() {
  const st = $('story');
  st.replaceChildren();
  const h = document.createElement('h2');
  const p = document.createElement('p');
  if (ui.mode === 'help') { renderHelp(st); return; }
  if (ui.mode === 'sandbox') {
    h.textContent = 'Serbest Laboratuvar';
    p.textContent = 'Kural yok. Dokuz kapı, dört kübite kadar. Bir GHZ durumu kur ve dinle; ya da tüm fazları döndürüp renk tekerleğini gez.';
    st.append(h, p);
    return;
  }
  const lv = level();
  h.textContent = `${ui.levelIdx + 1}. ${lv.title}`;
  p.textContent = lv.story;
  const meta = document.createElement('p');
  meta.className = 'hint';
  meta.textContent = lv.oracle
    ? `Kehanet kutusu ${lv.oracle.col + 1}. sütunda kilitli · ideal: ${lv.par} kapı`
    : `Hedef: ${formatState(ui.target)} · ideal: ${lv.par} kapı`;
  const det = document.createElement('details');
  det.innerHTML = '<summary>İpucu</summary>';
  const hp = document.createElement('p');
  hp.className = 'hint';
  hp.textContent = lv.hint;
  det.appendChild(hp);
  st.append(h, p, meta, det);
}

function renderHelp(st) {
  st.classList.add('help');
  st.innerHTML = `
    <h2>Ekrandaki her şeyi nasıl okursun?</h2>
    <h3>Genlik çemberleri</h3>
    <p>n kübitlik bir sistem 2ⁿ tane karmaşık sayıyla (genlik) tanımlanır. Her çember bir taban durumudur, örneğin <code>|01⟩</code>.
    Dolu dairenin <b>boyutu</b> genliğin büyüklüğüdür; ölçünce o sonucu görme olasılığı bunun karesidir.
    <b>Renk ve ibre</b> fazı gösterir: sağ = +1, yukarı = +i, sol = −1, aşağı = −i.</p>
    <h3>Faz neden önemli?</h3>
    <p>Ölçüm fazı görmez, ama faz <b>girişimi</b> belirler. <i>Girişim</i> bölümünde H·Z·H dizisi fazı olasılığa çevirir: kuantum algoritmalarının çoğu bu numaraya dayanır.</p>
    <h3>Bloch küreleri</h3>
    <p>Her küre tek bir kübitin, diğerlerinden bağımsız bakıldığında nasıl göründüğünü çizer. Ok kürenin yüzeyindeyse kübit "kendi başına" tanımlıdır.
    Ok kısalıyorsa (pembe) kübit başkalarıyla <b>dolanıktır</b>: bilgisi tek başına değil, ilişkide saklıdır. Bell çiftinde ok tamamen kaybolur.</p>
    <h3>Zaman kaydırıcısı</h3>
    <p>Devreyi adım adım oynat: kaydırıcıyı geri çektiğinde o ana kadarki durumu görürsün.</p>
    <h3>Sesli mod</h3>
    <p>Her taban durumu pentatonik bir notadır. Ses şiddeti olasılığı, stereo konumu fazı izler. Süperpozisyon bir akor gibi duyulur, ölçüm tek notaya çöker.</p>
    <h3>Kehanet kutuları</h3>
    <p>Son bölümlerde içini göremediğin kilitli bir kutu (kehanet, İng. <i>oracle</i>) var. Deutsch ve Grover algoritmaları, kutuyu klasik bir bilgisayardan daha az sorgulayarak onun gizli özelliğini bulur. Devren, kutunun her olası halinde doğru çalışmalı. Sağdaki listeden bir kutu seçip devreni o kutuyla izleyebilirsin.</p>
    <h3>OpenQASM ve gerçek donanım</h3>
    <p><b>⟨/⟩ QASM</b> düğmesi devreni kuantum programlamanın endüstri standardı olan OpenQASM 2/3 diline çevirir. Bu kodu IBM Quantum Platform'un ücretsiz planında ya da Qiskit, Cirq, Amazon Braket gibi araçlarda çalıştırabilirsin. Dolanık'ın simülatörü her güncellemede Qiskit'e karşı otomatik olarak test edilir.</p>
    <h3>Dürüstlük notu</h3>
    <p>Bu bir simülasyondur: tarayıcın durum vektörünü tam olarak hesaplar. Sonuçlar gerçek bir kuantum bilgisayarla aynı olasılıkları verir, ama 4 kübitin ötesinde klasik simülasyonun maliyeti üstel olarak büyür. Gerçek kuantum avantajı tam olarak buradan gelir.</p>
  `;
}

// ---------- durum güncelleme ----------
let anim = 0;
function animateTo(state) {
  const from = ui.shown.n === state.n ? ui.shown : state;
  const t0 = performance.now();
  const dur = 260;
  cancelAnimationFrame(anim);
  const frame = (now) => {
    const t = Math.min(1, (now - t0) / dur);
    const e = 1 - (1 - t) ** 3;
    const s = lerpState(from, state, e);
    drawAmplitudes($('amps'), s, { highlight: ui.lastHit });
    if (t < 1) anim = requestAnimationFrame(frame);
    else ui.shown = cloneState(state);
  };
  anim = requestAnimationFrame(frame);
}

function variantObj() {
  const orc = ui.mode === 'level' ? oracleOf(level()) : null;
  return orc ? orc.variants[ui.variant] : null;
}

// Görüntülenen/ölçülen devre: kehanet varsa seçili varyantla açılmış hali
function playableOps() {
  return expandOracle(ui.ops, variantObj());
}

function currentState() {
  return runCircuit(nQubits(), playableOps(), ui.step - 1);
}

function update({ silent = false } = {}) {
  const s = currentState();
  const n = s.n;
  ui.lastHit = null;
  animateTo(s);
  $('stateText').textContent = formatState(s);
  $('stepOut').textContent = ui.step >= COLS ? 'tümü' : `${ui.step}/${COLS}`;

  // Bloch küreleri
  const wrap = $('blochs');
  if (wrap.children.length !== n) {
    wrap.replaceChildren();
    for (let q = 0; q < n; q++) {
      const f = document.createElement('figure');
      f.innerHTML = '<canvas></canvas><figcaption></figcaption>';
      wrap.appendChild(f);
    }
  }
  const ents = [];
  for (let q = 0; q < n; q++) {
    const v = blochVector(s, q);
    const f = wrap.children[q];
    drawBloch(f.querySelector('canvas'), v);
    const S = entanglementEntropy(s, q);
    ents.push(S);
    f.querySelector('figcaption').textContent = `q${q} · |r| = ${Math.hypot(v.x, v.y, v.z).toFixed(2)} · dolanıklık ${S.toFixed(2)} bit`;
  }
  const maxEnt = Math.max(...ents);
  $('entNote').textContent = n < 2 ? 'Tek kübit: dolanıklık için en az iki kübit gerekir.'
    : maxEnt > 0.99 ? 'Maksimum dolanıklık! Kübitlerin tek tek bilgisi kalmadı; her şey ilişkide.'
      : maxEnt > 0.01 ? 'Kısmen dolanık: oklar kürenin içine çekiliyor.'
        : 'Çarpım durumu: her kübit kendi başına tanımlı.';

  // hedef
  if (ui.mode === 'level') {
    const lv = level();
    const r = evaluateLevel(lv, ui.ops);
    $('target').hidden = !!lv.oracle;
    renderVariants(lv, r);
    if (!lv.oracle) drawAmplitudes($('target'), ui.target);
    $('fid').textContent = lv.oracle
      ? `${r.checks.filter((c) => c.ok).length}/${r.checks.length} kutu çözüldü`
      : `benzerlik ${(r.score * 100).toFixed(1)}%`;
    $('fidBar').style.width = `${(r.score * 100).toFixed(1)}%`;
    if (r.solved && !ui.won && playerGateCount(ui.ops)) { ui.won = true; setTimeout(win, 350); }
  }
  renderCircuit();
  $('hist').innerHTML = '<span class="empty">Ölçüm yapınca sonuçlar burada belirir.</span>';
  if (!silent && $('autoSound').checked) playState(s);
  if (ui.mode === 'sandbox') writeHash();
}

function renderVariants(lv, r) {
  const box = $('variants');
  box.replaceChildren();
  box.hidden = !lv.oracle;
  if (!lv.oracle) return;
  const orc = oracleOf(lv);
  const p = document.createElement('p');
  p.className = 'fine';
  p.textContent = 'Devren aşağıdaki kutuların hepsinde doğru sonucu vermeli. Birine tıklayıp devreyi o kutuyla izle:';
  box.appendChild(p);
  orc.variants.forEach((v, i) => {
    const b = document.createElement('button');
    b.className = `chip${i === ui.variant ? ' on' : ''}${r.checks[i].ok ? ' ok' : ''}`;
    const want = lv.oracle.kind === 'deutsch' ? ` → ${v.kind}: q0 = ${v.expect}` : ` → ölç: ${ketLabel(v.marked, 2)}`;
    b.textContent = `${r.checks[i].ok ? '✓' : '○'} ${v.name}${want}`;
    b.setAttribute('aria-pressed', i === ui.variant);
    b.addEventListener('click', () => { ui.variant = i; update(); });
    box.appendChild(b);
  });
}

function win() {
  const lv = level();
  const used = playerGateCount(ui.ops);
  const stars = starsFor(lv, ui.ops);
  const prev = ui.progress[lv.id] || 0;
  if (stars > prev) { ui.progress[lv.id] = stars; store.set('dolanik.progress', ui.progress); }
  $('winStars').textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
  $('winTitle').textContent = ui.levelIdx === LEVELS.length - 1 ? 'Tüm bölümler bitti!' : 'Başardın!';
  $('winText').textContent = `${used} kapı kullandın (ideal: ${lv.par}). ${stars < 3 ? 'Daha az kapıyla tekrar dene?' : 'Kusursuz devre.'}`;
  $('next').hidden = ui.levelIdx >= LEVELS.length - 1;
  $('win').hidden = false;
  playState(runCircuit(lv.n, playableOps()), 2.4);
  renderSide();
  $('next').focus();
}

// ---------- ölçüm ----------
function renderHist(counts, hit) {
  const total = counts.reduce((a, b) => a + b, 0);
  const max = Math.max(...counts, 1);
  const n = nQubits();
  const h = $('hist');
  h.replaceChildren();
  counts.forEach((c, i) => {
    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.title = `${ketLabel(i, n)}: ${c} / ${total}`;
    const cnt = document.createElement('span');
    cnt.className = 'cnt';
    cnt.textContent = c || '';
    const fill = document.createElement('div');
    fill.className = `fill${i === hit ? ' hit' : ''}`;
    fill.style.height = '0%';
    const lab = document.createElement('span');
    lab.className = 'lab';
    lab.textContent = ketLabel(i, n);
    bar.append(cnt, fill, lab);
    h.appendChild(bar);
    requestAnimationFrame(() => { fill.style.height = `${(c / max) * 80}%`; });
  });
}

function measureOnce() {
  const s = currentState();
  const k = sample(s);
  const counts = new Array(s.re.length).fill(0);
  counts[k] = 1;
  renderHist(counts, k);
  ui.lastHit = k;
  drawAmplitudes($('amps'), s, { highlight: k });
  // ölçüm sonrası çöken durumu sesle duyur
  if ($('autoSound').checked) {
    const collapsed = zeroState(s.n); collapsed.re[0] = 0; collapsed.re[k] = 1;
    playState(collapsed, 0.9);
  }
  toast(`Sonuç: ${ketLabel(k, s.n)} — durum bu sonuca çöktü (devre değişmedi).`);
}

function measureMany() {
  renderHist(measureShots(currentState(), 256), null);
}

// ---------- paylaşım (yalnızca laboratuvar) ----------
function writeHash() {
  const code = ui.ops.map((o) => `${o.g}.${o.q}${o.q2 != null ? '-' + o.q2 : ''}.${o.col}`).join('_');
  history.replaceState(null, '', `#lab=${ui.sandboxN}~${code}`);
}
function readHash() {
  const m = location.hash.match(/^#lab=([1-4])~(.*)$/);
  if (!m) return false;
  ui.sandboxN = +m[1];
  ui.ops = [];
  for (const part of m[2].split('_').filter(Boolean)) {
    const pm = part.match(/^([A-Z]+)\.(\d)(?:-(\d))?\.(\d{1,2})$/);
    if (!pm || !GATES[pm[1]]) continue;
    const op = { g: pm[1], q: +pm[2], col: +pm[4] };
    if (pm[3] != null) op.q2 = +pm[3];
    const arityOk = (GATES[op.g].arity === 2) === (op.q2 != null);
    const n = ui.sandboxN;
    if (!arityOk || op.q >= n || (op.q2 ?? 0) >= n || op.col >= LAB_COLS || op.q === op.q2) continue;
    const [lo, hi] = span(op);
    let free = true;
    for (let r = lo; r <= hi; r++) if (occupant(op.col, r)) free = false;
    if (free) ui.ops.push(op);
  }
  return true;
}

// ---------- modlar ----------
function setMode(mode) {
  ui.mode = mode;
  COLS = mode === 'sandbox' ? LAB_COLS : LEVEL_COLS;
  $('step').max = COLS;
  document.body.className = `mode-${mode}`;
  $('story').classList.remove('help');
  for (const b of document.querySelectorAll('.modes button')) b.classList.toggle('on', b.dataset.mode === mode);
}

function loadLevel(i) {
  ui.levelIdx = Math.max(0, Math.min(LEVELS.length - 1, i));
  store.set('dolanik.level', ui.levelIdx);
  const lv = level();
  ui.target = lv.target ? stateFromAmplitudes(lv.n, lv.target) : null;
  ui.ops = lockedOps(lv);
  ui.variant = 0;
  ui.history = [];
  ui.selected = lv.gates[0];
  ui.pending = null;
  ui.won = false;
  ui.step = COLS;
  $('step').value = COLS;
  ui.shown = zeroState(lv.n);
  history.replaceState(null, '', location.pathname);
  renderAll();
}

function renderAll() {
  renderSide();
  renderStory();
  if (ui.mode === 'help') return;
  renderPalette();
  setDesc();
  $('blochs').replaceChildren();
  update({ silent: true });
}

// ---------- olaylar ----------
document.querySelectorAll('.modes button').forEach((b) => b.addEventListener('click', () => {
  const m = b.dataset.mode;
  setMode(m);
  if (m === 'level') loadLevel(ui.levelIdx);
  else if (m === 'sandbox') {
    ui.ops = []; ui.history = []; ui.selected = 'H'; ui.pending = null; ui.step = COLS; $('step').value = COLS;
    ui.shown = zeroState(ui.sandboxN);
    renderAll();
  } else renderAll();
}));

$('step').addEventListener('input', (e) => { ui.step = +e.target.value; update(); });
$('clear').addEventListener('click', () => { if (playerGateCount(ui.ops)) commit(ui.ops.filter((o) => o.locked)); });
$('undo').addEventListener('click', undo);
$('listen').addEventListener('click', () => playState(currentState()));
$('m1').addEventListener('click', measureOnce);
$('m256').addEventListener('click', measureMany);
$('share').addEventListener('click', async () => {
  writeHash();
  try { await navigator.clipboard.writeText(location.href); toast('Bağlantı kopyalandı.'); } catch { toast('Adres çubuğundaki bağlantıyı paylaşabilirsin.'); }
});
// ---------- OpenQASM ----------
function qasmText() {
  const v = variantObj();
  const version = +$('qasmVer').value;
  const comment = [
    'Dolanık ile oluşturuldu.',
    'Not: burada q[0], Dolanık\'taki ket yazımının EN SOLUNDAKİ kübittir.',
    ...(v ? [`Kehanet kutusu "${v.name}" varyantıyla açıldı.`] : []),
  ].join('\n');
  return toQasm(nQubits(), playableOps(), { version, comment });
}
function openQasm() {
  $('qasmCode').value = qasmText();
  $('qasmErr').textContent = '';
  $('qasmImport').hidden = ui.mode !== 'sandbox';
  $('qasmDlg').showModal();
}
$('qasm').addEventListener('click', openQasm);
$('qasmVer').addEventListener('change', () => { $('qasmCode').value = qasmText(); });
$('qasmCopy').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText($('qasmCode').value); toast('OpenQASM kodu kopyalandı.'); } catch { $('qasmCode').select(); }
});
$('qasmClose').addEventListener('click', () => $('qasmDlg').close());
$('qasmImport').addEventListener('click', () => {
  try {
    const { n, ops } = fromQasm($('qasmCode').value, { maxQubits: 4, maxCols: LAB_COLS });
    ui.sandboxN = n;
    ui.history.push(ui.ops);
    ui.ops = ops;
    ui.shown = zeroState(n);
    $('qasmDlg').close();
    renderAll();
    toast(`${ops.length} kapı içe aktarıldı.`);
  } catch (err) {
    $('qasmErr').textContent = err.message;
  }
});

$('stay').addEventListener('click', () => { $('win').hidden = true; });
$('next').addEventListener('click', () => { $('win').hidden = true; loadLevel(ui.levelIdx + 1); });
$('win').addEventListener('click', (e) => { if (e.target.id === 'win') $('win').hidden = true; });

function undo() {
  if (!ui.history.length) return;
  ui.ops = ui.history.pop();
  ui.won = false;
  update();
}

document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); return; }
  if (e.key === 'Escape') {
    if (!$('win').hidden) { $('win').hidden = true; return; }
    ui.pending = null; setDesc(); renderCircuit(); return;
  }
  if (e.ctrlKey || e.metaKey || e.altKey || ui.mode === 'help') return;
  const k = e.key.toUpperCase();
  const map = { C: 'CNOT', W: 'SWAP' };
  const g = GATES[k] ? k : map[k];
  if (g && gateList().includes(g)) selectGate(g);
});

let rz;
window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => ui.mode !== 'help' && update({ silent: true }), 120); });

// ---------- başlat ----------
if (readHash()) {
  setMode('sandbox');
  ui.selected = 'H';
  ui.shown = zeroState(ui.sandboxN);
  renderAll();
} else {
  setMode('level');
  loadLevel(ui.levelIdx);
}
