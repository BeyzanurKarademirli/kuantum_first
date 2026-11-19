// Uçtan uca (E2E) testler: gerçek bir tarayıcıda (Playwright + Chromium) kullanıcı akışları.
// Çalıştırma:  npm run test:e2e
// Bağımlılık eklememek için siteyi Node'un yerleşik http modülüyle kendimiz sunuyoruz.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.json': 'application/json' };

let server, base, browser;

before(async () => {
  server = http.createServer(async (req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
    const file = join(ROOT, path.endsWith('/') ? `${path}index.html` : path);
    try {
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
      res.end(body);
    } catch { res.writeHead(404); res.end(); }
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}/`;
  browser = await chromium.launch();
});
after(async () => { await browser?.close(); server?.close(); });

// Sayfa aç; konsol hatalarını topla. welcomed: karşılama ekranı daha önce görülmüş mü
async function open({ welcomed = true, locale = 'tr-TR', scheme = 'light', width = 1280, height = 860, mobile = false, hash = '' } = {}) {
  const ctx = await browser.newContext({
    viewport: { width, height }, locale, colorScheme: scheme, isMobile: mobile, hasTouch: mobile,
    reducedMotion: 'reduce', // animasyonları kısaltır, testleri hızlandırır
  });
  if (welcomed) await ctx.addInitScript(() => localStorage.setItem('dolanik.welcomed', 'true'));
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(base + hash);
  await page.waitForSelector('#circuit rect.cell');
  return { page, ctx, errors };
}

const cell = (page, n, c, r) => page.locator('#circuit rect.cell').nth(c * n + r);
async function put(page, n, gate, col, ...rows) {
  await page.click(`.gate:text-is("${gate}")`);
  for (const r of rows) await cell(page, n, col, r).click();
}
async function goLevel(page, id) {
  const ids = await page.evaluate(async () => (await import('./js/levels.js')).LEVELS.map((l) => l.id));
  await page.locator('.levels button').nth(ids.indexOf(id)).click();
}

test('ilk ziyaret: karşılama → rehber tur 11 adım → yıldız verilmez', async () => {
  const { page, ctx, errors } = await open({ welcomed: false });
  await page.waitForFunction(() => document.getElementById('welcome').open);
  await page.click('#welcomeTour');
  for (let k = 1; k <= 11; k++) {
    await page.waitForFunction((k) => document.querySelector('.tour-step')?.textContent.includes(`${k} /`), k);
    if (k === 6) {
      // hayalet imleç X'i yerleştirdi: hedef tutmalı ama kazanma penceresi açılmamalı
      await page.waitForFunction(() => document.getElementById('fid').textContent.includes('100'));
      assert.equal(await page.isVisible('#win'), false);
    }
    await page.click('.tour-next');
  }
  await page.waitForSelector('#tour', { state: 'hidden' });
  assert.equal(await page.evaluate(() => localStorage.getItem('dolanik.progress')), null, 'tur yıldız vermemeli');
  assert.equal(await page.evaluate(() => localStorage.getItem('dolanik.welcomed')), 'true');
  await page.reload();
  await page.waitForSelector('#circuit rect.cell');
  assert.equal(await page.evaluate(() => document.getElementById('welcome').open), false, 'ikinci ziyarette karşılama yok');
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('tur noktalarıyla atlanır, atlanan adımların işi tamamlanır, Esc kapatır', async () => {
  const { page, ctx } = await open();
  await page.click('#tourBtn');
  await page.click('.tour-dots button[data-k="6"]');
  await page.waitForFunction(() => document.querySelector('.tour-step').textContent.includes('7 /'));
  // atlanan adımların işleri yapılmış olmalı: X yerleşti, anlatım devreyle uyumlu
  await page.waitForFunction(() => document.getElementById('stateText').textContent.includes('|1⟩'));
  assert.equal(await page.locator('#circuit .gbox').count(), 1);
  await page.click('.tour-dots button[data-k="1"]');
  await page.waitForFunction(() => document.querySelector('.tour-step').textContent.includes('2 /'));
  await page.keyboard.press('Escape');
  await page.waitForSelector('#tour', { state: 'hidden' });
  await ctx.close();
});

test('bölüm çözme: yıldızlar, kural kartı, sonraki bölüm', async () => {
  const { page, ctx, errors } = await open();
  await put(page, 1, 'X', 0, 0);
  await page.waitForSelector('#win:not([hidden])');
  assert.equal(await page.locator('#winStars .f').count(), 3);
  assert.match(await page.textContent('#winLesson'), /NOT/);
  await page.click('#next');
  await page.waitForFunction(() => document.querySelector('#story h2').textContent.includes('Süperpozisyon'));
  // fazla kapıyla çözüm: daha az yıldız (H H H = H)
  await put(page, 1, 'H', 0, 0); await put(page, 1, 'H', 1, 0); await put(page, 1, 'H', 2, 0);
  await page.waitForSelector('#win:not([hidden])');
  assert.equal(await page.locator('#winStars .f').count(), 2);
  await page.click('#stay');
  const progress = JSON.parse(await page.evaluate(() => localStorage.getItem('dolanik.progress')));
  assert.deepEqual(progress, { 'bit-cevir': 3, superpozisyon: 2 });
  assert.equal(await page.locator('.levels button .st i.f').count(), 5);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('Bell çifti: CNOT iki tıkla, dolanıklık notu, geri al', async () => {
  const { page, ctx } = await open();
  await goLevel(page, 'bell');
  await put(page, 2, 'H', 0, 0);
  await put(page, 2, 'CNOT', 1, 0, 1);
  await page.waitForSelector('#win:not([hidden])');
  await page.click('#stay');
  assert.match(await page.textContent('#entNote'), /Maksimum dolanıklık/);
  await page.keyboard.press('Control+z');
  await page.waitForFunction(() => document.getElementById('stateText').textContent.includes('|10⟩'));
  await ctx.close();
});

test('gizli kutu: Grover dört kutunun hepsinde çözülür', async () => {
  const { page, ctx } = await open();
  await goLevel(page, 'grover');
  await cell(page, 2, 1, 0).click();
  assert.match(await page.textContent('#toast'), /kilitli/);
  await put(page, 2, 'H', 0, 0); await put(page, 2, 'H', 0, 1);
  await put(page, 2, 'H', 2, 0); await put(page, 2, 'H', 2, 1);
  await put(page, 2, 'X', 3, 0); await put(page, 2, 'X', 3, 1);
  await put(page, 2, 'CZ', 4, 0, 1);
  await put(page, 2, 'X', 5, 0); await put(page, 2, 'X', 5, 1);
  await put(page, 2, 'H', 6, 0);
  assert.match(await page.textContent('#fid'), /0\/4/);
  await put(page, 2, 'H', 6, 1);
  await page.waitForSelector('#win:not([hidden])');
  assert.equal(await page.locator('#winStars .f').count(), 3);
  await ctx.close();
});

test('ışınlanma: q0–q2 arası CNOT yasak', async () => {
  const { page, ctx } = await open();
  await goLevel(page, 'isinlanma');
  await put(page, 3, 'CNOT', 1, 0, 2);
  assert.match(await page.textContent('#toast'), /konamaz/);
  assert.equal(await page.evaluate(() => document.querySelectorAll('#circuit .link').length), 0);
  await ctx.close();
});

test('laboratuvar: QASM içe aktar, paylaşım bağlantısı, yeniden yükleme', async () => {
  const { page, ctx } = await open();
  await page.click('[data-mode=sandbox]');
  await page.click('#qasm');
  await page.fill('#qasmCode', 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[3];\nh q[0];\ncx q[0],q[1];\nccx q[0],q[1],q[2];\nry(pi/3) q[2];\n');
  await page.click('#qasmImport');
  await page.waitForFunction(() => location.hash.startsWith('#lab=3~'));
  const state = await page.textContent('#stateText');
  await page.reload();
  await page.waitForSelector('#circuit rect.cell');
  assert.equal(await page.textContent('#stateText'), state, 'bağlantıdan aynı durum gelmeli');
  // dışa aktarma: OpenQASM 3 metni
  await page.click('#qasm');
  const text = await page.inputValue('#qasmCode');
  assert.match(text, /OPENQASM 3\.0;/);
  assert.match(text, /ccx q\[0\], q\[1\], q\[2\];/);
  assert.match(text, /ry\(pi\/3\) q\[2\];/);
  // hatalı kod: anlaşılır hata
  await page.fill('#qasmCode', 'qubit[2] q; u3(1,2,3) q[0];');
  await page.click('#qasmImport');
  assert.match(await page.textContent('#qasmErr'), /Desteklenmeyen/);
  await ctx.close();
});

test('meydan okuma bağlantısı: arkadaş açar ve çözer', async () => {
  const { page, ctx } = await open();
  await page.click('[data-mode=sandbox]');
  await page.click('.qcount button:text-is("2")');
  await put(page, 2, 'H', 0, 0); await put(page, 2, 'CNOT', 1, 0, 1);
  const link = await page.evaluate(() => {
    const code = location.hash.match(/#lab=(\d)~(.*)$/);
    return `${location.origin}${location.pathname}#meydan=${btoa(`${code[1]}~${code[2]}`).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}`;
  });
  const friend = await ctx.newPage();
  await friend.goto(link);
  await friend.waitForSelector('#circuit rect.cell');
  assert.match(await friend.textContent('#story h2'), /Meydan Okuma/);
  await put(friend, 2, 'H', 0, 0); await put(friend, 2, 'CNOT', 1, 0, 1);
  await friend.waitForSelector('#win:not([hidden])');
  assert.equal(await friend.isHidden('#next'), true);
  await ctx.close();
});

