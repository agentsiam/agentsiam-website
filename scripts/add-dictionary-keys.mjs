// Adds keys to all three dictionaries in one pass, which is the only way a copy change is
// allowed to happen here: en.ts exports the type, so a key added to one file and not the
// other two is a compile error, and a key typed by hand three times is a key that ends up
// spelled three ways. Usage: node addkeys.mjs keys-<name>.json
//
// The file is { section: string, keys: [ { key, en, th, zh, comment? } ] }. Each file is
// checked for each key independently and only what is missing is written, so a re-run
// after a partial failure finishes the job instead of duplicating what landed.
import fs from 'fs';

// A crude mutex. Several workstreams add keys at once, and three read-modify-write cycles
// over the same three files is exactly the shape that loses one of them. mkdir is atomic
// on every filesystem this runs on, which is all the lock has to be.
const LOCK = '.addkeys.lock';
for (let i = 0; i < 600; i++) {
  try { fs.mkdirSync(LOCK); break; } catch { await new Promise((r) => setTimeout(r, 100)); }
  if (i === 599) throw new Error('addkeys: lock held for a minute, giving up');
}
process.on('exit', () => { try { fs.rmdirSync(LOCK); } catch {} });

const spec = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const FILES = { en: 'src/i18n/dictionaries/en.ts', th: 'src/i18n/dictionaries/th.ts', zh: 'src/i18n/dictionaries/zh.ts' };

const esc = (v) => '"' + v.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';

let report = [];
for (const [lang, file] of Object.entries(FILES)) {
  let s = fs.readFileSync(file, 'utf8');
  const fresh = spec.keys.filter((k) => !new RegExp(`^\\s{2}${k.key}:`, 'm').test(s));
  if (fresh.length === 0) { report.push(`${lang}: up to date`); continue; }

  // en.ts closes `} as const;`, the other two close `};`.
  const at = s.lastIndexOf('} as const;') !== -1 ? s.lastIndexOf('} as const;') : s.lastIndexOf('};');
  if (at === -1) throw new Error('no closing brace found in ' + file);

  let block = `\n  // -- ${spec.section} ${'-'.repeat(Math.max(4, 68 - spec.section.length))}\n`;
  for (const k of fresh) {
    if (k.comment && lang === 'en') block += `  // ${k.comment}\n`;
    if (k[lang] === undefined) throw new Error(`key ${k.key} has no ${lang} value`);
    block += `  ${k.key}: ${esc(k[lang])},\n`;
  }
  fs.writeFileSync(file, s.slice(0, at) + block + s.slice(at));
  report.push(`${lang}: +${fresh.length}`);
}
console.log(report.join('  |  '));
