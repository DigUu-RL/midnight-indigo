/*
 * The colour layer of the icon set.
 *
 * Every colour the build paints with lives here, together with the derivations
 * that turn a brand's official colour into something that survives on this
 * theme's near-black ground. tools/icons/icon-spec.ts and tools/icons/marks.ts stay the
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
import { deltaE, hexFromOklch, mix, oklchFromHex } from '../shared/color.ts';

/* -------------------------------------------------------------- *
 * The base palette
 * -------------------------------------------------------------- */

/** themes/midnight-indigo-color-theme.json -> sideBar.background. */
export const GROUND: Colour = '#040208';
export const LIGHT_INK: Colour = '#F2F0FA'; // what a black wordmark becomes
export const DARK: Colour = '#0A0716';

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
 * These live here rather than in tools/icons/marks.ts because this module is where
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

/*
 * The floor for line art (M10). A stroke thinner than a pixel is never drawn
 * at full strength: at 16px it covers part of each pixel it crosses, and what
 * the eye gets is the ink blended with the ground — roughly half of it. The
 * optical audit found the Electron atom, the PostgreSQL elephant and the
 * GitHub Actions graph with no solid pixel at all at 16px, dim teal and navy
 * smudges. Lifting the ink until its contrast survives being halved is the
 * compensation, and it keeps the hue: the atom is still Electron's teal.
 */
export const LINE_ART_CONTRAST = 6;
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
export function readableOnGround(hex: Colour, minimumContrast = MIN_CONTRAST_ON_GROUND): Colour {
  if (isStructuralColour(hex)) return hex;
  const [h, s, l0] = hexToHsl(hex);
  if (s < 0.2 && l0 < 0.3) return LIGHT_INK;
  let l = l0;
  let out = hslToHex(h, s, l);
  while (l < MAX_LIFTED_LIGHTNESS && contrastRatio(out, GROUND) < minimumContrast) {
    l = Math.min(MAX_LIFTED_LIGHTNESS, l + 0.01);
    out = hslToHex(h, s, l);
  }
  return out;
}

/*
 * The second half of a pictogram's duotone: the surface a pictogram's detail
 * sits on — the glass of the flask, the page of the book, the screen of the
 * terminal — as the ink taken part of the way down to the ground.
 *
 * Until M12 it was the ink LIGHTER, near white, and that turned the drawing
 * inside out: a surface is Phosphor's ink at 20%, the quiet half of the pair,
 * and painted brighter than the lines it was the brightest thing in the icon.
 * Where the surface is large it became a pale slab — the whole square behind
 * the math operators, the card behind the hosts file — and where it fills
 * part of a letterform, the bowl of 文 and the counter of the A in the
 * translation glyph, it read as a hole punched in it. At SURFACE_INK of the
 * ink the lines lead and the surface shades, which is what it was drawn to do.
 *
 * It is derived rather than specified so that a pictogram tinted with any
 * language's colour gets a matching pair for free — adding a language means
 * adding one colour, not two — and so that a variant which repaints the
 * identity colour gets the second tone repainted with it.
 */
const SURFACE_INK = 0.55;
export const surfaceTint = (hex: Colour): Colour => mix(GROUND, hex, SURFACE_INK);

/*
 * The colour an ink casts as its shadow (M10).
 *
 * It cannot be black: the ground is #040208, and a black shadow on it is not a
 * shadow, it is nothing. So the shadow is the mark's own colour taken down in
 * lightness — dark enough to read as shade, light enough to still be visible
 * against the ground. The floor is what keeps the shadow of an already-dark
 * mark (a deep blue, a maroon) from disappearing.
 *
 * Until M10 it was `darkened`, which RAISED saturation while it took the
 * lightness down — a shadow more vivid than the thing casting it, which on a
 * near-black ground is not shade but a coloured fringe. A shadow is the ink
 * with light taken away, and less light means less chroma: this keeps the hue,
 * so a Python icon still casts a blue shade and a Rust one a rust one, but at
 * a little over half the saturation.
 */
