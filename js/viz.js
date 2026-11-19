// Görselleştirme: genlik çemberleri (boyut = |a|, renk/ok = faz) ve Bloch küreleri.
import { ketLabel } from './quantum.js';

export function phaseColor(re, im, alpha = 1) {
  const h = ((Math.atan2(im, re) * 180) / Math.PI + 360) % 360;
  return `hsla(${h}, 85%, 60%, ${alpha})`;
}

function setupCanvas(cv) {
  const dpr = window.devicePixelRatio || 1;
  const w = cv.clientWidth, h = cv.clientHeight;
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
  }
  const ctx = cv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  return { ctx, w, h };
}

const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export function drawAmplitudes(cv, s, opts = {}) {
  const { ctx, w, h } = setupCanvas(cv);
  const N = s.re.length;
  const cols = N <= 4 ? N : N <= 8 ? 4 : 8;
  const rows = Math.ceil(N / cols);
  const cw = w / cols, ch = h / rows;
  const R = Math.min(cw, ch - 16) * 0.38;
  const ink = css('--ink'), dim = css('--ink-dim'), line = css('--line');
  ctx.font = `${Math.max(10, Math.min(14, cw / 5))}px ui-monospace, monospace`;
  ctx.textAlign = 'center';
  for (let i = 0; i < N; i++) {
    const cx = (i % cols) * cw + cw / 2;
    const cy = Math.floor(i / cols) * ch + (ch - 16) / 2 + 2;
    const re = s.re[i], im = s.im[i];
    const mag = Math.hypot(re, im);
    // birim çember
    ctx.strokeStyle = line; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    if (mag > 1e-4) {
      const r = R * mag;
      const g = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
      g.addColorStop(0, phaseColor(re, im, 0.95));
      g.addColorStop(1, phaseColor(re, im, 0.55));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      // faz ibresi (karmaşık düzlem: sağ = +1, yukarı = +i)
      const a = Math.atan2(im, re);
      ctx.strokeStyle = ink; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * R, cy - Math.sin(a) * R); ctx.stroke();
    }
    ctx.fillStyle = mag > 1e-4 ? ink : dim;
    ctx.fillText(ketLabel(i, s.n), cx, cy + R + 14);
    if (opts.highlight === i) {
      ctx.strokeStyle = css('--accent'); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(cx, cy, R + 5, 0, Math.PI * 2); ctx.stroke();
    }
  }
}

// Basit 3B izdüşüm: hafif yukarıdan ve yandan bakan kamera
function project(x, y, z, cx, cy, R) {
  const yaw = -0.6, pitch = 0.35;
  const x1 = x * Math.cos(yaw) - y * Math.sin(yaw);
  const y1 = x * Math.sin(yaw) + y * Math.cos(yaw);
  const z2 = z * Math.cos(pitch) - y1 * Math.sin(pitch);
  const depth = z * Math.sin(pitch) + y1 * Math.cos(pitch);
  return [cx + x1 * R, cy - z2 * R, depth];
}

export function drawBloch(cv, v) {
  const { ctx, w, h } = setupCanvas(cv);
  const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.36;
  const dim = css('--ink-dim'), line = css('--line'), acc = css('--accent');
  ctx.lineWidth = 1;
  ctx.strokeStyle = line;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
  // ekvator
  ctx.beginPath();
  for (let k = 0; k <= 64; k++) {
    const t = (k / 64) * Math.PI * 2;
    const [px, py, d] = project(Math.cos(t), Math.sin(t), 0, cx, cy, R);
    ctx.globalAlpha = d < 0 ? 0.35 : 1;
    k ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.stroke(); ctx.globalAlpha = 1;
  // eksenler
  ctx.font = '11px ui-monospace, monospace'; ctx.fillStyle = dim; ctx.textAlign = 'center';
  const axes = [[[0, 0, 1], '|0⟩'], [[0, 0, -1], '|1⟩'], [[1, 0, 0], '+'], [[0, 1, 0], '+i']];
  for (const [[x, y, z], t] of axes) {
    const [ax, ay] = project(x, y, z, cx, cy, R);
    const [bx, by] = project(-x, -y, -z, cx, cy, R);
    ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ax, ay); ctx.stroke(); ctx.setLineDash([]);
    const [lx, ly] = project(x * 1.22, y * 1.22, z * 1.22, cx, cy, R);
    ctx.fillText(t, lx, ly + 4);
  }
  // durum oku
  const len = Math.hypot(v.x, v.y, v.z);
  const [tx, ty] = project(v.x, v.y, v.z, cx, cy, R);
  const col = len > 0.98 ? acc : len > 0.02 ? css('--warn') : css('--ent');
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(tx, ty); ctx.stroke();
  ctx.beginPath(); ctx.arc(tx, ty, len > 0.02 ? 5 : 7, 0, Math.PI * 2); ctx.fill();
}

export function lerpState(a, b, t) {
  const re = new Float64Array(a.re.length), im = new Float64Array(a.re.length);
  for (let i = 0; i < re.length; i++) {
    re[i] = a.re[i] + (b.re[i] - a.re[i]) * t;
    im[i] = a.im[i] + (b.im[i] - a.im[i]) * t;
  }
  return { n: a.n, re, im };
}
