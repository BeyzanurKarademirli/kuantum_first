import {
  GATES, ANGLES, angleLabel, runCircuit, zeroState, cloneState, stateFromAmplitudes, blochVector,
  entanglementEntropy, entropyFromBloch, measureShots, sample, formatState, ketLabel,
} from './quantum.js';
import { LEVELS, DIFFICULTY } from './levels.js';
import { drawAmplitudes, drawBloch, lerpState } from './viz.js';
import { playState, click } from './audio.js';
import {
  evaluateLevel, expandOracle, lockedOps, oracleOf, playerGateCount, starsFor, placementAllowed, opRows,
} from './game.js';
import { toQasm, fromQasm } from './qasm.js';
import { t, tx, setLang, getLang, detectLang } from './i18n.js';
import { LEVELS_EN } from './levels-en.js';
import { startSpace } from './space.js';
import { burst } from './burst.js';
import { createTour } from './tour.js';
import { startField, startTrail, startAtom, startEquations, startSpotlight } from './fx.js';
import {
  CHANNELS, runNoisy, rhoBloch, rhoProbabilities, purity, rhoFidelity, sampleRho, measureShotsRho,
} from './noise.js';

const LEVEL_COLS = 8, LAB_COLS = 12;
let COLS = LEVEL_COLS;
const CW = 54, CH = 54, LW = 52; // hücre genişliği/yüksekliği, etiket genişliği
const $ = (id) => document.getElementById(id);

const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* gizli pencere vb. */ } },
};

// ---------- dil ve tema ----------
setLang(store.get('dolanik.lang', null) ?? detectLang(navigator.languages || [navigator.language || 'tr']));
const savedTheme = store.get('dolanik.theme', null);
if (savedTheme) document.documentElement.dataset.theme = savedTheme;

const isEn = () => getLang() === 'en';
const isTextMode = () => ui.mode === 'help' || ui.mode === 'why';
const lvText = (lv, f) => {
  if (lv.id === 'meydan') {
    if (f === 'title') return t('challenge.title');
    if (f === 'story') return t('challenge.story', { n: lv.n, k: lv.par });
    return t('challenge.hint');
  }
  return isEn() ? LEVELS_EN[lv.id]?.[f] ?? lv[f] : lv[f];
};
const chapterName = (c) => (isEn() ? t(`chapter.${c}`) : c);
const gateName = (g) => (isEn() ? t(`gate.${g}.name`) : GATES[g].name);
const gateDesc = (g) => (isEn() ? t(`gate.${g}.desc`) : GATES[g].desc);
const chName = (k) => (isEn() ? t(`channel.${k}.name`) : CHANNELS[k].name);
const chDesc = (k) => (isEn() ? t(`channel.${k}.desc`) : CHANNELS[k].desc);
const GATE_FAMILY = {
  X: 'pauli', Y: 'pauli', Z: 'pauli', H: 'h', S: 'phase', T: 'phase',
  RX: 'rot', RY: 'rot', RZ: 'rot', CNOT: 'multi', CZ: 'multi', SWAP: 'multi', CP: 'multi', CCX: 'multi',
};
const FAMILY_VAR = { pauli: '--vermilion', h: '--jade', phase: '--saffron', rot: '--cobalt', multi: '--rose' };

// Metindeki |01⟩ gibi ket'leri eşit aralıklı küçük etiketlere çevirerek yaz
function setRich(el, text) {
  el.replaceChildren();
  for (const part of String(text).split(/(\|[^|⟩\s]{1,12}⟩)/)) {
    if (!part) continue;
    if (/^\|[^|⟩\s]{1,12}⟩$/.test(part)) {
      const k = document.createElement('span');
      k.className = 'ket';
      k.textContent = part;
      el.appendChild(k);
    } else el.appendChild(document.createTextNode(part));
  }
}

// "?" açıklama düğmeleri: tek bir ipucu kutusu; üzerine gelince, odaklanınca ya da dokununca açılır
const infoHtml = (key) => `<button class="info" type="button" data-info="${key}"></button>`;
function labelInfo(root = document) {
  for (const b of root.querySelectorAll('.info')) { b.textContent = '?'; b.setAttribute('aria-label', `${t('info.aria')}`); }
}
function setupInfoTips() {
  const tip = $('tip');
  let current = null;
  const show = (btn) => {
    current = btn;
    tip.innerHTML = btn.dataset.info === 'chapter'
      ? `<b>${chapterName(btn.dataset.ch)}</b>${t(`chgain.${btn.dataset.ch}`)}<br><br><i>${t('why.world')}:</i> ${t(`chworld.${btn.dataset.ch}`)}`
      : t(`info.${btn.dataset.info}`);
    tip.classList.add('show');
    btn.setAttribute('aria-expanded', 'true');
    const r = btn.getBoundingClientRect();
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    const x = Math.max(12, Math.min(innerWidth - tw - 12, r.left + r.width / 2 - tw / 2));
    let y = r.bottom + 10;
    if (y + th > innerHeight - 12) y = r.top - th - 10;
    tip.style.left = `${x}px`; tip.style.top = `${y}px`;
  };
  const hide = () => {
    current?.setAttribute('aria-expanded', 'false');
    current = null;
    tip.classList.remove('show');
  };
  document.addEventListener('pointerover', (e) => { const b = e.target.closest?.('.info'); if (b && e.pointerType !== 'touch') show(b); });
  document.addEventListener('pointerout', (e) => { const b = e.target.closest?.('.info'); if (b && !b.contains(e.relatedTarget) && document.activeElement !== b) hide(); });
  document.addEventListener('focusin', (e) => { if (e.target.matches?.('.info')) show(e.target); });
  document.addEventListener('focusout', (e) => { if (e.target.matches?.('.info')) hide(); });
  document.addEventListener('click', (e) => {
    const b = e.target.closest?.('.info');
    if (b) { e.preventDefault(); e.stopPropagation(); if (current === b && document.activeElement !== b) hide(); else show(b); }
    else if (current) hide();
  }, true);
  addEventListener('scroll', hide, { passive: true });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(); });
}