test('gürültü modu: saflık düşer, ölçüm dağılımı bozulur', async () => {
  const { page, ctx } = await open();
  await page.click('[data-mode=sandbox]');
  await page.click('.qcount button:text-is("1")');
  await put(page, 1, 'X', 0, 0);
  await page.selectOption('.noise select', 'sonum');
  await page.locator('.noise-p input').fill('0.3');
  await page.waitForFunction(() => /saflık/.test(document.getElementById('noiseInfo').textContent));
  assert.match(await page.textContent('#noiseInfo'), /benzerlik 70\.0%/);
  await page.click('#m256');
  const zeros = await page.evaluate(() => +document.querySelectorAll('#hist .cnt')[0].textContent || 0);
  assert.ok(zeros > 30, `T1 sönümüyle bazı ölçümler |0⟩ çıkmalı (${zeros})`);
  await ctx.close();
});

test('dil ve tema: İngilizceye geç, koyu tema, tercih hatırlanır', async () => {
  const { page, ctx } = await open();
  await page.click('#langBtn');
  assert.equal(await page.evaluate(() => document.documentElement.lang), 'en');
  assert.match(await page.textContent('#story h2'), /Flip the Bit/);
  await page.click('#themeBtn');
  const theme = await page.evaluate(() => document.documentElement.dataset.theme);
  await page.reload();
  await page.waitForSelector('#circuit rect.cell');
  assert.match(await page.textContent('#story h2'), /Flip the Bit/);
  assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), theme);
  await ctx.close();
});

