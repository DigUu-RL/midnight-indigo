/*
 * The language and tool marks.
 *
 * A mark is a logo, and a logo is not ours to invent — so the geometry comes
 * from the projects' own artwork (imported by tools/import-marks.ts into
 * tools/mark-paths.ts) and only the treatment is ours. What this module adds on
 * top of that geometry is:
 *
 *   THE PALETTE. Every mark carries its official colours, in slot order. The
 *   build passes them through tools/palette.ts before painting — `readable` in
 *   the classic variant, because the ground is #040208 and a logo whose
 *   official colour is #000080 or black cannot be painted onto it unchanged.
 *   Nothing here knows which variant is asking, which is why the plate colours
 *   below are imported from palette.ts rather than declared: whether a colour
 *   is a brand's or the set's own structure is a question only that module
 *   answers, and `readable` has to be able to ask it.
 *
 *   THE PLATE. Several logos are a solid shape with the letters cut OUT of it —
 *   the TypeScript square, the npm rectangle, the Swift squircle. With a tile
 *   under them that read correctly; without one, the cut-out letters are just
 *   holes and the mark comes out as a solid blob. A plate is the silhouette
 *   painted behind the mark in the colour the letters are supposed to be.
 *
 *   THE MARKS WITH NO SVG TO IMPORT. Some logos have no flat single-file source
 *   worth importing — Microsoft's are not redistributable, Kotlin's and Lua's
 *   upstream files are a gradient and a wordmark. Those are drawn here by hand
 *   from the official artwork, in the same flat style as everything else.
 */

import { markPaths, type ImportedMark } from './mark-paths.ts';
import { INK_DARK, WHITE } from './palette.ts';
import {
  C,
  G,
  R,
  circD,
  cut,
  path,
  polyD,
  rectD,
  ringE,
  rot,
  rrD,
  type Colour,
  type Ink,
} from './shapes.ts';

/** A brand mark: its official colours, and how to draw it with them. */
export type Mark = {
  /** Official colours, in the slot order the artwork references. */
  palette: readonly Colour[];
  draw: (ink: Ink) => string;
};

/* -------------------------------------------------------------- *
 * Imported geometry
 * -------------------------------------------------------------- */

/** A plate painted behind an imported mark, in the source's own coordinates. */
type Plate = { d: string; c: number };

/*
 * Imported artwork is authored in its own box (24 for simple-icons, 128 for
 * devicon) with the origin in the top-left. The glyph box is 24 units centred
 * on the origin, so every mark is scaled to 24 and shifted half a box up and
 * left. Anything the artwork does beyond that — being off-centre in its own
 * box, overrunning it — is corrected later from the measured ink, by
 * tools/measure.ts and `place()` in build-icons.ts.
 */
const usedImports = new Set<ImportedMark>();

function imported(name: ImportedMark, palette: readonly Colour[], plate?: Plate): Mark {
  const art = markPaths[name];
  usedImports.add(name);
  const s = 24 / art.box;
  return {
    palette,
    draw: (ink) => {
      const paint = (i: number): Colour => ink[i] ?? ink[0];
      const body =
        (plate ? path(plate.d, paint(plate.c)) : '') +
        art.parts.map((p) => path(p.d, paint(p.c))).join('');
      return `<g transform="translate(-12 -12) scale(${Number(s.toFixed(5))})">${body}</g>`;
    },
  };
}

/** A plate shaped like the whole source box — the usual case. */
const boxPlate = (name: ImportedMark, rx: number, c = 0): Plate => ({
  d: rrD(0, 0, markPaths[name].box, markPaths[name].box, rx),
  c,
});

/* -------------------------------------------------------------- *
 * Hand-drawn marks
 * -------------------------------------------------------------- */

const hand = (palette: readonly Colour[], draw: (ink: Ink) => string): Mark => ({ palette, draw });

/*
 * The Microsoft Office marks. Microsoft's artwork is not redistributable, so
 * these are drawn from the shape language the icons have shared since 2013: a
 * rounded tile in the app's colour, a lighter panel over its right two-thirds,
 * and the app's initial in white. The initial is set as TEXT by the icon spec
 * rather than drawn here, so it uses the same measured type as every other
 * lettered icon in the set.
 */