function applyStaticText() {
  labelInfo();
  document.documentElement.lang = getLang();
  document.title = t('meta.title');
  document.querySelector('meta[name="description"]').setAttribute('content', t('meta.desc'));
  for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const el of document.querySelectorAll('[data-i18n-html]')) el.innerHTML = t(el.dataset.i18nHtml);
  for (const el of document.querySelectorAll('[data-i18n-aria]')) el.setAttribute('aria-label', t(el.dataset.i18nAria));
  for (const el of document.querySelectorAll('[data-i18n-title]')) el.title = t(el.dataset.i18nTitle);
}

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
  theta: Math.PI / 4,
  noise: { kind: 'yok', p: 0.05 },
  custom: null,
  justAdded: null,
};

const level = () => ui.custom ?? LEVELS[ui.levelIdx];
const noiseOn = () => ui.mode === 'sandbox' && ui.noise.kind !== 'yok' && ui.noise.p > 0;
const noisyRho = () => runNoisy(nQubits(), ui.ops, ui.noise, ui.step - 1);
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
  const rows = opRows(op);
  return [Math.min(...rows), Math.max(...rows)];
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
function allowed(op) {
  return ui.mode !== 'level' || placementAllowed(level(), op);
}
const gateText = (op) => (GATES[op.g].param ? `${GATES[op.g].label}(${angleLabel(op.theta)})` : op.g);
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
    const rows = [...p.rows, row];
    const free = col === p.col && !p.rows.includes(row) && rangeFree(col, Math.min(...rows), Math.max(...rows));
    if (free && rows.length < GATES[p.g].arity) {
      p.rows = rows;
      click(770);
      $('gateDesc').textContent = t('gate.target');
      renderCircuit();
      return;
    }
    ui.pending = null;
    const [q, q2, q3] = rows;
    const op = { g: p.g, q, q2, ...(q3 != null ? { q3 } : {}), col, ...(GATES[p.g].param ? { theta: ui.theta } : {}) };
    if (free && allowed(op)) {
      click(880);
      setDesc();
      ui.justAdded = op;
      commit([...ui.ops, op]);
    } else {
      toast(free ? t('toast.pairBad', { g: gateName(p.g) }) : t('toast.cellsBad'));
      setDesc();
      renderCircuit();
    }
    return;
  }
  const occ = occupant(col, row);
  if (occ?.locked) { toast(t('toast.locked')); return; }
  if (occ) { click(330); commit(ui.ops.filter((o) => o !== occ)); return; }
  const g = ui.selected;
  if (!g) { toast(t('toast.pickFirst')); return; }
  if (!allowed({ g, q: row })) { toast(t('toast.rowBad', { g: gateName(g) })); return; }
  if (GATES[g].arity > 1) {
    if (nQubits() < GATES[g].arity) { toast(t('toast.needQubits', { k: GATES[g].arity })); return; }
    ui.pending = { g, rows: [row], col };
    $('gateDesc').textContent = g === 'CCX' ? t('gate.secondCtrl') : g === 'CNOT' ? t('gate.target') : t('gate.second');
    renderCircuit();
    return;
  }
  click(660);
  const op = { g, q: row, col, ...(GATES[g].param ? { theta: ui.theta } : {}) };
  ui.justAdded = op;
  commit([...ui.ops, op]);
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

  // desenler: geleceği gösteren tarama ve gizli kutu kenarı için faz gradyanı
  const defs = el('defs', {}, svg);
  const pat = el('pattern', { id: 'hatch', width: 7, height: 7, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs);
  el('line', { x1: 0, y1: 0, x2: 0, y2: 7, stroke: 'var(--line-2)', 'stroke-width': 2 }, pat);

  if (ui.step < COLS) {
    el('rect', { class: 'now', x: LW + ui.step * CW, y: 0, width: (COLS - ui.step) * CW, height: H, opacity: 0.5 }, svg);
  }
  const flowEnd = LW + Math.min(ui.step, COLS) * CW;
  for (let r = 0; r < n; r++) {
    el('line', { class: 'wire', x1: LW - 6, y1: cy(r), x2: W - 4, y2: cy(r) }, svg);
    if (flowEnd > LW) el('line', { class: 'flow', x1: LW - 6, y1: cy(r), x2: flowEnd, y2: cy(r), style: `animation-delay:${-r * 0.4}s` }, svg);
    const lab = el('text', { class: 'qlabel', x: 4, y: cy(r) + 4 }, svg);
    const q = el('tspan', { class: 'q' }, lab);
    q.textContent = `q${r}`;
    const k = el('tspan', { dx: 4 }, lab);
    k.textContent = '|0⟩';
  }
  // yerleşim kısıtı olan satırları soluklaştır
  if (ui.selected && ui.mode === 'level' && level().allowedRows?.[ui.selected]) {
    for (let r = 0; r < n; r++) {
      if (!allowed({ g: ui.selected, q: r })) el('rect', { class: 'disabled', x: LW, y: 4 + r * CH, width: COLS * CW, height: CH }, svg);
    }
  }
  for (const op of ui.ops) {
    const fresh = op === ui.justAdded;
    const outer = el('g', op.col >= ui.step ? { class: 'future' } : {}, svg);
    const g = el('g', { class: `opshape${fresh ? ' pop' : ''}` }, outer);
    const x = cx(op.col);
    if (op.g === 'ORACLE') {
      const [lo, hi] = span(op);
      const y0 = 4 + lo * CH + 5, hh = (hi - lo + 1) * CH - 10;
      el('rect', { class: 'oracle', x: x - 22, y: y0, width: 44, height: hh, rx: 12 }, g);
      el('rect', { class: 'oracle-edge', x: x - 22, y: y0, width: 44, height: hh, rx: 12 }, g);
      const txt = el('text', { class: 'otext', x, y: 4 + ((lo + hi + 1) * CH) / 2 + 6, 'text-anchor': 'middle' }, g);
      // "U_ω" → U ve alt simge ω; "U^k" → üst simge
      const [base, sub, sup] = (op.label ?? oracleOf(level()).label).match(/^([^_^]*)(?:_(.+))?(?:\^(.+))?$/).slice(1);
      txt.textContent = base;
      if (sub || sup) {
        const ts = el('tspan', { dy: sub ? 5 : -7, 'font-size': '12' }, txt);
        ts.textContent = sub || sup;
      }
      continue;
    }
    if (fresh) {
      const fam = getComputedStyle(document.documentElement).getPropertyValue(FAMILY_VAR[GATE_FAMILY[op.g]]);
      el('circle', { class: 'ripple', cx: x, cy: cy(op.q3 ?? op.q2 ?? op.q), r: 10, stroke: fam }, outer);
    }
    if (op.g === 'CCX') {
      const [lo, hi] = span(op);
      el('line', { class: 'link', x1: x, y1: cy(lo), x2: x, y2: cy(hi) }, g);
      el('circle', { class: 'dot', cx: x, cy: cy(op.q), r: 6 }, g);
      el('circle', { class: 'dot', cx: x, cy: cy(op.q2), r: 6 }, g);
      el('circle', { class: 'oplus', cx: x, cy: cy(op.q3), r: 13 }, g);
      el('line', { class: 'link', x1: x - 13, y1: cy(op.q3), x2: x + 13, y2: cy(op.q3) }, g);
      el('line', { class: 'link', x1: x, y1: cy(op.q3) - 13, x2: x, y2: cy(op.q3) + 13 }, g);
    } else if (GATES[op.g].arity === 2) {
      el('line', { class: 'link', x1: x, y1: cy(op.q), x2: x, y2: cy(op.q2) }, g);
      if (op.g === 'CNOT') {
        el('circle', { class: 'dot', cx: x, cy: cy(op.q), r: 6 }, g);
        el('circle', { class: 'oplus', cx: x, cy: cy(op.q2), r: 13 }, g);
        el('line', { class: 'link', x1: x - 13, y1: cy(op.q2), x2: x + 13, y2: cy(op.q2) }, g);
        el('line', { class: 'link', x1: x, y1: cy(op.q2) - 13, x2: x, y2: cy(op.q2) + 13 }, g);
      } else if (op.g === 'CZ' || op.g === 'CP') {
        el('circle', { class: 'dot', cx: x, cy: cy(op.q), r: 6 }, g);
        el('circle', { class: 'dot', cx: x, cy: cy(op.q2), r: 6 }, g);
        if (op.g === 'CP') {
          const my = (cy(op.q) + cy(op.q2)) / 2;
          el('rect', { class: 'cplabel', x: x - 20, y: my - 9, width: 40, height: 18, rx: 5 }, g);
          const lab = el('text', { class: 'gangle', x, y: my + 4, 'text-anchor': 'middle' }, g);
          lab.textContent = angleLabel(op.theta);
        }
      } else {
        for (const r of [op.q, op.q2]) {
          el('line', { class: 'link', x1: x - 8, y1: cy(r) - 8, x2: x + 8, y2: cy(r) + 8 }, g);
          el('line', { class: 'link', x1: x - 8, y1: cy(r) + 8, x2: x + 8, y2: cy(r) - 8 }, g);
        }
      }
    } else {
      const famVar = FAMILY_VAR[GATE_FAMILY[op.g]];
      el('rect', { class: 'gshadow', x: x - 19, y: cy(op.q) - 17, width: 42, height: 42, rx: 9 }, g);
      el('rect', { class: 'gbox', x: x - 21, y: cy(op.q) - 21, width: 42, height: 42, rx: 9 }, g);
      el('rect', { class: 'gfam', x: x - 20, y: cy(op.q) + 15, width: 40, height: 5, rx: 2, style: `fill:var(${famVar})` }, g);
      if (GATES[op.g].param) {
        const lab = el('text', { class: 'gtext', x, y: cy(op.q) - 1, 'text-anchor': 'middle' }, g);
        lab.textContent = GATES[op.g].label;
        const a = el('text', { class: 'gangle', x, y: cy(op.q) + 11, 'text-anchor': 'middle' }, g);
        a.textContent = angleLabel(op.theta);
      } else {
        const lab = el('text', { class: 'gtext', x, y: cy(op.q) + 5, 'text-anchor': 'middle' }, g);
        lab.textContent = op.g;
      }
    }
  }
  if (ui.pending) {
    for (const r of ui.pending.rows) el('circle', { class: 'pending', cx: cx(ui.pending.col), cy: cy(r), r: 18 }, svg);
  }
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < n; r++) {
      const rect = el('rect', { class: 'cell', x: LW + c * CW, y: 4 + r * CH, width: CW, height: CH, tabindex: 0 }, svg);
      const occ = occupant(c, r);
      const what = occ?.locked ? t('cell.locked') : occ ? t('cell.gate', { g: gateText(occ) }) : '';
      rect.setAttribute('role', 'button');
      rect.setAttribute('aria-label', t('cell.aria', { c: c + 1, r, what }));
      rect.addEventListener('click', () => onCell(c, r));
      rect.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onCell(c, r); } });
    }
  }
  ui.justAdded = null;
}

