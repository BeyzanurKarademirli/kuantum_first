// Arka plan: gerçek bir dalga girişimi ("ebru").
// Üç hareketli nokta kaynak küresel dalga yayar; her pikselde karmaşık genlikler toplanır.
// Renk = faz (oyundaki renk tekerleğinin aynısı), parlaklık = genliğin büyüklüğü.
// Düşük çözünürlükte hesaplanır, CSS bulanıklığıyla yumuşatılır. Hareket azaltma tercihine uyar.

function hsl2rgb(h, s, l) {
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}

// faz → RGB tablosu (360 giriş), her karede hsl hesaplamamak için
const LUT = Array.from({ length: 360 }, (_, h) => hsl2rgb(h, 0.85, 0.55));

export function startEbru(canvas) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ctx = canvas.getContext('2d', { alpha: true });
  let W = 0, H = 0, img = null;
  const resize = () => {
    const aspect = innerWidth / Math.max(1, innerHeight);
    H = 54; W = Math.max(40, Math.round(H * aspect));
    canvas.width = W; canvas.height = H;
    img = ctx.createImageData(W, H);
  };
  resize();
  addEventListener('resize', resize);

  const sources = [
    { ax: 0.22, ay: 0.3, rx: 0.12, ry: 0.18, sp: 0.07, k: 0.42, ph: 0 },
    { ax: 0.78, ay: 0.62, rx: 0.15, ry: 0.12, sp: -0.05, k: 0.38, ph: 2.1 },
    { ax: 0.5, ay: 0.95, rx: 0.25, ry: 0.06, sp: 0.04, k: 0.3, ph: 4.2 },
  ];

  const draw = (t) => {
    const d = img.data;
    const pos = sources.map((s) => [
      (s.ax + s.rx * Math.cos(t * s.sp * 6 + s.ph)) * W,
      (s.ay + s.ry * Math.sin(t * s.sp * 5 + s.ph)) * H,
    ]);
    let i = 0;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        let re = 0, im = 0;
        for (let k = 0; k < sources.length; k++) {
          const s = sources[k];
          const dx = x - pos[k][0], dy = y - pos[k][1];
          const r = Math.sqrt(dx * dx + dy * dy);
          const a = s.k * r - t * 1.3 + s.ph;
          const amp = 1 / (1 + r * 0.02);
          re += amp * Math.cos(a);
          im += amp * Math.sin(a);
        }
        const mag = Math.min(1, Math.hypot(re, im) / 2.2);
        let h = Math.round((Math.atan2(im, re) * 180) / Math.PI);
        if (h < 0) h += 360;
        const c = LUT[h % 360];
        d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2];
        d[i + 3] = 40 + mag * 215;
        i += 4;
      }
    }
    ctx.putImageData(img, 0, 0);
  };

  if (reduce) { draw(0); return; }
  let last = 0;
  const loop = (now) => {
    if (!document.hidden && now - last > 50) { // ~20 kare/sn yeterli
      last = now;
      draw(now / 1000);
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

// Kazanınca faz renkli parçacık patlaması
export function burst(canvas) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const dpr = devicePixelRatio || 1;
  const w = canvas.clientWidth, h = canvas.clientHeight;
  canvas.width = w * dpr; canvas.height = h * dpr;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const cx = w / 2, cy = h / 2 - 40;
  const parts = Array.from({ length: 140 }, (_, i) => {
    const a = (i / 140) * Math.PI * 2 + Math.random() * 0.3;
    const v = 4 + Math.random() * 9;
    return {
      x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 3,
      hue: Math.round((a * 180) / Math.PI + 360) % 360, // faz rengi = yön
      rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
      size: 4 + Math.random() * 7, kind: i % 3,
    };
  });
  const t0 = performance.now();
  const frame = (now) => {
    const t = (now - t0) / 1000;
    ctx.clearRect(0, 0, w, h);
    for (const p of parts) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.22; p.vx *= 0.985; p.rot += p.vr;
      const c = LUT[p.hue];
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - t / 1.8);
      ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
      ctx.strokeStyle = ctx.fillStyle;
      if (p.kind === 0) { ctx.beginPath(); ctx.ellipse(0, 0, p.size, p.size * 0.45, 0, 0, Math.PI * 2); ctx.fill(); }
      else if (p.kind === 1) { ctx.fillRect(-p.size / 2, -p.size / 6, p.size, p.size / 3); }
      else { // küçük Bloch oku
        ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-p.size, 0); ctx.lineTo(p.size, 0); ctx.stroke();
        ctx.beginPath(); ctx.arc(p.size, 0, 2.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
    if (t < 1.9) requestAnimationFrame(frame); else ctx.clearRect(0, 0, w, h);
  };
  requestAnimationFrame(frame);
}
