// Rehber tur: "hayalet imleç" sayfada gezer, anlattığı kısmı ışıkla vurgular,
// gerçekten tıklayıp ilk bölümü çözerek nasıl oynandığını gösterir.
// Metinler strings.js'teki tour.* anahtarlarından gelir.

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = (ms) => new Promise((r) => setTimeout(r, reduce ? Math.min(ms, 60) : ms));

// target: vurgulanacak öğe; act: adım açılınca hayalet imlecin yapacağı iş
export const STEPS = [
  { key: 'levels', target: '#side .card' },
  { key: 'story', target: '#story' },
  { key: 'gates', target: '#palette', act: async (g) => { await g.click('.gate[data-fam="pauli"]'); } },
  { key: 'circuit', target: '.circuit-wrap', act: async (g) => { await g.click('#circuit rect.cell'); } },
  { key: 'state', target: '#stateCard' },
  { key: 'target', target: '#targetCard' },
  { key: 'bloch', target: '.view .card:last-child' },
  { key: 'measure', target: '.measure', act: async (g) => { await g.click('#m256'); } },
  { key: 'tools', target: '.controls' },
  { key: 'modes', target: '.modes', act: async (g) => { await g.hover('.modes button[data-mode="sandbox"]'); } },
  { key: 'end', target: '#tourBtn' },
];