function renderPalette() {
  const pal = $('palette');
  pal.replaceChildren();
  for (const g of gateList()) {
    const b = document.createElement('button');
    const wide = ['CNOT', 'SWAP', 'CP', 'CCX', 'CZ'].includes(g);
    b.className = `gate${wide ? ' wide' : ''}${ui.selected === g ? ' sel' : ''}`;
    b.dataset.fam = GATE_FAMILY[g];
    b.textContent = wide ? g : GATES[g].label;
    b.setAttribute('aria-pressed', ui.selected === g);
    b.title = `${gateName(g)}: ${gateDesc(g)}`;
    b.addEventListener('click', () => selectGate(g));
    pal.appendChild(b);
  }
  if (gateList().some((g) => GATES[g].param)) {
    const lab = document.createElement('label');
    lab.className = `angle${GATES[ui.selected]?.param ? '' : ' dim'}`;
    lab.textContent = 'θ = ';
    const sel = document.createElement('select');
    sel.setAttribute('aria-label', t('gate.angle'));
    for (const a of ANGLES) {
      const o = document.createElement('option');
      o.value = a;
      o.textContent = angleLabel(a);
      if (Math.abs(a - ui.theta) < 1e-12) o.selected = true;
      sel.appendChild(o);
    }
    sel.addEventListener('change', () => {
      ui.theta = +sel.value;
      if (!GATES[ui.selected]?.param) selectGate(gateList().find((g) => GATES[g].param));
    });
    lab.appendChild(sel);
    pal.appendChild(lab);
  }
  pal.insertAdjacentHTML('beforeend', infoHtml('gates'));
  labelInfo(pal);
}

