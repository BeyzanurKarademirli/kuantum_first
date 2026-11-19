// İmleçle etkileşimli görsel efektler:
//  1. Uzay-zaman ağı: arka plandaki tel ızgara imleci bir kütle gibi algılayıp bükülür;
//     tıklanan yerden ağ boyunca dalga yayılır.
//  2. Foton izi: imlecin arkasında faz renklerinde ışık izi (yalnızca fare/kalem).
//  3. Işıldayan atom: logodaki elektronlar ışık izi bırakır, imlece doğru eğilir.
//  4. Denklem tahtası: arka planda süzülen kuantum formülleri, imleçle paralaks.
//  5. Kart ışığı: imlecin altındaki karta yumuşak bir ışık lekesi.
// "Hareketi azalt" tercihinde hepsi durağan tek kare çizer ya da kapanır.

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(pointer: fine)').matches;
const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const isDark = () => {
  const t = document.documentElement.dataset.theme;
  return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
};

// ortak imleç durumu (yumuşatılmış)
const pointer = { x: innerWidth / 2, y: innerHeight * 0.4, tx: innerWidth / 2, ty: innerHeight * 0.4, active: false, speed: 0 };
addEventListener('pointermove', (e) => {
  pointer.speed = Math.min(60, Math.hypot(e.clientX - pointer.tx, e.clientY - pointer.ty));
  pointer.tx = e.clientX; pointer.ty = e.clientY; pointer.active = true;
}, { passive: true });
document.addEventListener('pointerleave', () => { pointer.active = false; });

