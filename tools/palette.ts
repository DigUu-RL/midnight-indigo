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
export const LIGHT_INK: Colour = '#F2F0FA'; // what a black wordmark becomes
export const DARK: Colour = '#0A0716';

/** The folder body, and the accent the plain folder is drawn in. */
export const FOLDER: Colour = '#8B7CF6';

/* -------------------------------------------------------------- *
 * Structural colours
 * -------------------------------------------------------------- */

/**
 * White, and the near-black a knocked-out letter is worth when the logo's own
 * letters are dark. Several marks are a solid shape with the lettering cut out
 * of it — the TypeScript square, the npm rectangle, JavaScript's, .env's — and
 * with no tile under them those cut-outs are just holes, so the mark is painted
 * over a PLATE in the colour the letters are supposed to be.
 */
export const WHITE: Colour = '#FFFFFF';
export const INK_DARK: Colour = '#0F0B1E';

/**
 * The colours no variant may derive.
 *
 * A plate is not a brand colour. It is structure: the thing that makes a
 * knocked-out letter legible, and it is chosen against the letter it sits
 * behind rather than against the theme's ground. `readable()` cannot tell the
 * difference on its own — it sees a saturated near-black, assumes a logo too
 * dark to paint on #040208, and lifts it. Which is exactly what went wrong:
 * INK_DARK came out as #7762C6, a mid purple, and the yellow lettering of the
 * .env and JavaScript marks dropped from 13:1 against their plate to 3.3:1,
 * turning both icons into a smudge at the size the file explorer draws them.
 *
 * These live here rather than in tools/marks.ts because this module is where
 * the question "may a variant repaint this?" is answered, and the answer has to
 * be visible to the derivations that would otherwise repaint it.
 */
const STRUCTURAL: ReadonlySet<Colour> = new Set([WHITE, INK_DARK]);

/** Whether a colour is structure rather than identity, and so must not move. */
export const isStructuralColour = (hex: Colour): boolean => STRUCTURAL.has(hex);

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
export function relativeLuminance(hex: Colour): number {
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrastRatio(a: Colour, b: Colour): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
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

const MIN_CONTRAST_ON_GROUND = 4.2;
const MAX_LIFTED_LIGHTNESS = 0.86;

/*
 * Lifts an official colour until it can be read as ink on the theme's ground,
 * keeping its hue and saturation so the language still looks like itself.
 *
 * A logo whose official colour is black or near-black (Rust, Crystal, Markdown,
 * JSON, Handlebars, Solidity...) is not lifted to grey: every one of those marks
 * ships a white version for dark backgrounds, and that is the one this set is
 * really using, so it goes straight to LIGHT_INK. Lifting the lightness instead
 * would produce a muddy charcoal that reads as "broken" rather than "reversed".
 */
export function readableOnGround(hex: Colour): Colour {
  if (isStructuralColour(hex)) return hex;
  const [h, s, l0] = hexToHsl(hex);
  if (s < 0.2 && l0 < 0.3) return LIGHT_INK;
  let l = l0;
  let out = hslToHex(h, s, l);
  while (l < MAX_LIFTED_LIGHTNESS && contrastRatio(out, GROUND) < MIN_CONTRAST_ON_GROUND) {
    l = Math.min(MAX_LIFTED_LIGHTNESS, l + 0.01);
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
 * language's colour gets a matching pair for free — adding a language means
 * adding one colour, not two — and so that a variant which repaints the
 * identity colour gets the second tone repainted with it, keeping the two tones
 * the same distance apart under any paint.
 */
export function lighterTint(hex: Colour): Colour {
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
export function darkened(hex: Colour, amount = 0.62): Colour {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h, Math.min(1, s * 1.08), Math.max(0.1, l * (1 - amount)));
}