function setDesc() {
  const g = ui.selected;
  const d = $('gateDesc');
  if (!g) { d.textContent = t('gate.pick'); return; }
  d.replaceChildren();
  const b = document.createElement('b');
  b.textContent = gateName(g);
  const rest = document.createElement('span');
  setRich(rest, ` — ${gateDesc(g)}`);
  d.append(b, rest);
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
    card.innerHTML = `<h3>${t('side.qubits')}${infoHtml('qubits')}</h3>`;
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
    labelInfo(card);
    const p = document.createElement('p');
    p.className = 'fine';
    p.textContent = t('side.labNote');
    card.appendChild(p);
    card.appendChild(noisePanel());
  } else {
    card.innerHTML = `<h3>${t('side.levels')}${infoHtml('levels')}</h3>`;
    const list = document.createElement('div');
    list.className = 'levels';
    LEVELS.forEach((lv, i) => {
      if (lv.chapter !== LEVELS[i - 1]?.chapter) {
        const inCh = LEVELS.filter((l) => l.chapter === lv.chapter);
        const got = inCh.reduce((a, l) => a + (ui.progress[l.id] || 0), 0);
        const h = document.createElement('h4');
        h.innerHTML = `<span></span><span class="diff"></span><span class="chbar"><i></i></span><button class="info" type="button" data-info="chapter" data-ch="${lv.chapter}"></button>`;
        h.firstChild.textContent = chapterName(lv.chapter);
        const d = DIFFICULTY[lv.chapter];
        h.querySelector('.diff').textContent = t(`diff.${d}`);
        h.querySelector('.diff').dataset.d = d;
        h.querySelector('i').style.width = `${(got / (inCh.length * 3)) * 100}%`;
        list.appendChild(h);
      }
      const b = document.createElement('button');
      if (i === ui.levelIdx && ui.mode === 'level' && !ui.custom) { b.className = 'on'; b.setAttribute('aria-current', 'true'); }
      const stars = ui.progress[lv.id] || 0;
      const starLabel = t('stars.aria', { k: stars });
      b.innerHTML = `<span class="num">${i + 1}</span><span class="ttl"></span><span class="st" title="${starLabel}" aria-label="${starLabel}">${[0, 1, 2].map((k) => `<i class="${k < stars ? 'f' : ''}" aria-hidden="true">✦</i>`).join('')}</span>`;
      b.querySelector('.ttl').textContent = lvText(lv, 'title');
      b.addEventListener('click', () => { setMode('level'); loadLevel(i); });
      list.appendChild(b);
    });
    card.appendChild(list);
    labelInfo(card);
    // mobilde liste yatay kayar: seçili bölümü görünür yap (sayfayı dikey kaydırmadan)
    requestAnimationFrame(() => {
      const on = list.querySelector('button.on');
      if (on && list.scrollWidth > list.clientWidth) list.scrollLeft = on.offsetLeft - list.clientWidth / 2 + on.clientWidth / 2;
    });
    const total = Object.values(ui.progress).reduce((a, b) => a + b, 0);
    const p = document.createElement('p');
    p.className = 'total';
    p.textContent = t('side.total', { a: total, b: LEVELS.length * 3 });
    card.appendChild(p);
  }
  side.appendChild(card);
}

