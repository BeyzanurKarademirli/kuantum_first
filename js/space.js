// Arka plan: uzay.
// Koyu tema: derin uzay; titreşen yıldızlar (3 derinlik katmanı, imleçle paralaks),
//            yumuşak bulutsular ve ara sıra kayan yıldızlar.
// Açık tema: kâğıt üzerine mürekkeple çizilmiş yıldız atlası; takımyıldız çizgileri.
// "Hareketi azalt" tercihinde tek kare çizilir.

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isDark = () => {
  const t = document.documentElement.dataset.theme;
  return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
};

// tohumlu rastgelelik: her açılışta aynı gökyüzü
function rng(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

export function startSpace(canvas) {
  const ctx = canvas.getContext('2d');
  let W, H, dpr, stars = [], links = [], nebula = null;
  const pointer = { x: 0.5, y: 0.4, tx: 0.5, ty: 0.4 };
  addEventListener('pointermove', (e) => { pointer.tx = e.clientX / innerWidth; pointer.ty = e.clientY / innerHeight; }, { passive: true });

  const build = () => {
    dpr = Math.min(2, devicePixelRatio || 1);
    W = innerWidth; H = innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const r = rng(20261119);
    const count = Math.round((W * H) / 2300);
    stars = Array.from({ length: count }, () => {
      const depth = r() < 0.7 ? 0.25 : r() < 0.8 ? 0.6 : 1;
      return {
        x: r() * (W + 80) - 40, y: r() * (H + 80) - 40, depth,
        size: depth === 1 ? 1.3 + r() * 1.4 : depth === 0.6 ? 0.9 + r() * 0.7 : 0.5 + r() * 0.5,
        tw: r() * Math.PI * 2, sp: 0.6 + r() * 2.2,
        hue: r() < 0.15 ? 25 + r() * 20 : r() < 0.3 ? 205 + r() * 25 : 0, // birkaç sıcak, birkaç soğuk yıldız
      };
    });
    // takımyıldızlar: parlak yıldızları en yakın komşularıyla birleştir (açık tema atlası)
    const bright = stars.filter((s) => s.depth === 1);
    links = [];
    for (const a of bright) {
      let best = null, bd = Infinity;
      for (const b of bright) {
        if (a === b) continue;
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < bd && d < 190) { bd = d; best = b; }
      }
      if (best && !links.some(([p, q]) => (p === best && q === a))) links.push([a, best]);
    }
    // bulutsular: küçük bir tuvalde bir kez çizilir, büyütülerek kullanılır
    nebula = document.createElement('canvas');
    nebula.width = 160; nebula.height = Math.max(90, Math.round(160 * H / W));
    const n = nebula.getContext('2d');
    const blobs = [
      [0.18, 0.25, 0.42, 'rgba(88, 60, 200, 0.55)'],
      [0.82, 0.7, 0.5, 'rgba(30, 90, 170, 0.5)'],
      [0.62, 0.18, 0.3, 'rgba(170, 60, 130, 0.35)'],
      [0.3, 0.85, 0.35, 'rgba(40, 120, 150, 0.3)'],
    ];
    for (const [x, y, rad, col] of blobs) {
      const g = n.createRadialGradient(x * nebula.width, y * nebula.height, 0, x * nebula.width, y * nebula.height, rad * nebula.width);
      g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
      n.fillStyle = g; n.fillRect(0, 0, nebula.width, nebula.height);
    }
  };
  build();
  let rz;
  addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(build, 150); });

  let meteor = null, nextMeteor = 4000;

  const draw = (now) => {
    const t = now / 1000;
    pointer.x += (pointer.tx - pointer.x) * 0.05;
    pointer.y += (pointer.ty - pointer.y) * 0.05;
    const ox = (pointer.x - 0.5) * -40, oy = (pointer.y - 0.5) * -30;
    const dark = isDark();
    ctx.clearRect(0, 0, W, H);

    if (dark) {
      ctx.globalAlpha = 0.9;
      ctx.drawImage(nebula, ox * 0.2 - 30, oy * 0.2 - 30, W + 60, H + 60);
      ctx.globalAlpha = 1;
    } else {
      // atlas: takımyıldız çizgileri
      ctx.strokeStyle = 'rgba(23, 20, 43, 0.10)';
      ctx.lineWidth = 0.8;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      for (const [a, b] of links) { ctx.moveTo(a.x + ox, a.y + oy); ctx.lineTo(b.x + ox, b.y + oy); }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    for (const s of stars) {
      const x = s.x + ox * s.depth, y = s.y + oy * s.depth;
      const tw = reduce ? 1 : 0.55 + 0.45 * Math.sin(t * s.sp + s.tw);
      if (dark) {
        const l = s.hue ? `hsla(${s.hue}, 80%, 80%, ${tw})` : `rgba(240, 236, 255, ${tw * (0.35 + s.depth * 0.65)})`;
        ctx.fillStyle = l;
        if (s.depth === 1) {
          // parlak yıldız: haç biçimli ışık
          ctx.fillRect(x - s.size * 2.2, y - 0.4, s.size * 4.4, 0.8);
          ctx.fillRect(x - 0.4, y - s.size * 2.2, 0.8, s.size * 4.4);
        }
        ctx.beginPath(); ctx.arc(x, y, s.size * (0.8 + tw * 0.3), 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = `rgba(23, 20, 43, ${0.12 + s.depth * 0.3})`;
        if (s.depth === 1) {
          // atlasta parlak yıldız: küçük dört köşeli yıldız
          ctx.save(); ctx.translate(x, y);
          ctx.beginPath();
          for (let k = 0; k < 8; k++) {
            const rr = k % 2 ? s.size * 0.9 : s.size * 3;
            const a = (k / 8) * Math.PI * 2;
            ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
          }
          ctx.closePath(); ctx.fill(); ctx.restore();
        } else {
          ctx.beginPath(); ctx.arc(x, y, s.size * 0.9, 0, Math.PI * 2); ctx.fill();
        }
      }
    }

    // kayan yıldız (yalnızca koyu temada)
    if (dark && !reduce) {
      if (!meteor && now > nextMeteor) {
        meteor = { x: Math.random() * W * 0.7 + W * 0.2, y: Math.random() * H * 0.3, t0: now, ang: Math.PI * (0.75 + Math.random() * 0.1) };
      }
      if (meteor) {
        const age = (now - meteor.t0) / 900;
        if (age > 1) { meteor = null; nextMeteor = now + 5000 + Math.random() * 7000; } else {
          const len = 140, dist = age * 520;
          const hx = meteor.x + Math.cos(meteor.ang) * dist, hy = meteor.y + Math.sin(meteor.ang) * dist;
          const g = ctx.createLinearGradient(hx, hy, hx - Math.cos(meteor.ang) * len, hy - Math.sin(meteor.ang) * len);
          g.addColorStop(0, `rgba(255, 248, 230, ${1 - age})`); g.addColorStop(1, 'rgba(255, 248, 230, 0)');
          ctx.strokeStyle = g; ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx - Math.cos(meteor.ang) * len, hy - Math.sin(meteor.ang) * len); ctx.stroke();
        }
      }
    }
  };

  if (reduce) {
    draw(0);
    addEventListener('resize', () => setTimeout(() => draw(0), 200));
    return { redraw: () => draw(0) };
  }
  let last = 0;
  const loop = (now) => {
    requestAnimationFrame(loop);
    if (document.hidden || now - last < 33) return; // ~30 kare/sn yeterli
    last = now;
    draw(now);
  };
  requestAnimationFrame(loop);
  return { redraw: () => draw(performance.now()) };
}
