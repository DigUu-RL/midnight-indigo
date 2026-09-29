/*
 * What the optical audit measures, and what it is held to.
 */

/** A length or position in the icon's own 32-unit canvas; 2 units is one pixel at 16px. */
type Units = number;

export type Solidity = {
  /** Pixels with any ink at this size. */
  lit: number;
  /** Of those, the share that is solid ink rather than a blend with the ground. */
  solid: number;
};

export type IconOptics = {
  name: string;
  /** The SVG this was measured from, so a stale audit is caught. */
  hash: string;
  box: { left: Units; top: Units; right: Units; bottom: Units };
  /** Where the ink's weight sits — the optical centre, not the box's. */
  massCentre: { x: Units; y: Units };
  inkArea: Units;
  /** Alpha-weighted share of the canvas the ink covers. */
  coverage: number;
  /** Twice the ink area over its outline: the mean stroke thickness. */
  strokeWidth: Units;
  /** Empty area enclosed by ink: counters, cut-outs, the inside of a ring. */
  holeArea: Units;
  /** How much of the corners of the ink's own box is filled — 1 for a sharp square. */
  cornerFill: number;
  /** How far the shadow runs past the ink. */
  shadowReach: { right: Units; bottom: Units };
  /** Shadow that shows beside the ink rather than under it. */
  shadowArea: Units;
  atSixteen: Solidity;
  atThirtyTwo: Solidity;
  /** For a folder: where the sunk pictogram's weight and box sit. */
  pictogram: { centreX: Units; centreY: Units; boxCentreX: Units; boxCentreY: Units } | null;
};

export type OpticsReport = Record<string, IconOptics>;

export const OPTICS_FILE = 'icon-optics.json';

/** Where build-icons.ts puts the centre of a file icon's artwork. */
export const ARTWORK_CENTRE = { x: 15.6, y: 15.4 };

/*
 * What `npm run check` holds the audit to. Each limit is set from the audit of
 * the set after M10's corrections, with room for the next icon to land inside
 * it, and each says what failing it looks like.
 */
export const OPTICAL_LIMITS = {
  /*
   * The optical centre — halfway between the ink's box and its centre of
   * mass, which is where build-icons.ts aims — may sit this far from the
   * artwork centre. It is not zero because the canvas edge stops the pull on
   * a tall mark with its weight at one end: the flask, the zsh prompt. 1.3
   * units is two thirds of a pixel at 16px. Before M10 the set ran to 2.4.
   */
  opticalResidual: 1.3,
  /* Shadow showing beside the ink, as a share of the ink. It reached 1.8 — a second icon, out of register. */
  shadowToInk: 0.6,
  /* The shadow against the darkest ground: visible as shade, never as a second edge. */
  shadowContrast: { min: 1.1, max: 3 },
  /* HSL saturation of the shadow. `darkened` gave up to 1.0 — a fringe more vivid than the ink. */
  shadowSaturation: 0.65,
  /* The share of lit pixels that are solid at 16px, below which an icon is a smudge rather than a shape. */
  minSolidAtSixteen: 0.07,
};

/** The darkest ground an icon is drawn on: themes/midnight-indigo-color-theme.json -> editor.background. */
export const DARKEST_GROUND = '#020108';

/*
 * Icons that fall under minSolidAtSixteen and were looked at in M10, at 16px
 * on the sidebar and on the hover ground, and kept. Each says why. An icon
 * that falls under the limit and is not here fails the check: either it gets
 * reviewed and a reason, or it gets a pictogram, as Electron did.
 */
export const REVIEWED_LINE_ART: Record<string, string> = {
  'file-fish': "the fish outline survives as a fish; fish shell's mark is the whole of its identity",
  'file-haxe': "the crossed star reads as Haxe's star; its thin sides are what the mark is",
  'file-java': 'the cup and saucer carry it; the steam is thin and was always going to be',
  'file-githubactions': 'the three nodes and their links read as a graph at 16px, which is what the file is',
  'file-laravel': 'the cube outline reads once the shadow is off it — the shadow was what smeared it',
  'file-postgresql': "the elephant's head and trunk read at 16px; lifted to the line-art floor",
  'file-abap': 'lettering at four characters is thin at 16px by nature; the rule under it carries the weight',
  'file-figma': 'five shapes in outline; at 16px they read as the Figma stack',
  'file-swagger': 'the ring and the braces read; the ring is solid enough to hold the icon',
  'file-purescript': 'the arrows and the bars are one-pixel strokes; they read as its mark',
  'file-postcss': 'the ring and the triangle read once the shadow is off; the inner square is detail',
};