function noisePanel() {
  const box = document.createElement('div');
  box.className = 'noise';
  box.innerHTML = `<h3>${t('noise.title')}${infoHtml('noise')}</h3>`;
  const sel = document.createElement('select');
  sel.setAttribute('aria-label', t('noise.kind'));
  for (const [k, name] of [['yok', t('noise.off')], ...Object.keys(CHANNELS).map((k) => [k, chName(k)])]) {
    const o = document.createElement('option');
    o.value = k; o.textContent = name; o.selected = ui.noise.kind === k;
    sel.appendChild(o);
  }
  const lab = document.createElement('label');
  lab.className = 'noise-p';
  const range = document.createElement('input');
  Object.assign(range, { type: 'range', min: 0, max: 0.3, step: 0.01, value: ui.noise.p });
  range.setAttribute('aria-label', t('noise.p'));
  const out = document.createElement('output');
  const desc = document.createElement('p');
  desc.className = 'fine';
  const sync = () => {
    out.textContent = `p = ${Math.round(ui.noise.p * 100)}%`;
    const on = ui.noise.kind !== 'yok';
    lab.hidden = !on;
    desc.textContent = on ? t('noise.applied', { desc: chDesc(ui.noise.kind) }) : t('noise.intro');
  };
  sel.addEventListener('change', () => { ui.noise.kind = sel.value; sync(); update(); });
  range.addEventListener('input', () => { ui.noise.p = +range.value; sync(); update(); });
  lab.append(range, out);
  box.append(sel, lab, desc);
  labelInfo(box);
  sync();
  return box;
}

function renderStory() {
  const st = $('story');
  st.replaceChildren();
  st.removeAttribute('data-num');
  const h = document.createElement('h2');
  const p = document.createElement('p');
  if (ui.mode === 'help') { renderHelp(st); return; }
  if (ui.mode === 'why') { renderWhy(st); return; }
  if (ui.mode === 'sandbox') {
    h.textContent = t('lab.title');
    p.textContent = t('lab.story');
    st.dataset.num = 'ψ';
    st.append(h, p);
    return;
  }
  const lv = level();
  const chap = document.createElement('p');
  chap.className = 'chapter';
  chap.textContent = ui.custom ? '◎' : `${chapterName(lv.chapter)} · ${t(`diff.${DIFFICULTY[lv.chapter]}`)} · ${ui.levelIdx + 1}/${LEVELS.length}`;
  st.dataset.num = ui.custom ? '◎' : ui.levelIdx + 1;
  h.textContent = lvText(lv, 'title');
  setRich(p, lvText(lv, 'story'));
  const goalText = lvText(lv, 'goal');
  let goal = null;
  if (goalText) {
    goal = document.createElement('p');
    goal.className = 'objective';
    const k = document.createElement('b');
    k.textContent = t('story.goal');
    const v = document.createElement('span');
    setRich(v, goalText);
    goal.append(k, v);
  }
  const meta = document.createElement('div');
  meta.className = 'meta';
  const chip = (text, cls = '') => { const c = document.createElement('span'); c.className = `tagchip ${cls}`; c.textContent = text; meta.appendChild(c); };
  if (lv.oracle) {
    chip(lv.oracle.boxes
      ? t('story.boxes', { cols: lv.oracle.boxes.map((b) => b.col + 1).join(t('story.and')) })
      : t('story.box', { col: lv.oracle.col + 1 }));
  } else chip(t('story.target', { state: formatState(ui.target) }), 'ket');
  chip(t('story.par', { k: lv.par }));
  const det = document.createElement('details');
  const sum = document.createElement('summary');
  sum.textContent = t('story.hint');
  const hp = document.createElement('p');
  setRich(hp, lvText(lv, 'hint'));
  det.append(sum, hp);
  st.append(...[chap, h, goal, p, meta, det].filter(Boolean));
}

