/*
 * The colour layer of the icon set.
 *
 * Every colour the build paints with lives here, together with the derivations
 * that turn one variant's palette into another's. tools/icon-spec.ts stays the
 * single source of truth for *which* colour belongs to which language — this
 * module only decides how a given variant renders that colour.
 *
 * Adding a variant means adding a derivation here and a paint recipe in
 * build-icons.ts. Nothing about the geometry, the glyph library or the
 * measurements has to move.
 */

import type { Colour, Extra } from './glyphs.ts';

/* -------------------------------------------------------------- *
 * The base palette — the colours the classic variant paints with
 * -------------------------------------------------------------- */

export const LIGHT: Colour = '#FFFFFF'; // glyph colour on dark tiles
export const DARK: Colour = '#0A0716'; // glyph colour on light tiles
export const BG: Colour = '#020108'; // themes/midnight-indigo-color-theme.json -> editor.background
export const FOLDER_STROKE: Colour = '#8B7CF6';
export const FOLDER_FILL: Colour = '#1A1338';

/* -------------------------------------------------------------- *
 * Colour maths
 * -------------------------------------------------------------- */

const hexToRgb = (hex: Colour): number[] => {
  const m = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(m.slice(i, i + 2), 16) / 255);
};

const rgbToHex = (...rgb: number[]): Colour =>
  '#' +
  rgb
    .map((c) =>
      Math.round(Math.max(0, Math.min(1, c)) * 255)
        .toString(16)
        .padStart(2, '0')
        .toUpperCase()
    )
    .join('');

// WCAG relative luminance.
export function luminance(hex: Colour): number {
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrast(a: Colour, b: Colour): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// Perceived lightness, used to pick a dark or light glyph automatically so
// icon-spec.ts never has to think about contrast.
export const autoFg = (hex: Colour): Colour => (luminance(hex) > 0.35 ? DARK : LIGHT);

function hexToHsl(hex: Colour): [number, number, number] {
  const [r, g, b] = hexToRgb(hex);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h =
    max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}

function hslToHex(h: number, s: number, l: number): Colour {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = [
    [c, x, 0],
    [x, c, 0],
    [0, c, x],
    [0, x, c],
    [x, 0, c],
    [c, 0, x],
  ][Math.floor(h / 60) % 6];
  return rgbToHex(r + m, g + m, b + m);
}

/* -------------------------------------------------------------- *
 * The neon derivation
 * -------------------------------------------------------------- */

// Neon paints on a dark ground instead of a brand-coloured tile, so a brand
// colour is no longer a background to read *against* — it becomes the ink, and
// half the set's brand colours are dark enough to vanish on it (Kotlin's
// #241C3A lands at 1.09:1 against the tile, Lua's #00007B at 1.08:1).
export const NEON_TILE: Colour = FOLDER_FILL; // the dark ground, shared with the folder fill
export const NEON_MIN_CONTRAST = 3.5;
const NEON_MIN_SAT = 0.8;
const NEON_MAX_L = 0.92;

/*
 * Lifts a brand colour to neon: hue is kept, so TypeScript stays blue and
 * JavaScript stays yellow, while saturation and lightness are raised until the
 * ink clears NEON_MIN_CONTRAST against the tile. Lightness is walked up rather
 * than set outright because luminance is hue-dependent — a pure blue needs to
 * go much lighter than a yellow to reach the same contrast, and a fixed target
 * lightness would leave the blues unreadable.
 */
export function neonInk(hex: Colour): Colour {
  const [h, s0, l0] = hexToHsl(hex);
  // Near-greys have no hue worth amplifying; saturating them would invent one.
  const s = s0 < 0.12 ? s0 : Math.max(s0, NEON_MIN_SAT);
  let l = l0;
  let out = hslToHex(h, s, l);
  while (l < NEON_MAX_L && contrast(out, NEON_TILE) < NEON_MIN_CONTRAST) {
    l = Math.min(NEON_MAX_L, l + 0.01);
    out = hslToHex(h, s, l);
  }
  return out;
}

// `extra` is a single colour on some specs and a list on others.
export function neonInkAll(extra?: Extra): Extra | undefined {
  if (extra === undefined) return undefined;
  return Array.isArray(extra) ? extra.map(neonInk) : neonInk(extra as Colour);
}