export function createTour({ t, onStart, onEnd }) {
  const root = document.getElementById('tour');
  const hole = root.querySelector('.tour-hole');
  const bubble = root.querySelector('.tour-bubble');
  const ghost = document.getElementById('ghost');
  let i = 0, running = false, token = 0;
  // hangi adımların işi (tıklamaları) yapıldı: her iş yalnızca bir kez
  const done = new Set();

  const ghostAPI = {
    async moveTo(sel) {
      const el = typeof sel === 'string' ? document.querySelector(sel) : sel;
      if (!el) return null;
      const r = el.getBoundingClientRect();
      ghost.classList.add('on');
      ghost.style.transform = `translate(${r.left + r.width / 2 - 4}px, ${r.top + r.height / 2 - 2}px)`;
      await wait(750);
      return el;
    },
    async click(sel) {
      const el = await ghostAPI.moveTo(sel);
      if (!el) return;
      ghost.classList.remove('press'); void ghost.offsetWidth; ghost.classList.add('press');
      await wait(180);
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
      await wait(420);
    },
    async hover(sel) { await ghostAPI.moveTo(sel); },
  };
  // atlanan adımların işlerini imleç animasyonu olmadan, hemen yapan sürüm
  const instantAPI = {
    async click(sel) {
      const el = typeof sel === 'string' ? document.querySelector(sel) : sel;
      el?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
      await new Promise((r) => setTimeout(r, 30));
    },
    async hover() {},
    async moveTo() {},
  };

  const place = (el) => {
    const pad = 8;
    const r = el ? el.getBoundingClientRect() : null;
    if (r) {
      hole.style.cssText = `left:${r.left - pad}px;top:${r.top - pad}px;width:${r.width + pad * 2}px;height:${r.height + pad * 2}px;opacity:1`;
    } else {
      hole.style.cssText = `left:${innerWidth / 2}px;top:${innerHeight / 2}px;width:0;height:0;opacity:1`;
    }
    // balon: mobilde altta sabit; masaüstünde hedefin yanında/altında/üstünde
    const bw = bubble.offsetWidth, bh = bubble.offsetHeight;
    if (innerWidth < 760 || !r) {
      bubble.style.left = `${Math.max(12, (innerWidth - bw) / 2)}px`;
      bubble.style.top = r && r.top + r.height / 2 > innerHeight * 0.55 ? '16px' : `${innerHeight - bh - 16}px`;
      if (!r) bubble.style.top = `${(innerHeight - bh) / 2}px`;
      return;
    }
    const spots = [
      [r.right + 18, r.top], // sağ
      [r.left - bw - 18, r.top], // sol
      [r.left, r.bottom + 18], // alt
      [r.left, r.top - bh - 18], // üst
    ];
    const fits = ([x, y]) => x >= 12 && y >= 12 && x + bw <= innerWidth - 12 && y + bh <= innerHeight - 12;
    let [x, y] = spots.find(fits) ?? [(innerWidth - bw) / 2, innerHeight - bh - 16];
    x = Math.max(12, Math.min(innerWidth - bw - 12, x));
    y = Math.max(12, Math.min(innerHeight - bh - 12, y));
    bubble.style.left = `${x}px`; bubble.style.top = `${y}px`;
  };

  const render = () => {
    const s = STEPS[i];
    bubble.querySelector('.tour-step').textContent = t('tour.step', { a: i + 1, b: STEPS.length });
    bubble.querySelector('h3').textContent = t(`tour.${s.key}.title`);
    bubble.querySelector('p').innerHTML = t(`tour.${s.key}.body`);
    bubble.querySelector('.tour-prev').disabled = i === 0;
    bubble.querySelector('.tour-next').textContent = i === STEPS.length - 1 ? t('tour.finish') : t('tour.next');
    bubble.querySelector('.tour-prev').textContent = t('tour.prev');
    bubble.querySelector('.tour-close').setAttribute('aria-label', t('tour.close'));
    const dots = bubble.querySelector('.tour-dots');
    dots.innerHTML = STEPS.map((s2, k) => `<button type="button" class="${k === i ? 'on' : k < i ? 'done' : ''}" data-k="${k}"
      aria-label="${t('tour.step', { a: k + 1, b: STEPS.length })}: ${t(`tour.${s2.key}.title`)}" title="${t(`tour.${s2.key}.title`)}"${k === i ? ' aria-current="step"' : ''}><i></i></button>`).join('');
  };

  const go = async (k) => {
    const my = ++token;
    i = Math.max(0, Math.min(STEPS.length - 1, k));
    const s = STEPS[i];
    render();
    // atlanan önceki adımların işlerini sırayla tamamla (anlatım devredeki duruma uysun)
    for (let j = 0; j < i; j++) {
      if (STEPS[j].act && !done.has(j)) { done.add(j); await STEPS[j].act(instantAPI); }
    }
    bubble.classList.remove('in'); void bubble.offsetWidth; bubble.classList.add('in');
    const el = document.querySelector(s.target);
    if (el) {
      el.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
      await wait(450);
    }
    if (my !== token) return;
    place(el);
    if (s.act && !done.has(i)) {
      done.add(i);
      bubble.classList.add('busy');
      await s.act(ghostAPI);
      bubble.classList.remove('busy');
      if (my !== token) return;
      place(document.querySelector(s.target));
    } else if (el) {
      await ghostAPI.moveTo(el);
    }
  };

  const keys = (e) => {
    if (!running) return;
    if (e.key === 'Escape') { e.stopPropagation(); stop(); }
    else if (e.key === 'ArrowRight') { e.stopPropagation(); next(); }
    else if (e.key === 'ArrowLeft') { e.stopPropagation(); go(i - 1); }
  };
  const next = () => (i === STEPS.length - 1 ? stop() : go(i + 1));
  const onResize = () => running && place(document.querySelector(STEPS[i].target));

  bubble.querySelector('.tour-next').addEventListener('click', next);
  bubble.querySelector('.tour-prev').addEventListener('click', () => go(i - 1));
  bubble.querySelector('.tour-close').addEventListener('click', () => stop());
  // noktaya tıklayınca o adıma atla
  bubble.querySelector('.tour-dots').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-k]');
    if (b) go(+b.dataset.k);
  });
  addEventListener('keydown', keys, true);
  addEventListener('resize', onResize);
  addEventListener('scroll', onResize, { passive: true });

  function start() {
    running = true;
    done.clear();
    document.body.classList.add('touring');
    onStart?.();
    root.hidden = false;
    ghost.style.transform = `translate(${innerWidth / 2}px, ${innerHeight + 40}px)`;
    go(0);
    bubble.querySelector('.tour-next').focus();
  }
  function stop() {
    token++;
    running = false;
    root.hidden = true;
    ghost.classList.remove('on');
    document.body.classList.remove('touring');
    onEnd?.();
  }
  return { start, stop, isRunning: () => running };
}