// "Neden?" sayfası: amaç, kimin için, sonunda kazanılanlar ve kısımların yolculuk haritası
function renderWhy(st) {
  st.classList.add('help', 'why');
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const h = el('h2', '', ''); h.textContent = t('why.title');
  const intro = el('p', 'why-intro', t('why.intro'));
  const grid = el('div', 'why-grid');
  const who = el('section', 'why-box');
  who.append(el('h3', '', t('why.who.title')), el('p', '', t('why.who')));
  const end = el('section', 'why-box');
  const ul = el('ul', 'why-list');
  for (let k = 1; k <= 5; k++) ul.append(el('li', '', t(`why.end${k}`)));
  end.append(el('h3', '', t('why.end.title')), ul);
  grid.append(who, end);
  const mapH = el('h3', '', t('why.map.title'));
  const mapSub = el('p', 'fine', t('why.map.sub'));
  const ol = el('ol', 'journey');
  const chapters = [...new Set(LEVELS.map((l) => l.chapter))];
  chapters.forEach((c, idx) => {
    const lvls = LEVELS.filter((l) => l.chapter === c);
    const got = lvls.reduce((a, l) => a + (ui.progress[l.id] || 0), 0);
    const max = lvls.length * 3;
    const d = DIFFICULTY[c];
    const li = el('li', 'stage');
    li.style.setProperty('--i', idx);
    li.innerHTML = `
      <div class="stage-head">
        <span class="stage-num">${idx + 1}</span>
        <div class="stage-title"><b></b><span class="diff" data-d="${d}"></span><span class="stage-count"></span></div>
        <div class="stage-prog" title="${got}/${max} ✦"><span><i style="width:${(got / max) * 100}%"></i></span><em>${got}/${max} ✦</em></div>
      </div>
      <div class="stage-body">
        <div><span class="stage-k">${t('why.gain')}</span><p class="g"></p></div>
        <div><span class="stage-k">${t('why.world')}</span><p class="w"></p></div>
      </div>
      <button class="btn stage-go" type="button"></button>`;
    li.querySelector('.stage-title b').textContent = chapterName(c);
    li.querySelector('.diff').textContent = t(`diff.${d}`);
    li.querySelector('.stage-count').textContent = t('why.levels', { k: lvls.length });
    li.querySelector('.g').textContent = t(`chgain.${c}`);
    li.querySelector('.w').textContent = t(`chworld.${c}`);
    const go = li.querySelector('.stage-go');
    go.innerHTML = `${t('why.start')} <span aria-hidden="true">→</span>`;
    go.addEventListener('click', () => {
      setMode('level');
      loadLevel(LEVELS.indexOf(lvls[0]));
      scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    });
    ol.append(li);
  });
  st.replaceChildren(h, intro, grid, mapH, mapSub, ol, el('p', 'fine', t('why.honest')));
}

