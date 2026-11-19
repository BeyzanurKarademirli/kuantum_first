// Görselleştirme: genlik çemberleri (boyut = |a|, renk/ok = faz) ve Bloch küreleri.
import { ketLabel } from './quantum.js';

export function phaseColor(re, im, alpha = 1, light = 58) {
  const h = ((Math.atan2(im, re) * 180) / Math.PI + 360) % 360;
  return `hsla(${h}, 85%, ${light}%, ${alpha})`;
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
  // gizli tuval (ör. "Nasıl okunur?" açıkken): çizecek alan yok
  if (w < 4 || h < 4) return null;
  return { ctx, w, h };
}

const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export function drawAmplitudes(cv, s, opts = {}) {
  const c = setupCanvas(cv);
  if (!c) return;
  const { ctx, w, h } = c;
  const N = s.re.length;
  const cols = N <= 4 ? N : N <= 8 ? 4 : 8;
  const rows = Math.ceil(N / cols);
  const cw = w / cols, ch = h / rows;
  const R = Math.max(1, Math.min(cw, ch - 18) * 0.4);
  const ink = css('--ink'), dim = css('--ink-3'), line = css('--line-2'), card = css('--card');
  ctx.font = `500 ${Math.max(10, Math.min(12.5, cw / 5.5))}px "JetBrains Mono", ui-monospace, monospace`;
  ctx.textAlign = 'center';
  for (let i = 0; i < N; i++) {
    const cx = (i % cols) * cw + cw / 2;
    const cy = Math.floor(i / cols) * ch + (ch - 18) / 2 + 3;
    const re = s.re[i], im = s.im[i];
    const mag = Math.hypot(re, im);
    // birim çember: kesik çizgili "kalıp"
    ctx.strokeStyle = line; ctx.lineWidth = 1.2; ctx.setLineDash([2, 3]);
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    if (mag > 1e-4) {
      const r = Math.max(2, R * mag);
      // mürekkep damlası: faz renginde dolgu + koyu kontur + parlak iç ışık
      const g = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.05, cx, cy, r);
      g.addColorStop(0, phaseColor(re, im, 1, 72));
      g.addColorStop(1, phaseColor(re, im, 1, 52));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = ink; ctx.lineWidth = 1.5; ctx.stroke();
      // faz ibresi (karmaşık düzlem: sağ = +1, yukarı = +i)
      const a = Math.atan2(im, re);
      const ex = cx + Math.cos(a) * R, ey = cy - Math.sin(a) * R;
      ctx.strokeStyle = ink; ctx.lineWidth = 2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.fillStyle = card; ctx.beginPath(); ctx.arc(ex, ey, 3, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = ink; ctx.lineWidth = 1.5; ctx.stroke();
    }
    ctx.fillStyle = mag > 1e-4 ? ink : dim;
    ctx.fillText(ketLabel(i, s.n), cx, cy + R + 15);
    if (opts.highlight === i) {
      ctx.strokeStyle = css('--vermilion'); ctx.lineWidth = 3; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.arc(cx, cy, R + 6, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
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
  const c = setupCanvas(cv);
  if (!c) return;
  const { ctx, w, h } = c;
  const cx = w / 2, cy = h / 2 + 2, R = Math.min(w, h) * 0.36;
  const ink = css('--ink'), dim = css('--ink-3'), line = css('--line-2'), paper2 = css('--paper-2');
  // küre gövdesi: hafif gölgeli
  const body = ctx.createRadialGradient(cx - R * 0.4, cy - R * 0.45, R * 0.1, cx, cy, R);
  body.addColorStop(0, css('--card')); body.addColorStop(1, paper2);
  ctx.fillStyle = body; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = ink; ctx.lineWidth = 1.5; ctx.stroke();
  // ekvator ve bir meridyen (arka yarılar soluk)
  const ring = (fn) => {
    for (let k = 0; k < 64; k++) {
      const t0 = (k / 64) * Math.PI * 2, t1 = ((k + 1) / 64) * Math.PI * 2;
      const [ax, ay, d] = project(...fn(t0), cx, cy, R);
      const [bx, by] = project(...fn(t1), cx, cy, R);
      ctx.globalAlpha = d < 0 ? 0.3 : 0.9;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };
  ctx.strokeStyle = line; ctx.lineWidth = 1.2;
  ring((t) => [Math.cos(t), Math.sin(t), 0]);
  ring((t) => [Math.cos(t), 0, Math.sin(t)]);
  // eksen etiketleri
  ctx.font = '500 10.5px "JetBrains Mono", ui-monospace, monospace'; ctx.fillStyle = dim; ctx.textAlign = 'center';
  const axes = [[[0, 0, 1], '|0⟩'], [[0, 0, -1], '|1⟩'], [[1, 0, 0], '+'], [[0, 1, 0], '+i']];
  for (const [[x, y, z], t] of axes) {
    const [lx, ly] = project(x * 1.24, y * 1.24, z * 1.24, cx, cy, R);
    ctx.fillText(t, lx, ly + 4);
  }
  // durum oku: renk saflığı anlatır (yeşim = saf, safran = kısmen, gül = tamamen karışık)
  const len = Math.hypot(v.x, v.y, v.z);
  const col = len > 0.98 ? css('--jade') : len > 0.02 ? css('--saffron') : css('--rose');
  const [tx, ty] = project(v.x, v.y, v.z, cx, cy, R);
  const [px, py] = project(v.x, v.y, 0, cx, cy, R);
  if (len > 0.02) {
    // ekvator düzlemine düşen gölge
    ctx.strokeStyle = dim; ctx.lineWidth = 1; ctx.setLineDash([2, 3]);
    ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(px, py); ctx.lineTo(cx, cy); ctx.stroke(); ctx.setLineDash([]);
  }
  ctx.strokeStyle = ink; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(tx, ty); ctx.stroke();
  ctx.strokeStyle = col; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(tx, ty); ctx.stroke();
  ctx.fillStyle = col; ctx.strokeStyle = ink; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(tx, ty, len > 0.02 ? 5.5 : 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
}

export function lerpState(a, b, t) {
  const re = new Float64Array(a.re.length), im = new Float64Array(a.re.length);
  for (let i = 0; i < re.length; i++) {
    re[i] = a.re[i] + (b.re[i] - a.re[i]) * t;
    im[i] = a.im[i] + (b.im[i] - a.im[i]) * t;
  }
  return { n: a.n, re, im };
}
