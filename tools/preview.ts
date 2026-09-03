/*
 * Builds icons/preview.html (or icons/preview-<variant>.html): every generated
 * icon shown at 48px (to inspect the drawing) and at 16px (the size VS Code
 * actually renders it), on the theme's editor background. Used to eyeball a set
 * after a build.
 *
 *   node tools/preview.ts            the classic set
 *   node tools/preview.ts neon       the neon set
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const VARIANTS = {
  classic: { dir: 'svg', out: 'preview.html' },
  neon: { dir: 'svg-neon', out: 'preview-neon.html' },
};

type VariantName = keyof typeof VARIANTS;

const name = process.argv[2] || 'classic';
if (!(name in VARIANTS)) {
  throw new Error(`unknown variant "${name}" — expected one of: ${Object.keys(VARIANTS).join(', ')}`);
}
const variant = VARIANTS[name as VariantName];

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SVG = path.join(HERE, '..', 'icons', variant.dir);
const OUT = path.join(HERE, '..', 'icons', variant.out);

const names = fs.readdirSync(SVG).filter((f) => f.endsWith('.svg')).sort();

const cell = (f: string): string => {
  const data = fs.readFileSync(path.join(SVG, f), 'utf8');
  const src = `data:image/svg+xml;base64,${Buffer.from(data).toString('base64')}`;
  return `<figure><div class="row"><img class="lg" src="${src}"><img class="sm" src="${src}"><span class="nm">${f.replace('.svg', '')}</span></div></figure>`;
};

const html = `<!doctype html><meta charset="utf-8"><style>
  body{background:#020108;color:#9993B8;font:12px "Segoe UI",system-ui,sans-serif;margin:0;padding:16px}
  .grid{display:grid;grid-template-columns:repeat(6,1fr);gap:6px}
  figure{margin:0}
  .row{display:flex;align-items:center;gap:8px;background:#080514;border-radius:6px;padding:6px 8px}
  .lg{width:48px;height:48px}
  .sm{width:16px;height:16px}
  .nm{font-size:11px;color:#6A6390;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
</style><div class="grid">${names.map(cell).join('')}</div>`;

fs.writeFileSync(OUT, html, 'utf8');
console.log(`wrote icons/${variant.out} (${names.length} icons)`);
