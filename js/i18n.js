// Çeviri katmanı (DOM'a dokunmaz). t('anahtar', { değişken }) → seçili dildeki metin.
import { STRINGS } from './strings.js';

export const LANGS = ['tr', 'en'];
let lang = 'tr';

export function setLang(l) { lang = LANGS.includes(l) ? l : 'tr'; return lang; }
export function getLang() { return lang; }

// Tarayıcı dili Türkçe ise Türkçe, değilse İngilizce
export function detectLang(navLangs = []) {
  return navLangs.some((l) => /^tr\b/i.test(l)) || navLangs.length === 0 ? 'tr' : 'en';
}

export function t(key, vars = {}) {
  const s = STRINGS[lang]?.[key] ?? STRINGS.tr[key];
  if (s == null) return key;
  const out = typeof s === 'function' ? s(vars) : s;
  return out.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? vars[k] : `{${k}}`));
}

// { tr, en } nesnesi ya da düz metin → seçili dil
export function tx(v) {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  return v[lang] ?? v.tr;
}