// ---------------------------------------------------------------- 1 + 2
export function startField(canvas) {
  const ctx = canvas.getContext('2d');
  let W, H, dpr;
  const resize = () => {
    dpr = Math.min(2, devicePixelRatio || 1);
    W = innerWidth; H = innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  addEventListener('resize', resize);

  const ripples = [];
  addEventListener('pointerdown', (e) => {
    ripples.push({ x: e.clientX, y: e.clientY, t0: performance.now() });
    if (ripples.length > 6) ripples.shift();
  }, { passive: true });

  const GAP = 46;

  // ağdaki bir noktanın bükülmüş konumu
  const warp = (x, y, t, now) => {
    let dx = 0, dy = 0;
    // imleç: yerçekimi kuyusu gibi içe çeker
    const px = pointer.x - x, py = pointer.y - y;
    const r2 = px * px + py * py;
    const pull = pointer.active ? 0.34 * Math.exp(-r2 / 26000) : 0;
    dx += px * pull; dy += py * pull;
    // tıklama dalgaları: ağ boyunca yayılan halkalar
    for (const rp of ripples) {
      const age = (now - rp.t0) / 1000;
      if (age > 2.4) continue;
      const rx = x - rp.x, ry = y - rp.y;
      const r = Math.hypot(rx, ry) || 1;
      const front = age * 520;
      const amp = 16 * Math.exp(-age * 1.6) * Math.exp(-((r - front) ** 2) / 5000);
      const s = Math.sin((r - front) / 22) * amp;
      dx += (rx / r) * s; dy += (ry / r) * s;
    }
    // hafif kendiliğinden dalgalanma
    dy += Math.sin(x / 140 + t * 0.6) * 3;
    dx += Math.cos(y / 160 + t * 0.5) * 3;
    return [x + dx, y + dy];
  };

  const draw = (now) => {
    const t = now / 1000;
    pointer.x += (pointer.tx - pointer.x) * 0.12;
    pointer.y += (pointer.ty - pointer.y) * 0.12;
    while (ripples.length && now - ripples[0].t0 > 2400) ripples.shift();
    ctx.clearRect(0, 0, W, H);

    const dark = isDark();
    ctx.lineWidth = 1;
    ctx.strokeStyle = dark ? 'rgba(200, 190, 255, 0.15)' : 'rgba(23, 20, 43, 0.1)';
    const cols = Math.ceil(W / GAP) + 2, rows = Math.ceil(H / GAP) + 2;
    const step = 14;
    ctx.beginPath();
    for (let j = -1; j < rows; j++) {
      const y = j * GAP;
      for (let x = -GAP; x <= W + GAP; x += step) {
        const [a, b] = warp(x, y, t, now);
        x === -GAP ? ctx.moveTo(a, b) : ctx.lineTo(a, b);
      }
    }
    for (let i = -1; i < cols; i++) {
      const x = i * GAP;
      for (let y = -GAP; y <= H + GAP; y += step) {
        const [a, b] = warp(x, y, t, now);
        y === -GAP ? ctx.moveTo(a, b) : ctx.lineTo(a, b);
      }
    }
    ctx.stroke();

    // imleç çevresindeki parıltı (kütlenin "ışığı")
    if (pointer.active) {
      const g = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 170);
      const hue = (t * 40) % 360;
      g.addColorStop(0, dark ? `hsla(${hue}, 90%, 65%, 0.16)` : `hsla(${hue}, 85%, 55%, 0.10)`);
      g.addColorStop(1, 'hsla(0, 0%, 0%, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(pointer.x - 170, pointer.y - 170, 340, 340);
    }

    pointer.speed *= 0.9;
  };

  if (reduce) { draw(0); addEventListener('resize', () => draw(0)); return; }
  const loop = (now) => { if (!document.hidden) draw(now); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
}

// ---------------------------------------------------------------- 2: foton izi (arayüzün üstünde)
export function startTrail(canvas) {
  if (!finePointer || reduce) { canvas.remove(); return; }
  const ctx = canvas.getContext('2d');
  let W, H;
  const resize = () => {
    const dpr = Math.min(2, devicePixelRatio || 1);
    W = innerWidth; H = innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  addEventListener('resize', resize);
  const trail = [];
  let dirty = false;
  // tıklamada küçük bir girişim halkası
  const rings = [];
  addEventListener('pointerdown', (e) => rings.push({ x: e.clientX, y: e.clientY, t0: performance.now() }), { passive: true });
  const loop = (now) => {
    requestAnimationFrame(loop);
    if (document.hidden) return;
    const t = now / 1000;
    const dark = isDark();
    if (!trail.length && !rings.length && pointer.speed < 0.5) {
      if (dirty) { ctx.clearRect(0, 0, W, H); dirty = false; }
      return;
    }
    ctx.clearRect(0, 0, W, H);
    dirty = true;
    // yalnızca imleç hareket ederken iz bırak; durunca iz kuyruktan söner
    if (pointer.active && pointer.speed > 0.5) {
      trail.push({ x: pointer.tx, y: pointer.ty, hue: (t * 320) % 360 });
    } else if (trail.length) trail.shift();
    if (trail.length > 28) trail.splice(0, trail.length - 28);
    if (trail.length > 1) {
      ctx.save();
      ctx.globalCompositeOperation = dark ? 'lighter' : 'source-over';
      ctx.lineCap = 'round';
      for (let k = 1; k < trail.length; k++) {
        const a = trail[k - 1], b = trail[k];
        const f = k / trail.length;
        ctx.strokeStyle = `hsla(${b.hue}, 95%, ${dark ? 62 : 52}%, ${f * 0.75})`;
        ctx.lineWidth = f * 5;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      ctx.restore();
    }
    pointer.speed *= 0.9;
    for (let i = rings.length - 1; i >= 0; i--) {
      const age = (now - rings[i].t0) / 600;
      if (age > 1) { rings.splice(i, 1); continue; }
      for (let k = 0; k < 3; k++) {
        const a = age - k * 0.14;
        if (a <= 0) continue;
        ctx.strokeStyle = `hsla(${(k * 120 + t * 90) % 360}, 90%, ${dark ? 65 : 50}%, ${(1 - age) * 0.7})`;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(rings[i].x, rings[i].y, 6 + a * 42, 0, Math.PI * 2); ctx.stroke();
      }
    }
  };
  requestAnimationFrame(loop);
}

// ---------------------------------------------------------------- 3
export function startAtom(canvas) {
  const ctx = canvas.getContext('2d');
  const S = 64;
  const dpr = Math.min(2, devicePixelRatio || 1);
  canvas.width = S * dpr; canvas.height = S * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  let hover = 0, hoverT = 0;
  canvas.addEventListener('pointerenter', () => { hoverT = 1; });
  canvas.addEventListener('pointerleave', () => { hoverT = 0; });
  const orbits = [
    { tilt: 0.6, rx: 27, ry: 9.5, sp: 1.6, ph: 0 },
    { tilt: -0.6, rx: 27, ry: 9.5, sp: -1.25, ph: 2 },
    { tilt: Math.PI / 2, rx: 27, ry: 9.5, sp: 1.05, ph: 4 },
  ];
  const draw = (now) => {
    const t = now / 1000;
    hover += (hoverT - hover) * 0.08;
    const dark = isDark();
    // imlece doğru hafif eğilme
    const rect = canvas.getBoundingClientRect();
    const lx = Math.max(-1, Math.min(1, (pointer.x - (rect.left + rect.width / 2)) / 600));
    const ly = Math.max(-1, Math.min(1, (pointer.y - (rect.top + rect.height / 2)) / 600));
    // önceki kareyi silerek izleri bırak (saydam tuval: destination-out)
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = `rgba(0,0,0,${reduce ? 1 : 0.22})`;
    ctx.fillRect(0, 0, S, S);
    ctx.globalCompositeOperation = dark ? 'lighter' : 'source-over';
    const c = S / 2;
    for (const o of orbits) {
      const ang = o.tilt + lx * 0.35;
      const squash = 1 + ly * 0.25;
      // yörünge çizgisi
      ctx.save(); ctx.translate(c, c); ctx.rotate(ang);
      ctx.strokeStyle = dark ? 'rgba(255,170,80,0.22)' : 'rgba(23,20,43,0.22)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(0, 0, o.rx, o.ry * squash, 0, 0, Math.PI * 2); ctx.stroke();
      // elektron
      const a = o.ph + t * o.sp * (1 + hover * 2.2);
      const ex = Math.cos(a) * o.rx, ey = Math.sin(a) * o.ry * squash;
      const g = ctx.createRadialGradient(ex, ey, 0, ex, ey, 6);
      g.addColorStop(0, dark ? 'rgba(255,245,220,1)' : css('--vermilion'));
      g.addColorStop(0.4, dark ? 'rgba(255,170,60,0.9)' : css('--vermilion'));
      g.addColorStop(1, 'rgba(255,120,30,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(ex, ey, 6, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    // çekirdek: titreşen parıltı
    const pulse = 1 + Math.sin(t * 3) * 0.12 + hover * 0.25;
    const g = ctx.createRadialGradient(c, c, 0, c, c, 11 * pulse);
    g.addColorStop(0, dark ? 'rgba(255,250,235,1)' : css('--ink'));
    g.addColorStop(0.35, dark ? 'rgba(255,180,70,0.95)' : css('--vermilion'));
    g.addColorStop(1, 'rgba(255,110,20,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(c, c, 11 * pulse, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  };
  if (reduce) { draw(0); return; }
  const loop = (now) => { if (!document.hidden) draw(now); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
}

// ---------------------------------------------------------------- 4
const EQUATIONS = [
  'iħ ∂ψ/∂t = Ĥψ',
  '|ψ⟩ = α|0⟩ + β|1⟩',
  '|α|² + |β|² = 1',
  'H = (X + Z)/√2',
  '|Φ⁺⟩ = (|00⟩ + |11⟩)/√2',
  'Δx · Δp ≥ ħ/2',
  'E = hν',
  'ρ = |ψ⟩⟨ψ|',
  'P(x) = |⟨x|ψ⟩|²',
  'U U† = I',
  'λ = h / p',
  'e^{iπ} + 1 = 0',
  'F = |⟨ψ|φ⟩|²',
  'S = −Tr(ρ log ρ)',
  'QFT|x⟩ = Σ e^{2πixy/N}|y⟩',
  'CNOT|10⟩ = |11⟩',
  'Eₙ = n²h² / 8mL²',
  '⟨Ŝz⟩ = ħ/2',
];

export function startEquations(layer) {
  layer.replaceChildren();
  // tohumlu rastgelelik: her açılışta aynı düzen
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  EQUATIONS.forEach((eq, i) => {
    const s = document.createElement('span');
    s.textContent = eq;
    const depth = 0.3 + rnd() * 0.9;
    s.style.cssText = `left:${(i % 6) * 17 + rnd() * 9}%;top:${Math.floor(i / 6) * 33 + rnd() * 22 + 4}%;`
      + `font-size:${14 + depth * 16}px;--d:${depth.toFixed(2)};--r:${(rnd() * 14 - 7).toFixed(1)}deg;`
      + `animation-duration:${18 + rnd() * 20}s;animation-delay:${-rnd() * 20}s;`;
    layer.appendChild(s);
  });
  if (reduce) return;
  const loop = () => {
    const nx = (pointer.x / innerWidth - 0.5) * 2, ny = (pointer.y / innerHeight - 0.5) * 2;
    layer.style.setProperty('--px', nx.toFixed(3));
    layer.style.setProperty('--py', ny.toFixed(3));
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

// ---------------------------------------------------------------- 5
export function startSpotlight() {
  if (!finePointer) return;
  document.addEventListener('pointermove', (e) => {
    const card = e.target.closest?.('.card, .gate, .win-box');
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
    if (card.classList.contains('gate') && !reduce) {
      const rx = ((e.clientY - r.top) / r.height - 0.5) * -14;
      const ry = ((e.clientX - r.left) / r.width - 0.5) * 14;
      card.style.setProperty('--tilt', `rotateX(${rx.toFixed(1)}deg) rotateY(${ry.toFixed(1)}deg)`);
    }
  }, { passive: true });
  document.addEventListener('pointerout', (e) => {
    const g = e.target.closest?.('.gate');
    if (g && !g.contains(e.relatedTarget)) g.style.removeProperty('--tilt');
  }, { passive: true });
}
