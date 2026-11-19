// Kazanınca yıldız kıvılcımı patlaması: altın ve beyaz dört köşeli yıldızlar
export function burst(canvas) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const dpr = Math.min(2, devicePixelRatio || 1);
  const w = canvas.clientWidth, h = canvas.clientHeight;
  canvas.width = w * dpr; canvas.height = h * dpr;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const cx = w / 2, cy = h / 2 - 60;
  const COLORS = ['#ffd27a', '#fff3d6', '#ffb347', '#ffffff', '#ffe9a8'];
  const parts = Array.from({ length: 110 }, (_, i) => {
    const a = (i / 110) * Math.PI * 2 + Math.random() * 0.4;
    const v = 3 + Math.random() * 9;
    return {
      x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2.5,
      size: 3 + Math.random() * 6, rot: Math.random() * 3, vr: (Math.random() - 0.5) * 0.3,
      color: COLORS[i % COLORS.length], tw: Math.random() * 6,
    };
  });
  const star = (r) => {
    ctx.beginPath();
    for (let k = 0; k < 8; k++) {
      const rr = k % 2 ? r * 0.28 : r;
      const a = (k / 8) * Math.PI * 2;
      ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath(); ctx.fill();
  };
  const t0 = performance.now();
  const frame = (now) => {
    const t = (now - t0) / 1000;
    ctx.clearRect(0, 0, w, h);
    for (const p of parts) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.16; p.vx *= 0.98; p.vy *= 0.99; p.rot += p.vr;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - t / 1.9) * (0.6 + 0.4 * Math.sin(t * 14 + p.tw));
      ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.shadowColor = '#ffcf6a'; ctx.shadowBlur = 8;
      star(p.size);
      ctx.restore();
    }
    if (t < 2) requestAnimationFrame(frame); else ctx.clearRect(0, 0, w, h);
  };
  requestAnimationFrame(frame);
}