export function castShadow(hex: Colour): Colour {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h, s * 0.6, Math.max(0.085, l * 0.38 * 0.85));
}

/* -------------------------------------------------------------- *
 * Folders: the colour of what a directory is FOR (M11)
 * -------------------------------------------------------------- *
 *
 * A file icon says which technology a file is in, with the technology's own
 * colours. A folder says what part of the project a directory holds, and up to
 * M11 it said so with a colour of its own for every name: fifty-two accents
 * taken from a web palette, as saturated as the logos (median OKLCH chroma 0.14
 * against their 0.15) and spread round the whole wheel. Two things went wrong.
 * A folder is a solid panel and a logo is a mark with air round it, so at equal
 * chroma the folders outweighed the files they hold. And fifty-two hues is no
 * system at all: styles, media and audio were one pink, docker and views one
 * blue, while tests and validators, which are one job, were two greens.
 *
 * So the colour now belongs to a ROLE, and the pictogram tells the folders of
 * one role apart. Seven roles and the plain folder are hues in OKLCH at one
 * shared chroma — the M1 method: chroma comparable across hues, the hue doing
 * the talking. That chroma sits under the lower quartile of the logos'
 * identity colours, so the tree's colour comes from the files, and the folders
 * set the key.
 *
 * Eight hues at a calm chroma are at most six ΔE from their neighbours, which
 * is a difference seen side by side and missed across a tree. So neighbours on
 * the wheel also step in lightness, one up and the next down, and the pair a
 * hue alone would blur — security and content, logic and network — are told
 * apart by light as well. The steps alternate all the way round, which is why
 * the wheel holds an even number of hues.
 *
 * The plain folder is the theme's own indigo and means "a directory, nothing
 * more"; it is one of the eight so that no role is ever mistaken for it. Two
 * roles have no hue at all. Tooling is slate — the scaffolding round a project,
 * which is in every repository and should be the quietest coloured thing in
 * it — and dormant is a dimmer warm grey, for what nobody means to open: logs,
 * caches, the archive.
 */

export type FolderRole =
  | 'plain'
  | 'interface'
  | 'content'
  | 'logic'
  | 'data'
  | 'network'
  | 'quality'
  | 'security'
  | 'tooling'
  | 'dormant';

/** The chroma every hued role shares, and the two lightness steps they alternate between. */
const FOLDER_CHROMA = 0.095;
const FOLDER_LIGHT = 0.745;
const FOLDER_DEEP = 0.655;

type FolderTone = { hue: number; lightness: number; chroma?: number };

/* In wheel order, so the alternation of the steps can be read down the list. */
export const FOLDER_ROLES = {
  /* what keeps it closed: security, guards, keys */
  security: { hue: 18, lightness: FOLDER_LIGHT },
  /* what the project ships as material: assets, media, fonts, docs, locales */
  content: { hue: 55, lightness: FOLDER_DEEP },
  /* what the code holds: models, stores, databases, schemas, types, constants */
  data: { hue: 92, lightness: FOLDER_LIGHT },
  /* what proves it works: tests, mocks, validators, benchmarks */
  quality: { hue: 148, lightness: FOLDER_DEEP },
  /* what answers a request: services, controllers, routes, api, servers, jobs */
  network: { hue: 195, lightness: FOLDER_LIGHT },
  /* the code that computes: functions, utils, helpers, hooks, core, plugins */
  logic: { hue: 245, lightness: FOLDER_DEEP },
  /* the theme's own indigo: a directory with no role of its own */
  plain: { hue: 286, lightness: FOLDER_LIGHT },
  /* what the user sees: components, views, layouts, styles, themes, design */
  interface: { hue: 340, lightness: FOLDER_DEEP },
  /* the scaffolding round it: config, scripts, build, docker, workflows, ai */
  tooling: { hue: 250, lightness: 0.7, chroma: 0.025 },
  /* what nobody means to open: logs, temp, archive */
  dormant: { hue: 60, lightness: 0.57, chroma: 0.012 },
} satisfies Record<FolderRole, FolderTone>;

