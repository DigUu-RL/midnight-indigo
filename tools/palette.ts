/*
 * The colour layer of the icon set.
 *
 * Every colour the build paints with lives here, together with the derivations
 * that turn a brand's official colour into something that survives on this
 * theme's near-black ground. tools/icon-spec.ts and tools/marks.ts stay the
 * single source of truth for *which* colour belongs to which language — this
 * module only decides how a given variant renders that colour.
 *
 * V2 removed the tile the marks used to sit on, and that changed what colour
 * has to do. A brand colour used to be a background the glyph was read against,
 * so anything went; now it IS the ink, read directly against #040208. Half the
 * set's official colours are too dark for that (Lua's #000080 lands at 1.1:1,
 * and every logo whose official form is black lands at 1.0:1), so `readable`
 * lifts them, and `shade` derives the shadow they cast.
 *
 * Adding a variant means adding a derivation here and a paint recipe in
 * build-icons.ts. Nothing about the geometry, the marks or the measurements has
 * to move.
 */

import type { Colour } from './glyphs.ts';

/* -------------------------------------------------------------- *
 * The base palette
 * -------------------------------------------------------------- */

/** themes/midnight-indigo-color-theme.json -> sideBar.background. */
export const GROUND: Colour = '#040208';
export const LIGHT: Colour = '#F2F0FA'; // what a black wordmark becomes
export const DARK: Colour = '#0A0716';

/** The folder body, and the accent the plain folder is drawn in. */
export const FOLDER: Colour = '#8B7CF6';

/* -------------------------------------------------------------- *
 * Colour maths
 * -------------------------------------------------------------- */

const hexToRgb = (hex: Colour): number[] => {
  const m = hex.replace('#', '');
  const full = m.length === 3 ? [...m].map((c) => c + c).join('') : m;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
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
 * The classic derivation: official colour -> visible ink
 * -------------------------------------------------------------- */

const MIN_CONTRAST = 4.2;
const MAX_L = 0.86;

/*
 * Lifts an official colour until it can be read as ink on the theme's ground,
 * keeping its hue and saturation so the language still looks like itself.
 *
 * A logo whose official colour is black or near-black (Rust, Crystal, Markdown,
 * JSON, Handlebars, Solidity...) is not lifted to grey: every one of those marks
 * ships a white version for dark backgrounds, and that is the one this set is
 * really using, so it goes straight to LIGHT. Lifting the lightness instead
 * would produce a muddy charcoal that reads as "broken" rather than "reversed".
 */
export function readable(hex: Colour): Colour {
  const [h, s, l0] = hexToHsl(hex);
  if (s < 0.2 && l0 < 0.3) return LIGHT;
  let l = l0;
  let out = hslToHex(h, s, l);
  while (l < MAX_L && contrast(out, GROUND) < MIN_CONTRAST) {
    l = Math.min(MAX_L, l + 0.01);
    out = hslToHex(h, s, l);
  }
  return out;
}

/*
 * The second half of a pictogram's duotone: the same hue, lighter and a little
 * calmer, for the surface a pictogram's detail sits on — the glass of the
 * flask, the page of the book, the screen of the terminal.
 *
 * It is derived rather than specified so that a pictogram tinted with any
 * language's colour gets a matching pair for free, and so that both variants
 * stay in step: neon lifts the identity colour first and takes the tint of
 * *that*, which keeps the two tones the same distance apart under either paint.
 */
export function tint(hex: Colour): Colour {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h, Math.max(0.22, s * 0.7), Math.min(0.88, l + 0.27));
}

/*
 * The shadow a mark casts in the classic variant.
 *
 * It cannot be black: the ground is #040208, and a black shadow on it is not a
 * shadow, it is nothing. So the shadow is the mark's own colour taken down in
 * lightness — dark enough to read as shade, light enough to still be visible
 * against the ground. The floor is what keeps the shadow of an already-dark
 * mark (a deep blue, a maroon) from disappearing.
 */
export function shade(hex: Colour, amount = 0.62): Colour {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h, Math.min(1, s * 1.08), Math.max(0.1, l * (1 - amount)));
}

/* -------------------------------------------------------------- *
 * The neon derivation
 * -------------------------------------------------------------- */

const NEON_MIN_CONTRAST = 5;
const NEON_MIN_SAT = 0.85;
const NEON_MAX_L = 0.94;

/*
 * Lifts a brand colour to neon: hue is kept, so TypeScript stays blue and
 * JavaScript stays yellow, while saturation and lightness are raised until the
 * ink reads as *lit* against the ground rather than merely legible on it.
 * Lightness is walked up rather than set outright because luminance is
 * hue-dependent — a pure blue has to go much lighter than a yellow to reach the
 * same contrast, and a fixed target lightness would leave the blues dim.
 */
export function neonInk(hex: Colour): Colour {
  const [h, s0, l0] = hexToHsl(hex);
  // Near-greys have no hue worth amplifying; saturating them would invent one.
  const s = s0 < 0.12 ? s0 : Math.max(s0, NEON_MIN_SAT);
  let l = Math.max(l0, 0.5);
  let out = hslToHex(h, s, l);
  while (l < NEON_MAX_L && contrast(out, GROUND) < NEON_MIN_CONTRAST) {
    l = Math.min(NEON_MAX_L, l + 0.01);
    out = hslToHex(h, s, l);
  }
  return out;
}