function renderHelp(st) {
  st.classList.add('help');
  st.innerHTML = t('help.html');
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
  $('stepOut').textContent = ui.step >= COLS ? t('ctl.all') : `${ui.step}/${COLS}`;

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
  const rho = noiseOn() ? noisyRho() : null;
  for (let q = 0; q < n; q++) {
    const v = rho ? rhoBloch(rho, q) : blochVector(s, q);
    const f = wrap.children[q];
    drawBloch(f.querySelector('canvas'), v);
    const S = rho ? entropyFromBloch(v) : entanglementEntropy(s, q);
    ents.push(S);
    const cap = f.querySelector('figcaption');
    cap.innerHTML = `<b>q${q}</b> · |r| = ${Math.hypot(v.x, v.y, v.z).toFixed(2)}<br>${rho ? t('v.entropy') : t('v.entangle')} ${S.toFixed(2)} bit`;
  }
  const info = $('noiseInfo');
  info.hidden = !rho;
  if (rho) {
    info.textContent = t('v.noiseInfo', { f: (rhoFidelity(rho, s) * 100).toFixed(1), p: purity(rho).toFixed(3) });
  }
  const maxEnt = Math.max(...ents);
  $('entNote').textContent = rho ? t('ent.noise')
    : n < 2 ? t('ent.single')
      : maxEnt > 0.99 ? t('ent.max')
        : maxEnt > 0.01 ? t('ent.partial')
          : t('ent.product');

  // hedef
  if (ui.mode === 'level') {
    const lv = level();
    const r = evaluateLevel(lv, ui.ops);
    $('target').hidden = !!lv.oracle;
    renderVariants(lv, r);
    if (!lv.oracle) drawAmplitudes($('target'), ui.target);
    $('fid').textContent = lv.oracle
      ? t('v.solved', { a: r.checks.filter((c) => c.ok).length, b: r.checks.length })
      : t('v.fid', { p: (r.score * 100).toFixed(1) });
    $('fidBar').style.width = `${(r.score * 100).toFixed(1)}%`;
    if (r.solved && !ui.won && playerGateCount(ui.ops)) {
      ui.won = true;
      if (!document.body.classList.contains('touring')) setTimeout(win, 350);
    }
  }
  renderCircuit();
  $('hist').innerHTML = `<span class="empty">${t('m.empty')}</span>`;
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
  p.textContent = t('v.variantsIntro');
  box.appendChild(p);
  orc.variants.forEach((v, i) => {
    const b = document.createElement('button');
    b.className = `chip${i === ui.variant ? ' on' : ''}${r.checks[i].ok ? ' ok' : ''}`;
    b.textContent = `${tx(v.name)} → ${tx(v.goal)}`;
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
  if (!ui.custom && stars > prev) { ui.progress[lv.id] = stars; store.set('dolanik.progress', ui.progress); }
  $('winStars').innerHTML = [0, 1, 2].map((k) => `<span class="${k < stars ? 'f' : ''}">✦</span>`).join('');
  $('winStars').setAttribute('aria-label', `${stars}/3`);
  $('winTitle').textContent = ui.custom ? t('win.challenge') : ui.levelIdx === LEVELS.length - 1 ? t('win.allDone') : t('win.title');
  $('winText').textContent = t('win.text', { k: used, par: lv.par, extra: stars < 3 ? t('win.retry') : t('win.perfect') });
  $('next').hidden = !!ui.custom || ui.levelIdx >= LEVELS.length - 1;
  const lesson = ui.custom ? '' : lvText(lv, 'lesson');
  $('winLessonBox').hidden = !lesson;
  if (lesson) setRich($('winLesson'), lesson);
  $('win').hidden = false;
  burst($('burst'));
  playState(runCircuit(lv.n, playableOps()), 2.4);
  renderSide();
  $('next').focus();
}

// ---------- ölçüm ----------
function renderHist(counts, hit, amps = null) {
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
    if (amps) fill.style.setProperty('--bar', `hsl(${((Math.atan2(amps.im[i], amps.re[i]) * 180) / Math.PI + 360) % 360} 85% 55%)`);
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
  const k = noiseOn() ? sampleRho(noisyRho()) : sample(s);
  const counts = new Array(s.re.length).fill(0);
  counts[k] = 1;
  renderHist(counts, k, s);
  ui.lastHit = k;
  drawAmplitudes($('amps'), s, { highlight: k });
  const card = $('stateCard');
  card.classList.remove('collapse'); void card.offsetWidth; card.classList.add('collapse');
  // ölçüm sonrası çöken durumu sesle duyur
  if ($('autoSound').checked) {
    const collapsed = zeroState(s.n); collapsed.re[0] = 0; collapsed.re[k] = 1;
    playState(collapsed, 0.9);
  }
  toast(t('toast.result', { ket: ketLabel(k, s.n) }));
}

function measureMany() {
  const s = currentState();
  renderHist(noiseOn() ? measureShotsRho(noisyRho(), 256) : measureShots(s, 256), null, s);
}

// ---------- paylaşım (yalnızca laboratuvar) ----------
function writeHash() {
  const code = encodeOps(ui.ops);
  history.replaceState(null, '', `#lab=${ui.sandboxN}~${code}`);
}
function encodeOps(ops) {
  return ops.map((o) => `${o.g}.${o.q}${o.q2 != null ? '-' + o.q2 : ''}${o.q3 != null ? '-' + o.q3 : ''}.${o.col}${o.theta != null ? '@' + +o.theta.toPrecision(12) : ''}`).join('_');
}

function readHash() {
  const c = location.hash.match(/^#meydan=([A-Za-z0-9_-]+)$/);
  if (c) return loadChallenge(c[1]);
  const m = location.hash.match(/^#lab=([1-4])~(.*)$/);
  if (!m) return false;
  ui.sandboxN = +m[1];
  ui.ops = parseOps(ui.sandboxN, m[2]);
  return 'lab';
}

function parseOps(n, code) {
  const saved = ui.ops;
  ui.ops = [];
  for (const part of code.split('_').filter(Boolean)) {
    const pm = part.match(/^([A-Z]+)\.(\d)(?:-(\d))?(?:-(\d))?\.(\d{1,2})(?:@(-?[\d.]+(?:e-?\d+)?))?$/);
    if (!pm || !GATES[pm[1]]) continue;
    if (!!GATES[pm[1]].param !== (pm[6] != null)) continue;
    const op = { g: pm[1], q: +pm[2], col: +pm[5] };
    if (pm[6] != null) op.theta = +pm[6];
    if (pm[3] != null) op.q2 = +pm[3];
    if (pm[4] != null) op.q3 = +pm[4];
    const rows = opRows(op);
    if (rows.length !== GATES[op.g].arity || new Set(rows).size !== rows.length) continue;
    if (rows.some((r) => r >= n) || op.col >= LAB_COLS) continue;
    const [lo, hi] = span(op);
    let free = true;
    for (let r = lo; r <= hi; r++) if (occupant(op.col, r)) free = false;
    if (free) ui.ops.push(op);
  }
  const ops = ui.ops;
  ui.ops = saved;
  return ops;
}

// ---------- meydan okuma ----------
const b64 = {
  enc: (t) => btoa(t).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
  dec: (t) => atob(t.replace(/-/g, '+').replace(/_/g, '/')),
};

function challengeLink() {
  const used = ui.ops.filter((o) => !o.locked);
  if (!used.length) { toast(t('toast.needGates')); return null; }
  return `${location.origin}${location.pathname}#meydan=${b64.enc(`${ui.sandboxN}~${encodeOps(used)}`)}`;
}

function loadChallenge(code) {
  let text;
  try { text = b64.dec(code); } catch { return false; }
  const m = text.match(/^([1-4])~(.*)$/);
  if (!m) return false;
  const n = +m[1];
  const ops = parseOps(n, m[2]);
  if (!ops.length) return false;
  const s = runCircuit(n, ops);
  const gates = Object.keys(GATES).filter((g) => ops.some((o) => o.g === g));
  ui.custom = {
    id: 'meydan',
    chapter: '',
    n, gates, par: ops.length,
    target: Array.from(s.re, (r, i) => [r, s.im[i]]),
  };
  return 'challenge';
}

// ---------- modlar ----------
function setMode(mode) {
  ui.mode = mode;
  COLS = mode === 'sandbox' ? LAB_COLS : LEVEL_COLS;
  $('step').max = COLS;
  ui.step = COLS;
  $('step').value = COLS;
  // yalnızca mod sınıfını değiştir; 'touring' gibi diğer sınıflar korunur
  document.body.classList.remove('mode-level', 'mode-sandbox', 'mode-help', 'mode-why');
  document.body.classList.add(`mode-${mode}`);
  $('story').classList.remove('help', 'why');
  for (const b of document.querySelectorAll('.modes button')) {
    b.classList.toggle('on', b.dataset.mode === mode);
    b.setAttribute('aria-selected', b.dataset.mode === mode);
  }
  moveThumb();
}

// kayan mod göstergesi
function moveThumb() {
  const on = document.querySelector('.modes button.on');
  const nav = document.querySelector('.modes');
  if (!on) return;
  nav.style.setProperty('--x', `${on.offsetLeft}px`);
  nav.style.setProperty('--w', `${on.offsetWidth}px`);
}

function loadLevel(i) {
  ui.custom = null;
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
  if (!ui.custom) history.replaceState(null, '', location.pathname);
  renderAll();
}

function startChallenge() {
  setMode('level');
  COLS = LAB_COLS;
  $('step').max = COLS; ui.step = COLS; $('step').value = COLS;
  const lv = ui.custom;
  ui.target = stateFromAmplitudes(lv.n, lv.target);
  ui.ops = []; ui.history = []; ui.selected = lv.gates[0]; ui.pending = null; ui.won = false; ui.variant = 0;
  ui.shown = zeroState(lv.n);
  renderAll();
}

function renderAll() {
  renderSide();
  renderStory();
  if (isTextMode()) return;
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
  try { await navigator.clipboard.writeText(location.href); toast(t('toast.linkCopied')); } catch { toast(t('toast.linkBar')); }
});
// ---------- OpenQASM ----------
function qasmText() {
  const v = variantObj();
  const version = +$('qasmVer').value;
  const comment = [t('qasm.c1'), t('qasm.c2'), ...(v ? [t('qasm.c3', { v: tx(v.name) })] : [])].join('\n');
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
  try { await navigator.clipboard.writeText($('qasmCode').value); toast(t('toast.qasmCopied')); } catch { $('qasmCode').select(); }
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
    toast(t('toast.imported', { k: ops.length }));
  } catch (err) {
    $('qasmErr').textContent = err.key ? t(`qasm.e.${err.key}`, err.params) : err.message;
  }
});

$('challenge').addEventListener('click', async () => {
  const link = challengeLink();
  if (!link) return;
  try { await navigator.clipboard.writeText(link); toast(t('toast.challengeCopied')); } catch { prompt(t('prompt.share'), link); }
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
  if (e.ctrlKey || e.metaKey || e.altKey || isTextMode()) return;
  const k = e.key.toUpperCase();
  const map = { C: 'CNOT', W: 'SWAP' };
  const g = GATES[k] ? k : map[k];
  if (g && gateList().includes(g)) selectGate(g);
});

let rz;
window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { moveThumb(); if (!isTextMode()) update({ silent: true }); }, 120); });