test('İngilizce tarayıcı İngilizce açılır', async () => {
  const { page, ctx } = await open({ locale: 'en-US' });
  assert.equal(await page.textContent('.modes button.on'), 'Levels');
  await ctx.close();
});

test('klavye: hücreye Enter ile kapı konur, harfle kapı seçilir', async () => {
  const { page, ctx } = await open();
  await goLevel(page, 'superpozisyon');
  await page.keyboard.press('h');
  await cell(page, 1, 0, 0).focus();
  await page.keyboard.press('Enter');
  await page.waitForSelector('#win:not([hidden])');
  await ctx.close();
});

test('"?" açıklamaları: üzerine gelince ve odaklanınca açılır', async () => {
  const { page, ctx } = await open();
  await page.hover('#stateCard .info');
  await page.waitForSelector('#tip.show');
  assert.match(await page.textContent('#tip'), /Durum/);
  await page.mouse.move(5, 5);
  await page.locator('#targetCard .info').focus();
  await page.waitForFunction(() => /Hedef/.test(document.getElementById('tip').textContent));
  await ctx.close();
});

test('mobil (390px): yatay taşma yok, "?" dokununca açılır, koyu tema hatasız', async () => {
  for (const scheme of ['light', 'dark']) {
    const { page, ctx, errors } = await open({ width: 390, height: 844, mobile: true, scheme });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390);
    await page.tap('#stateCard .info');
    await page.waitForSelector('#tip.show');
    await page.click('[data-mode=sandbox]');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390);
    assert.deepEqual(errors, []);
    await ctx.close();
  }
});

test('bütün bölümler açılır ve konsol hatası vermez', async () => {
  const { page, ctx, errors } = await open();
  const n = await page.locator('.levels button').count();
  assert.equal(n, 26);
  for (let i = 0; i < n; i++) {
    await page.locator('.levels button').nth(i).click();
    await page.waitForFunction((i) => document.querySelector('#story .chapter').textContent.includes(`${i + 1}/26`), i);
  }
  await page.click('[data-mode=help]');
  assert.match(await page.textContent('#story h2'), /nasıl okursun/);
  assert.deepEqual(errors, []);
  await ctx.close();
});
