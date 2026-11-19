import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STRINGS } from '../js/strings.js';
import { LEVELS } from '../js/levels.js';
import { LEVELS_EN } from '../js/levels-en.js';
import { GATES } from '../js/quantum.js';
import { CHANNELS } from '../js/noise.js';
import { ORACLES } from '../js/game.js';
import { t, setLang, tx, detectLang } from '../js/i18n.js';
import { fromQasm } from '../js/qasm.js';

test('her Türkçe arayüz anahtarının İngilizcesi var', () => {
  const missing = Object.keys(STRINGS.tr).filter((k) => !(k in STRINGS.en));
  assert.deepEqual(missing, []);
});

test('her bölümün İngilizce başlık, hikâye ve ipucu var', () => {
  for (const lv of LEVELS) {
    const en = LEVELS_EN[lv.id];
    assert.ok(en, lv.id);
    for (const f of ['title', 'story', 'hint', 'lesson']) assert.ok(en[f]?.length > 3, `${lv.id}.${f}`);
    assert.ok(lv.lesson?.length > 10, `${lv.id} Türkçe kural`);
    assert.ok(STRINGS.en[`chapter.${lv.chapter}`], `kısım ${lv.chapter}`);
  }
  assert.deepEqual(Object.keys(LEVELS_EN).sort(), LEVELS.map((l) => l.id).sort());
});

test('kapılar ve gürültü kanalları çevrilmiş', () => {
  for (const g of Object.keys(GATES)) {
    assert.ok(STRINGS.en[`gate.${g}.name`], g);
    assert.ok(STRINGS.en[`gate.${g}.desc`], g);
  }
  for (const k of Object.keys(CHANNELS)) assert.ok(STRINGS.en[`channel.${k}.desc`], k);
});

test('kutu senaryoları iki dilde de okunur', () => {
  setLang('en');
  for (const orc of Object.values(ORACLES)) {
    for (const v of orc.variants) {
      assert.doesNotMatch(tx(v.name) + tx(v.goal), /hata|ölç|sabit|dengeli|mesaj/, 'İngilizcede Türkçe kalmamalı');
    }
  }
  setLang('tr');
});

test('QASM hataları çevrilebilir anahtar taşır', () => {
  setLang('en');
  try { fromQasm('qubit[9] q;'); assert.fail(); } catch (e) {
    assert.equal(t(`qasm.e.${e.key}`, e.params), 'At most 4 qubits are supported (9 requested).');
  }
  setLang('tr');
});

test('t(): yer tutucular ve dil algılama', () => {
  setLang('en');
  assert.equal(t('v.solved', { a: 2, b: 4 }), '2/4 cases solved');
  setLang('tr');
  assert.equal(t('v.solved', { a: 2, b: 4 }), '2/4 durum çözüldü');
  assert.equal(detectLang(['tr-TR', 'en']), 'tr');
  assert.equal(detectLang(['en-US']), 'en');
  assert.equal(detectLang(['de']), 'en');
});