$('langBtn').addEventListener('click', () => {
  setLang(isEn() ? 'tr' : 'en');
  store.set('dolanik.lang', getLang());
  applyStaticText();
  moveThumb();
  renderAll();
});
$('themeBtn').addEventListener('click', () => {
  const dark = document.documentElement.dataset.theme
    ? document.documentElement.dataset.theme === 'dark'
    : matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme = dark ? 'light' : 'dark';
  store.set('dolanik.theme', document.documentElement.dataset.theme);
  if (ui.mode !== 'help') update({ silent: true });
});
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => ui.mode !== 'help' && update({ silent: true }));

// kaydırıcıların dolu kısmı (--fill): sürüklerken ve kod değeri değiştirdiğinde
function syncRange(r) {
  const min = +r.min || 0, max = +r.max || 100;
  r.style.setProperty('--fill', `${((+r.value - min) / (max - min || 1)) * 100}%`);
}
document.addEventListener('input', (e) => { if (e.target.matches?.('input[type="range"]')) syncRange(e.target); });
new MutationObserver(() => document.querySelectorAll('input[type="range"]').forEach(syncRange))
  .observe(document.body, { childList: true, subtree: true });
const _stepSet = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
for (const r of document.querySelectorAll('input[type="range"]')) {
  Object.defineProperty(r, 'value', { get() { return _stepSet.get.call(this); }, set(v) { _stepSet.set.call(this, v); syncRange(this); } });
}

// ---------- karşılama ve rehber tur ----------
let levelBeforeTour = null;
const tour = createTour({
  t,
  onStart: () => {
    $('welcome').open && $('welcome').close();
    levelBeforeTour = ui.mode === 'level' && !ui.custom ? ui.levelIdx : null;
    setMode('level');
    loadLevel(0);
  },
  onEnd: () => {
    setMode('level');
    loadLevel(levelBeforeTour ?? 0);
    store.set('dolanik.welcomed', true);
  },
});
$('tourBtn').addEventListener('click', () => tour.start());
$('welcomeTour').addEventListener('click', () => { $('welcome').close(); tour.start(); });
$('welcomeSkip').addEventListener('click', () => { $('welcome').close(); store.set('dolanik.welcomed', true); });
$('welcome').addEventListener('close', () => store.set('dolanik.welcomed', true));

// ---------- başlat ----------
applyStaticText();
setupInfoTips();
startSpace($('space'));
startField($('field'));
startTrail($('trail'));
startAtom($('atom'));
startAtom($('welcomeAtom'));
startEquations($('eqs'));
startSpotlight();
document.fonts?.ready.then(() => { moveThumb(); if (ui.mode !== 'help') update({ silent: true }); });
const fromHash = readHash();
if (fromHash === 'challenge') {
  startChallenge();
} else if (fromHash === 'lab') {
  setMode('sandbox');
  ui.selected = 'H';
  ui.shown = zeroState(ui.sandboxN);
  renderAll();
} else {
  setMode('level');
  loadLevel(ui.levelIdx);
  // ilk ziyaret: siteyi tanıtan karşılama ekranı
  if (!store.get('dolanik.welcomed', false)) setTimeout(() => $('welcome').showModal(), 500);
}