const officeTile = (dark: Colour, light: Colour): Mark =>
  hand([dark, light], ([d, l]) => R(-11.6, -11.6, 23.2, 23.2, 3.4, d) + R(-3.4, -11.6, 15, 23.2, 3.4, l ?? d));

export const marks = {
  /* ---------------- JavaScript / TypeScript ---------------- */

  // The letters are cut out of the square, and the logo has them in black — so
  // the plate is dark rather than absent, and the mark holds up on a selected
  // row where the ground is no longer near-black.
  javascript: imported('javascript', ['#F7DF1E', INK_DARK], { d: rectD(0, 0, 24, 24), c: 1 }),
  typescript: imported('typescript', ['#3178C6', WHITE], boxPlate('typescript', 1.125, 1)),
  react: imported('react', ['#61DAFB']),

  /* ---------------- web frameworks and templating ---------------- */

  vue: imported('vue', ['#35495E', '#41B883']),
  svelte: imported('svelte', ['#FF3E00']),
  astro: imported('astro', ['#BC52EE']),
  coffeescript: imported('coffeescript', ['#6F4E37']),
  handlebars: imported('handlebars', ['#F0772B']),
  pug: imported('pug', ['#A86454']),
  graphql: imported('graphql', ['#E10098']),

  /* ---------------- markup and styles ---------------- */

  html5: imported('html5', ['#E34F26', '#F06529', WHITE]),
  // The letters are cut out of the tile, so the plate is what makes them white.
  css: imported('css', ['#663399', WHITE], boxPlate('css', 3.84, 1)),
  sass: imported('sass', ['#CC6699']),

  /* ---------------- data and config ---------------- */

  toml: imported('toml', ['#9C4121']),
  dotenv: imported('dotenv', ['#ECD53F', INK_DARK], { d: rectD(0, 0, 24, 24), c: 1 }),
  markdown: imported('markdown', ['#F2F0FA']),
  mdx: imported('mdx', ['#FCB32C']),

  /* ---------------- languages ---------------- */

  python: imported('python', ['#3776AB', '#FFD43B']),
  java: imported('java', ['#0074BD', '#EA2D2E']),
  csharp: imported('csharp', ['#9B4F96', '#68217A', WHITE]),
  fsharp: imported('fsharp', ['#378BBA']),
  dotnet: imported('dotnet', ['#512BD4']),
  php: imported('php', ['#777BB4']),
  ruby: imported('ruby', ['#CC342D']),
  go: imported('go', ['#00ADD8']),
  rust: imported('rust', ['#CE422B']),
  c: imported('c', ['#A8B9CC']),
  cplusplus: imported('cplusplus', ['#00599C']),
  swift: imported('swift', ['#F05138', WHITE], boxPlate('swift', 5.4, 1)),
  dart: imported('dart', ['#0075C9', '#00A8E1', '#00C4B3', '#22D3C5']),
  scala: imported('scala', ['#DC322F']),
  clojure: imported('clojure', ['#5881D8']),
  haskell: imported('haskell', ['#5D4F85']),
  elixir: imported('elixir', ['#4B275F']),
  perl: imported('perl', ['#0073A1']),
  r: imported('r', ['#276DC3']),
  nim: imported('nim', ['#FFE953']),
  crystal: imported('crystal', ['#000000']),
  zig: imported('zig', ['#F7A41D']),
  solidity: imported('solidity', ['#363636']),

  /*
   * Kotlin — the square whose right edge folds in to the centre. Upstream ships
   * it as a single shape under a three-stop gradient; this is the same geometry
   * split along the fold, painted with the two ends of that gradient, because
   * a gradient would be the only one in a flat set.
   */
  kotlin: hand(['#E44857', '#7F52FF'], ([a, b]) =>
    G([[-12, -12], [12, -12], [0, 0], [-12, 0]], a) + G([[-12, 0], [0, 0], [12, 12], [-12, 12]], b ?? a)
  ),

  // Julia — the three dots, in the language's red, green and purple.
  julia: hand(['#CB3C33', '#389826', '#9558B2'], ([a, b, c]) =>
    C(-6.4, 5.4, 6, a) + C(0, -6.2, 6, b ?? a) + C(6.4, 5.4, 6, c ?? a)
  ),

  /*
   * Lua — the moon in orbit. The upstream mark sets the word "Lua" inside the
   * sphere, which at the 16px VS Code renders a file icon at is a smudge, so
   * this keeps the three shapes that carry the logo and drops the lettering:
   * the sphere, the orbit seen edge-on, and the satellite riding it.
   */
  lua: hand(['#000080', '#F2F0FA'], ([a, b]) =>
    C(-1.6, 1.6, 8, a) +
    rot(-36, ringE(-1.6, 1.6, 11.9, 5.9, 1.5, b ?? a)) +
    C(7.8, -7.8, 3.1, a)
  ),

  /*
   * Groovy — the star-headed figure from the Apache Groovy mark. Upstream draws
   * it as an outlined wordmark laid over the star, which closes up completely
   * at icon size; this keeps the star and the eyes, which are what the mark is
   * recognised by.
   */
  groovy: hand(['#4298B8'], ([a]) => {
    const pts: [number, number][] = [];
    for (let i = 0; i < 16; i++) {
      const t = (Math.PI / 8) * i - Math.PI / 2;
      const r = i % 2 === 0 ? 11.8 : 6.4;
      pts.push([Math.cos(t) * r, Math.sin(t) * r * 0.86]);
    }
    return cut(a, polyD(pts), circD(-3.4, -0.8, 1.9), circD(3.4, -0.8, 1.9));
  }),

  // Erlang's mark is its wordmark; at icon size the letters close up, so the
  // icon spec sets it as text instead. Nothing to draw here.

  /* ---------------- shells ---------------- */

  gnubash: imported('gnubash', ['#4EAA25']),
  zsh: imported('zsh', ['#F15A24']),
  fishshell: imported('fishshell', ['#34C534']),

  // Vim — the diamond with the V cut out of it. Upstream sets "Vim" across the
  // diamond in a face that is illegible at icon size.
  vim: hand(['#019833'], ([a]) =>
    cut(
      a,
      polyD([[0, -11.8], [11.8, 0], [0, 11.8], [-11.8, 0]]),
      polyD([[-5.4, -4.6], [-2.2, -4.6], [0, 1.6], [2.2, -4.6], [5.4, -4.6], [1.5, 6.2], [-1.5, 6.2]])
    )
  ),

  /*
   * PowerShell — the console with the prompt in it. Microsoft's artwork is not
   * redistributable; this is the icon's own geometry, a tilted chevron and a
   * caret rule on a blue console panel.
   */
  powershell: hand(['#2C6FBB', '#FFFFFF'], ([a, b]) =>
    R(-11.8, -9.4, 23.6, 18.8, 2.6, a) +
    path(
      'M-7.4 -5.2 -5.1 -7.2 1.9 -0.9a1.4 1.4 0 0 1 0 2.1L-5.1 7.4-7.4 5.4-1.5 0.1Z',
      b ?? a
    ) +
    R(1.4, 4.4, 8.4, 2.6, 1.3, b ?? a)
  ),

  /* ---------------- infrastructure ---------------- */

  docker: imported('docker', ['#2496ED']),
  terraform: imported('terraform', ['#844FBA']),
  jupyter: imported('jupyter', ['#F37726']),
  git: imported('git', ['#F03C2E']),
  nginx: imported('nginx', ['#009639']),
  apache: imported('apache', ['#D22128']),
  vagrant: imported('vagrant', ['#1868F2']),
  azure: imported('azure', ['#0078D4', '#50E6FF']),

  /*
   * Jenkins — the butler. Upstream is a line-art portrait whose lines are a
   * fraction of a pixel wide at icon size; this is the same bust drawn solid,
   * with the eyes and the bow tie cut out of it.
   */
  jenkins: hand(['#D24939'], ([a]) =>
    cut(
      a,
      'M0 -12a7.6 7.6 0 0 1 7.6 7.6c0 3.4-1.4 5.7-3.1 7l0.6 2.2 5.1 2a4.1 4.1 0 0 1 2.5 3.7V12h-25.4v-1.5a4.1 4.1 0 0 1 2.5-3.7l5.1-2 0.6-2.2c-1.7-1.3-3.1-3.6-3.1-7A7.6 7.6 0 0 1 0 -12Z',
      circD(-2.9, -5.2, 1.6),
      circD(2.9, -5.2, 1.6),
      polyD([[0, 5.4], [4.5, 8], [0, 11.4], [-4.5, 8]])
    )
  ),

  gitlab: imported('gitlab', ['#FC6D26']),

  // CMake — the pyramid, in the three colours of its faces over a dark base.
  cmake: hand(['#00A94F', '#3D7EBB', '#E1231A'], ([a, b, c]) =>
    G([[0, -11.8], [-11.6, 10.6], [-0.6, 3.4]], a) +
    G([[0, -11.8], [11.6, 10.6], [0.6, 3.4]], b ?? a) +
    G([[-11.6, 10.6], [11.6, 10.6], [0, 1.6]], c ?? a)
  ),

  /* ---------------- JS ecosystem tooling ---------------- */

  // npm — the red square with the wordmark set in it. Upstream's square carries
  // a compact single-letter glyph that reads as an unrelated shape once it is
  // no longer next to the word "npm"; the icon spec sets the word itself over
  // this tile, the way the logo does.
  npm: hand(['#CB3837'], ([a]) => R(-11.8, -11.8, 23.6, 23.6, 1.8, a)),
  yarn: imported('yarn', ['#2C8EBB', WHITE], { d: circD(12, 12, 12), c: 1 }),
  pnpm: imported('pnpm', ['#F69220']),
  eslint: imported('eslint', ['#4B32C3']),
  stylelint: imported('stylelint', ['#263238']),
  babel: imported('babel', ['#F9DC3E']),
  webpack: imported('webpack', ['#8DD6F9']),
  vite: imported('vite', ['#BD34FE']),
  rollup: imported('rollup', ['#EC4A3F']),

  // Jest — the wizard hat. Upstream draws the whole wizard in line art, which
  // is unreadable at icon size; the hat is the half of it that carries the mark.
  jest: hand(['#C21325'], ([a]) =>
    cut(
      a,
      'M-1.2 -12 8.4 4.4-6.8 6.2Z' +
        'M-11.8 6 9.4 3.4l1 3.3a1.7 1.7 0 0 1-1.3 2.1L-8.6 11.8a1.7 1.7 0 0 1-2-1.3Z',
      polyD([[2.4, -3.6], [3.5, -1.4], [5.8, -1], [4.1, 0.7], [4.5, 3], [2.4, 1.9], [0.3, 3], [0.7, 0.7], [-1, -1], [1.3, -1.4]])
    )
  ),

  // Prettier — its signature stack of coloured bars.
  prettier: hand(['#F7B93E', '#EA5E5E', '#56B3B4', '#BF85BF', '#E8EEF2'], (ink) => {
    const row = (y: number, segs: readonly (readonly [number, number])[]): string => {
      let out = '';
      let x = -11.4;
      for (const [w, i] of segs) {
        out += R(x, y, w, 5.6, 2.3, ink[i] ?? ink[0]);
        x += w + 1.9;
      }
      return out;
    };
    return (
      row(-10.4, [[9.6, 0], [11.3, 1]]) +
      row(-2.8, [[6, 2], [6, 3], [7, 4]]) +
      row(4.8, [[12.6, 1], [8.3, 0]])
    );
  }),

  /* ---------------- documents ---------------- */

  excel: officeTile('#107C41', '#21A366'),
  word: officeTile('#185ABD', '#2B7CD3'),
  powerpoint: officeTile('#C43E1C', '#ED6C47'),
} satisfies Record<string, Mark>;

export type MarkName = keyof typeof marks;

/**
 * Imported geometry nothing draws — dead weight in tools/mark-paths.ts, and the
 * only way to notice is to ask. The build prints it.
 */
export const unusedImports = (): ImportedMark[] =>
  (Object.keys(markPaths) as ImportedMark[]).filter((n) => !usedImports.has(n));
