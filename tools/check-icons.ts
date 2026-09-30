/*
 * Holds the built icon set to its optical audit, without a browser:
 *
 *   node tools/check-icons.ts
 *
 * tools/icon-optics.json is what tools/audit-icons.ts measured; this checks
 * that it is the audit of THESE icons (every SVG, by hash) and that every icon
 * stays inside tools/icon-optics.ts -> OPTICAL_LIMITS. The shadow's colour is
 * read straight from each SVG, since it is paint and not geometry.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sha256 } from './baseline.ts';
import { contrastRatio } from './palette.ts';
import {
  ARTWORK_CENTRE,
  DARKEST_GROUND,
  FOLDER_PICTOGRAM_PLACEMENT,
  OPTICAL_LIMITS,
  OPTICS_FILE,
  REVIEWED_LINE_ART,
  type IconOptics,
  type OpticsReport,
} from './icon-optics.ts';

const HERE: string = path.dirname(fileURLToPath(import.meta.url));
const SVG_DIRECTORY: string = path.join(HERE, '..', 'icons', 'svg');

const report: OpticsReport = JSON.parse(fs.readFileSync(path.join(HERE, OPTICS_FILE), 'utf8'));
const problems: string[] = [];
const rerun = ' — run: npm run audit:icons';

const iconNames: string[] = fs
  .readdirSync(SVG_DIRECTORY)
  .filter((file: string): boolean => file.endsWith('.svg'))
  .map((file: string): string => file.slice(0, -4));

/* ---------------- the audit is of these icons ---------------- */

for (const iconName of iconNames) {
  const optics: IconOptics | undefined = report[iconName];
  const hash: string = sha256(fs.readFileSync(path.join(SVG_DIRECTORY, `${iconName}.svg`))).slice(0, 12);
  if (!optics) problems.push(`${iconName} has not been audited${rerun}`);
  else if (optics.hash !== hash) problems.push(`${iconName} changed since it was audited${rerun}`);
}
for (const auditedName of Object.keys(report)) {
  if (!iconNames.includes(auditedName)) problems.push(`${auditedName} is audited but no longer built${rerun}`);
}

/* ---------------- the limits ---------------- */

const saturationOf = (hex: string): number => {
  const [red, green, blue] = [1, 3, 5].map((offset: number): number => parseInt(hex.slice(offset, offset + 2), 16) / 255);
  const brightest: number = Math.max(red, green, blue);
  const darkest: number = Math.min(red, green, blue);
  const lightness: number = (brightest + darkest) / 2;
  const spread: number = brightest - darkest;
  if (spread === 0) return 0;
  return lightness > 0.5 ? spread / (2 - brightest - darkest) : spread / (brightest + darkest);
};

const round = (value: number): string => value.toFixed(2);

for (const iconName of iconNames) {
  const optics: IconOptics | undefined = report[iconName];
  if (!optics) continue;

  if (iconName.startsWith('file-')) {
    const opticalX: number = ((optics.box.left + optics.box.right) / 2 + optics.massCentre.x) / 2;
    const opticalY: number = ((optics.box.top + optics.box.bottom) / 2 + optics.massCentre.y) / 2;
    const residual: number = Math.hypot(opticalX - ARTWORK_CENTRE.x, opticalY - ARTWORK_CENTRE.y);
    if (residual > OPTICAL_LIMITS.opticalResidual) {
      problems.push(`${iconName}: optical centre is ${round(residual)} units off (limit ${OPTICAL_LIMITS.opticalResidual})`);
    }
    if (optics.atSixteen.solid < OPTICAL_LIMITS.minSolidAtSixteen && !REVIEWED_LINE_ART[iconName]) {
      problems.push(
        `${iconName}: only ${Math.round(optics.atSixteen.solid * 100)}% of its pixels are solid at 16px — ` +
          'review it and add it to REVIEWED_LINE_ART with a reason, or give it a pictogram'
      );
    }
  }

  if (optics.pictogram) {
    const placement = iconName.endsWith('-open') ? FOLDER_PICTOGRAM_PLACEMENT.open : FOLDER_PICTOGRAM_PLACEMENT.closed;
    const opticalX: number = (optics.pictogram.centreX + optics.pictogram.boxCentreX) / 2;
    const opticalY: number = (optics.pictogram.centreY + optics.pictogram.boxCentreY) / 2;
    const residual: number = Math.hypot(opticalX - placement.cx, opticalY - placement.cy);
    if (residual > OPTICAL_LIMITS.folderPictogramResidual) {
      problems.push(`${iconName}: its pictogram's optical centre is ${round(residual)} units off (limit ${OPTICAL_LIMITS.folderPictogramResidual})`);
    }
    /* The rasterised ink may bleed a fraction of a pixel past the geometry it was placed from. */
    const { box } = optics.pictogram;
    const { safe } = placement;
    const tolerance: number = OPTICAL_LIMITS.folderEdgeTolerance;
    const overrun: number = Math.max(safe.left - box.left, box.right - safe.right, safe.top - box.top, box.bottom - safe.bottom);
    if (overrun > tolerance) {
      problems.push(`${iconName}: its pictogram runs ${round(overrun)} units into the clear edge of its face (tolerance ${tolerance})`);
    }
  }

  if (optics.shadowArea / optics.inkArea > OPTICAL_LIMITS.shadowToInk) {
    problems.push(`${iconName}: its shadow shows over ${round(optics.shadowArea / optics.inkArea)}x its ink (limit ${OPTICAL_LIMITS.shadowToInk})`);
  }

  const shadowColour: string | undefined = fs
    .readFileSync(path.join(SVG_DIRECTORY, `${iconName}.svg`), 'utf8')
    .match(/flood-color="(#[0-9A-Fa-f]{6})"/)?.[1];
  if (shadowColour) {
    const contrast: number = contrastRatio(shadowColour, DARKEST_GROUND);
    if (contrast < OPTICAL_LIMITS.shadowContrast.min || contrast > OPTICAL_LIMITS.shadowContrast.max) {
      problems.push(`${iconName}: shadow ${shadowColour} is ${round(contrast)}:1 on ${DARKEST_GROUND} (want ${OPTICAL_LIMITS.shadowContrast.min}–${OPTICAL_LIMITS.shadowContrast.max})`);
    }
    if (saturationOf(shadowColour) > OPTICAL_LIMITS.shadowSaturation) {
      problems.push(`${iconName}: shadow ${shadowColour} is saturated ${round(saturationOf(shadowColour))} (limit ${OPTICAL_LIMITS.shadowSaturation})`);
    }
  }
}

/* An exception for an icon that no longer needs one is a note nobody will re-read. */
for (const excusedName of Object.keys(REVIEWED_LINE_ART)) {
  const optics: IconOptics | undefined = report[excusedName];
  if (!optics) problems.push(`REVIEWED_LINE_ART names ${excusedName}, which is not built`);
  else if (optics.atSixteen.solid >= OPTICAL_LIMITS.minSolidAtSixteen) {
    problems.push(`REVIEWED_LINE_ART excuses ${excusedName}, which now passes on its own — remove it`);
  }
}

for (const problem of problems) console.error(`  ! ${problem}`);
console.log(problems.length ? `\n${problems.length} icon problem(s)` : `${iconNames.length} icons inside their optical limits`);
process.exitCode = problems.length ? 1 : 0;
