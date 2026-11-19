// Süperpozisyonu duy: her taban durumu pentatonik bir nota,
// ses şiddeti = olasılık, stereo konum = faz (cos φ), faz tını rengine de karışır.
let ctx = null;

const SCALE = [220, 261.63, 293.66, 329.63, 392, 440, 523.25, 587.33,
  659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98, 1760];

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function playState(s, dur = 1.8) {
  const a = ac();
  if (!a) return;
  const now = a.currentTime;
  const master = a.createGain();
  master.gain.value = 0.5;
  master.connect(a.destination);
  for (let i = 0; i < s.re.length; i++) {
    const p = s.re[i] ** 2 + s.im[i] ** 2;
    if (p < 1e-3) continue;
    const phase = Math.atan2(s.im[i], s.re[i]);
    const osc = a.createOscillator();
    osc.type = Math.abs(phase) > Math.PI / 2 ? 'triangle' : 'sine';
    osc.frequency.value = SCALE[i % SCALE.length] * (i >= SCALE.length ? 2 : 1);
    const g = a.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.35 * Math.sqrt(p), now + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    let node = osc.connect(g);
    if (a.createStereoPanner) {
      const pan = a.createStereoPanner();
      pan.pan.value = Math.cos(phase) * 0.8;
      node = node.connect(pan);
    }
    node.connect(master);
    osc.start(now);
    osc.stop(now + dur + 0.05);
  }
}

export function click(freq = 660) {
  const a = ac();
  if (!a) return;
  const o = a.createOscillator(), g = a.createGain();
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.08, a.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.08);
  o.connect(g).connect(a.destination);
  o.start(); o.stop(a.currentTime + 0.1);
}
