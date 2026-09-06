/*
 * Colour-space maths, shared by the icon build and the theme build.
 *
 * This used to live at the top of tools/palette.ts, in sRGB and HSL, because
 * the icon set only ever needed to nudge a colour it was already given: lift a
 * dark logo until it reads, darken it for a shadow. HSL is fine for that.
 *
 * It is not fine for what the theme build does. A theme variant is the same
 * theme at a different hue, and HSL rotation does not preserve "the same" —
 * hue 60 and hue 240 at identical S and L are a headlight and a bruise. The
 * eye reads lightness, and HSL's L is not lightness; it is the midpoint of the
 * largest and smallest channel, which says nothing about how bright the result
 * looks. Rotate the theme in HSL and the yellow variant blows out while the
 * blue one goes muddy, from the same numbers.
 *
 * OKLCH's L *is* perceived lightness, and its C is roughly constant in
 * perceived colourfulness across hue. Rotating H alone in OKLCH is as close as
 * a formula gets to "the same colour, another hue", which is the whole premise
 * of the eight variants.
 *
 * The catch is gamut: sRGB is not a cylinder, and a chroma that exists at one
 * hue may not exist at another. `hex()` handles that by walking chroma down
 * until the colour fits, rather than letting the channels clip — clipping
 * shifts hue, which is the one thing this module exists to hold still.
 */

export type Colour = string;

/** Lightness 0..1, chroma 0..~0.37, hue in degrees. */
export type Oklch = { l: number; c: number; h: number };

/* -------------------------------------------------------------- *
 * sRGB
 * -------------------------------------------------------------- */

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

export function hexToRgb(colour: Colour): [number, number, number] {
  const m = colour.replace('#', '');
  const full = m.length === 3 ? [...m].map((c) => c + c).join('') : m.slice(0, 6);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
  return [r, g, b];
}

export const rgbToHex = (r: number, g: number, b: number): Colour =>
  '#' +
  [r, g, b]
    .map((c) =>
      Math.round(clamp01(c) * 255)
        .toString(16)
        .padStart(2, '0')
        .toUpperCase()
    )
    .join('');

// sRGB transfer function, both directions.
const toLinear = (c: number): number =>
  c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
const toGamma = (c: number): number =>
  c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;

/* -------------------------------------------------------------- *
 * Contrast
 * -------------------------------------------------------------- */

/** WCAG relative luminance. */
export function luminance(colour: Colour): number {
  const [r, g, b] = hexToRgb(colour).map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio, 1..21. */
export function contrast(a: Colour, b: Colour): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/* -------------------------------------------------------------- *
 * OKLab / OKLCH  (Björn Ottosson, https://bottosson.github.io/posts/oklab/)
 * -------------------------------------------------------------- */

function rgbToOklab(r: number, g: number, b: number): [number, number, number] {
  const [lr, lg, lb] = [r, g, b].map(toLinear);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function oklabToRgb(L: number, A: number, B: number): [number, number, number] {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return [
    toGamma(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    toGamma(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    toGamma(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

export function oklch(colour: Colour): Oklch {
  const [L, A, B] = rgbToOklab(...hexToRgb(colour));
  const c = Math.hypot(A, B);
  // A colour with no chroma has no meaningful hue; report 0 rather than the
  // arctangent of two rounding errors, so `rotate` leaves greys alone.
  const h = c < 1e-4 ? 0 : ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360;
  return { l: L, c, h };
}

const IN_GAMUT = (rgb: number[]): boolean => rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4);

/**
 * OKLCH back to a hex, reducing chroma until the colour fits in sRGB.
 *
 * Letting the channels clip instead would be simpler and wrong: clipping moves
 * the hue, so a rotation that was supposed to land on "the same colour, 40°
 * over" lands somewhere else — and only for the hues that happen to be out of
 * gamut, which is how a palette ends up subtly inconsistent in exactly the
 * places it was generated to be consistent. Chroma is the axis with the least
 * to say, so chroma is what gives.
 */
const atChroma = (l: number, h: number, chroma: number): [number, number, number] => {
  const rad = (h * Math.PI) / 180;
  return oklabToRgb(l, Math.cos(rad) * chroma, Math.sin(rad) * chroma);
};

/**
 * The most chroma sRGB can hold at this lightness and hue.
 *
 * This is what makes a chroma comparable across hues. sRGB is not a cylinder —
 * it is a lumpy solid, widest around the primaries and pinched everywhere else —
 * so the same OKLCH chroma is a modest colour at one hue and past the boundary
 * at another. A palette that reuses one number across eight hues is therefore
 * not reusing one *decision*: it lands mid-range in violet and clipped flat in
 * green, and the green comes out looking dead rather than saturated.
 *
 * Measured against the true boundary rather than a round-trip through a hex,
 * because 8-bit quantisation is coarser than the search at low lightness — a
 * near-black never converges, and the answer comes back as zero.
 */
export function maxChroma(l: number, h: number): number {
  const L = clamp01(l);
  let lo = 0;
  let hi = 0.5;
  for (let i = 0; i < 28; i++) {
    const mid = (lo + hi) / 2;
    if (IN_GAMUT(atChroma(L, h, mid))) lo = mid;
    else hi = mid;
  }
  return lo;
}

export function hex({ l, c, h }: Oklch): Colour {
  const L = clamp01(l);
  let rgb = atChroma(L, h, c);
  // Reduce chroma rather than let the channels clip: clipping shifts hue, and
  // only for the colours that happen to be out of gamut.
  if (!IN_GAMUT(rgb)) rgb = atChroma(L, h, maxChroma(L, h));
  return rgbToHex(...rgb);
}

/* -------------------------------------------------------------- *
 * Operations
 * -------------------------------------------------------------- */

export const wrap = (deg: number): number => ((deg % 360) + 360) % 360;

/** Signed shortest angular distance from `a` to `b`, in -180..180. */
export const arc = (a: number, b: number): number => {
  const d = wrap(b - a);
  return d > 180 ? d - 360 : d;
};

/** Rotates a colour's hue, holding perceived lightness and chroma. */
export const rotate = (colour: Colour, degrees: number): Colour => {
  const p = oklch(colour);
  return p.c < 1e-4 ? colour : hex({ ...p, h: wrap(p.h + degrees) });
};

/** Mixes two colours in OKLab, where a midpoint looks like a midpoint. */
export function mix(a: Colour, b: Colour, t = 0.5): Colour {
  const [l1, a1, b1] = rgbToOklab(...hexToRgb(a));
  const [l2, a2, b2] = rgbToOklab(...hexToRgb(b));
  const at = (x: number, y: number): number => x + (y - x) * t;
  return rgbToHex(...oklabToRgb(at(l1, l2), at(a1, a2), at(b1, b2)));
}

/** Appends an 8-bit alpha to a hex, the way VS Code's theme colours take it. */
export const alpha = (colour: Colour, a: number): Colour =>
  colour +
  Math.round(clamp01(a) * 255)
    .toString(16)
    .padStart(2, '0')
    .toUpperCase();
