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
  /** For a folder: where the sunk pictogram's weight and box sit, and the box itself. */
  pictogram: { centreX: Units; centreY: Units; boxCentreX: Units; boxCentreY: Units; box: Bounds } | null;
  /** For a file icon: the other file icons it looks within LOOKALIKE_CEILING of at 16px. */
  lookalikes: { name: string; difference: number }[];
};

/*
 * How different two file icons look at 16px, as the explorer draws them —
 * over the ground, shadow and all: the mean OKLab distance (x100) between
 * them, pixel for pixel, over the pixels either one paints. The same glyph in
 * the same colour is 0. It is one number for shape and colour together, which
 * is the question: a flask and a checklist in one yellow are told apart by
 * shape, the same wrench in two blues only by colour, and either is fine as
 * long as the two come out apart. The audit keeps the pairs under the ceiling;
 * the check holds them to OPTICAL_LIMITS.minLookDifference.
 */
export const LOOKALIKE_CEILING = 12;

export type OpticsReport = Record<string, IconOptics>;

export const OPTICS_FILE = 'icon-optics.json';

/** Where build-icons.ts puts the centre of a file icon's artwork. */
export const ARTWORK_CENTRE = { x: 15.6, y: 15.4 };

/** A rectangle in the 32-unit canvas. */
export type Bounds = { left: Units; top: Units; right: Units; bottom: Units };

/*
 * The clear edge a folder keeps between its sunk pictogram and the edge of the
 * face it is sunk into: most of a pixel at 16px. Without it a pictogram grown
 * by its optical correction ran into the edge — the flask's neck touched the
 * seam under the tab, and the T of `fonts` ran off the bottom of the open
 * folder's front wall.
 */
const FOLDER_EDGE = 1.8;

/** The face a pictogram is sunk into, from the paths in build-icons.ts: the body under the tab, and the open folder's front wall. */
const CLOSED_FACE: Bounds = { left: 3, top: 10.35, right: 29, bottom: 27 };
const OPEN_FRONT: Bounds = { left: 5.2, top: 12.8, right: 29.6, bottom: 27.4 };

const inset = (bounds: Bounds, by: Units): Bounds =>
  ({ left: bounds.left + by, top: bounds.top + by, right: bounds.right - by, bottom: bounds.bottom - by });

/**
 * Where build-icons.ts sinks a folder's pictogram, how big, and the area its
 * ink may never leave, in each state. The centre is the middle of that area,
 * and the size its height, so a pictogram is as large as the face allows.
 */
export const FOLDER_PICTOGRAM_PLACEMENT = {
  closed: { cx: 16, cy: 18.675, size: 13, safe: inset(CLOSED_FACE, FOLDER_EDGE) },
  open: { cx: 17.4, cy: 20.1, size: 11, safe: inset(OPEN_FRONT, FOLDER_EDGE) },
};

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
  /*
   * The same, for the pictogram sunk into a folder, against its placement.
   * Tighter, because nothing stops the pull there: the facade is the pictogram's
   * whole canvas and it is never near its edge. M11 measured 0.04 at worst.
   */
  folderPictogramResidual: 0.5,
  /*
   * How far a folder's pictogram, as rasterised, may reach into the clear edge
   * FOLDER_PICTOGRAM_PLACEMENT keeps round it. The placement is exact; the
   * raster is not — antialiasing lights part of the next pixel of a 320px
   * render, 0.1 units. Anything past that is the pictogram touching the edge.
   */
  folderEdgeTolerance: 0.15,
  /* Shadow showing beside the ink, as a share of the ink. It reached 1.8 — a second icon, out of register. */
  shadowToInk: 0.6,
  /* The shadow against the darkest ground: visible as shade, never as a second edge. */
  shadowContrast: { min: 1.1, max: 3 },
  /* HSL saturation of the shadow. `darkened` gave up to 1.0 — a fringe more vivid than the ink. */
  shadowSaturation: 0.65,
  /* The share of lit pixels that are solid at 16px, below which an icon is a smudge rather than a shape. */
  minSolidAtSixteen: 0.07,
  /*
   * How different any two file icons must look at 16px (LOOKALIKE_CEILING says
   * how it is measured). 0 is one icon twice, which the set shipped four times
   * until M12. Below 8 the pairs M12 found were the same drawing in two
   * neighbouring colours — the Python and the TypeScript wrench at 2.4, MySQL
   * and a .model.ts at 4.6; from 9.5 up they are the TypeScript variants,
   * one colour and plainly different glyphs.
   */
  minLookDifference: 8,
};

/*
 * Pairs under minLookDifference that were looked at, at 16px, and kept, each
 * with the reason. Keyed by the two names in alphabetical order.
 */
export const REVIEWED_LOOKALIKES: Record<string, string> = {
  'file-env / file-javascript':
    'both are the project\'s own mark, a yellow tile with its name on it; the letters — .ENV and JS — are what tell them apart, as they do anywhere else',
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
