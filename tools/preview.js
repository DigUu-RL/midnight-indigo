'use strict';

/*
 * Builds icons/preview.html: every generated icon shown at 48px (to inspect the
 * drawing) and at 16px (the size VS Code actually renders it), on the theme's
 * editor background. Used to eyeball the set after a build.
 */

const fs = require('fs');
const path = require('path');

const SVG = path.join(__dirname, '..', 'icons', 'svg');
const OUT = path.join(__dirname, '..', 'icons', 'preview.html');

const names = fs.readdirSync(SVG).filter((f) => f.endsWith('.svg')).sort();

const cell = (f) => {
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
console.log(`wrote icons/preview.html (${names.length} icons)`);