/** The colour a folder's facade is painted, from its role. */
export const folderAccent = (role: FolderRole): Colour => {
  const tone: FolderTone = FOLDER_ROLES[role];
  return hexFromOklch({ l: tone.lightness, c: tone.chroma ?? FOLDER_CHROMA, h: tone.hue });
};

/*
 * The tones cut from a facade, all derived in OKLCH from the accent so that a
 * role changing hue carries its whole folder with it. The pictogram is sunk,
 * darker than the facade by a fixed step of perceived lightness — the HSL
 * `darkened` this replaced took the gold and the teal down twice as far as the
 * blue from the same number. The open folder's back wall sits between the two.
 */
const SUNK_STEP = 0.42;
const BACK_WALL_STEP = 0.2;

const lowered = (colour: Colour, step: number): Colour => {
  const tone = oklchFromHex(colour);
  return hexFromOklch({ l: tone.l - step, c: tone.c, h: tone.h });
};

export const folderTones = (accent: Colour): { face: Colour; backWall: Colour; sunk: Colour } => ({
  face: accent,
  backWall: lowered(accent, BACK_WALL_STEP),
  sunk: lowered(accent, SUNK_STEP),
});

/*
 * What the build holds the folder palette to. The numbers are the M11 design
 * read back as limits, so a role that is moved later cannot quietly undo it.
 */
export const FOLDER_LIMITS = {
  /** The facade against the side bar: a folder is never lost in the tree. */
  minContrastOnGround: 4.5,
  /** The sunk pictogram against its facade: the silhouette still reads at 6px. */
  minPictogramContrast: 3,
  /** Two roles side by side in a tree must not be mistaken for each other (OKLab ΔE × 100). */
  minRoleSeparation: 8,
  /** The loudest folder stays under the logos' lower-quartile chroma. */
  maxChroma: 0.1,
};

/** Every way the folder palette breaks FOLDER_LIMITS; empty when it holds. */
export const folderPaletteProblems = (): string[] => {
  const problems: string[] = [];
  const roles = Object.keys(FOLDER_ROLES) as FolderRole[];
  for (const role of roles) {
    const accent: Colour = folderAccent(role);
    const tones = folderTones(accent);
    const onGround: number = contrastRatio(accent, GROUND);
    if (onGround < FOLDER_LIMITS.minContrastOnGround) {
      problems.push(`folder role ${role}: ${accent} is ${onGround.toFixed(2)}:1 on ${GROUND} (want ${FOLDER_LIMITS.minContrastOnGround})`);
    }
    const pictogram: number = contrastRatio(tones.sunk, accent);
    if (pictogram < FOLDER_LIMITS.minPictogramContrast) {
      problems.push(`folder role ${role}: pictogram ${tones.sunk} is ${pictogram.toFixed(2)}:1 on its facade (want ${FOLDER_LIMITS.minPictogramContrast})`);
    }
    const chroma: number = oklchFromHex(accent).c;
    if (chroma > FOLDER_LIMITS.maxChroma) {
      problems.push(`folder role ${role}: chroma ${chroma.toFixed(3)} is louder than the logos allow (${FOLDER_LIMITS.maxChroma})`);
    }
  }
  roles.forEach((role: FolderRole, index: number): void => {
    for (const other of roles.slice(index + 1)) {
      const separation: number = deltaE(folderAccent(role), folderAccent(other));
      if (separation < FOLDER_LIMITS.minRoleSeparation) {
        problems.push(`folder roles ${role} and ${other} are ${separation.toFixed(1)} apart (want ${FOLDER_LIMITS.minRoleSeparation})`);
      }
    }
  });
  return problems;
};
