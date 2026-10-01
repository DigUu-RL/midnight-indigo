/*
 * Comparing screenshots and laying them out for review, in a headless browser:
 * the repository has no image library and needs none, since a canvas can
 * decode a PNG, read its pixels and write one back.
 *
 *   compare   counts the pixels that differ between two images and writes a
 *             diff — the newer image dimmed to grey, every changed pixel in
 *             magenta — so a reviewer sees where to look before what changed
 *   sheet     lays images out in a labelled grid, one contact sheet per
 *             surface, so the eight variants are looked at side by side
 */

import fs from 'node:fs';
import path from 'node:path';
import { chromium, type Browser, type Page } from 'playwright-core';
import { findBrowser } from '../shared/browser.ts';

export type Comparison = { width: number; height: number; changed: number; ratio: number; sameSize: boolean };
export type SheetCell = { label: string; file: string; note?: string };

export type ImageLab = {
  compare: (before: string, after: string, diffFile: string) => Promise<Comparison>;
  sheet: (title: string, cells: SheetCell[], columns: number, cellWidth: number, file: string) => Promise<void>;
  close: () => Promise<void>;
};

/** A channel has to move by more than this, out of 255, for a pixel to count as changed: below it is antialiasing noise. */
const CHANNEL_TOLERANCE: number = 6;

const dataUrl = (file: string): string => `data:image/png;base64,${fs.readFileSync(file).toString('base64')}`;
const escapeHtml = (text: string): string => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const openImageLab = async (): Promise<ImageLab> => {
  const browser: Browser = await chromium.launch({ executablePath: findBrowser(), headless: true });
  const page: Page = await browser.newPage();

  const compare = async (before: string, after: string, diffFile: string): Promise<Comparison> => {
    const result: Comparison & { png: string } = await page.evaluate(
      async ({ beforeUrl, afterUrl, tolerance }) => {
        const load = async (url: string): Promise<HTMLImageElement> => {
          const image: HTMLImageElement = new Image();
          image.src = url;
          await image.decode();
          return image;
        };
        const [beforeImage, afterImage] = await Promise.all([load(beforeUrl), load(afterUrl)]);
        const width: number = Math.max(beforeImage.width, afterImage.width);
        const height: number = Math.max(beforeImage.height, afterImage.height);
        const pixelsOf = (image: HTMLImageElement): Uint8ClampedArray => {
          const canvas: HTMLCanvasElement = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
          context.drawImage(image, 0, 0);
          return context.getImageData(0, 0, width, height).data;
        };
        const beforePixels: Uint8ClampedArray = pixelsOf(beforeImage);
        const afterPixels: Uint8ClampedArray = pixelsOf(afterImage);
        const canvas: HTMLCanvasElement = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d') as CanvasRenderingContext2D;
        const diff: ImageData = context.createImageData(width, height);
        let changed: number = 0;
        for (let offset = 0; offset < afterPixels.length; offset += 4) {
          const moved: boolean =
            Math.abs(beforePixels[offset] - afterPixels[offset]) > tolerance ||
            Math.abs(beforePixels[offset + 1] - afterPixels[offset + 1]) > tolerance ||
            Math.abs(beforePixels[offset + 2] - afterPixels[offset + 2]) > tolerance ||
            Math.abs(beforePixels[offset + 3] - afterPixels[offset + 3]) > tolerance;
          if (moved) {
            changed++;
            diff.data.set([255, 0, 200, 255], offset);
          } else {
            const grey: number = (afterPixels[offset] + afterPixels[offset + 1] + afterPixels[offset + 2]) / 3 / 3;
            diff.data.set([grey, grey, grey, 255], offset);
          }
        }
        context.putImageData(diff, 0, 0);
        return {
          width,
          height,
          changed,
          ratio: changed / (width * height),
          sameSize: beforeImage.width === afterImage.width && beforeImage.height === afterImage.height,
          png: canvas.toDataURL('image/png'),
        };
      },
      { beforeUrl: dataUrl(before), afterUrl: dataUrl(after), tolerance: CHANNEL_TOLERANCE }
    );
    if (result.changed) {
      fs.mkdirSync(path.dirname(diffFile), { recursive: true });
      fs.writeFileSync(diffFile, Buffer.from(result.png.split(',')[1], 'base64'));
    }
    return { width: result.width, height: result.height, changed: result.changed, ratio: result.ratio, sameSize: result.sameSize };
  };

  const sheet = async (title: string, cells: SheetCell[], columns: number, cellWidth: number, file: string): Promise<void> => {
    const figures: string = cells
      .map(
        (cell: SheetCell): string =>
          `<figure><figcaption><b>${escapeHtml(cell.label)}</b>${cell.note ? `<span>${escapeHtml(cell.note)}</span>` : ''}</figcaption>` +
          (fs.existsSync(cell.file) ? `<img src="${dataUrl(cell.file)}">` : '<div class="missing">not captured</div>') +
          '</figure>'
      )
      .join('');
    await page.setViewportSize({ width: columns * (cellWidth + 12) + 28, height: 600 });
    await page.setContent(
      `<!doctype html><meta charset="utf-8"><style>
        body { margin: 0; padding: 14px; background: #101014; color: #ddd; font: 13px 'Segoe UI', system-ui, sans-serif; }
        h1 { margin: 0 0 10px; font-size: 15px; font-weight: 600; }
        .grid { display: grid; grid-template-columns: repeat(${columns}, ${cellWidth}px); gap: 12px; }
        figure { margin: 0; }
        figcaption { display: flex; justify-content: space-between; gap: 8px; padding: 2px 0 4px; }
        figcaption span { color: #f6c; }
        img { display: block; width: ${cellWidth}px; outline: 1px solid #333; }
        .missing { height: 60px; display: grid; place-items: center; color: #f66; outline: 1px dashed #633; }
      </style><h1>${escapeHtml(title)}</h1><div class="grid">${figures}</div>`
    );
    await page.evaluate(async (): Promise<void> => {
      await Promise.all(Array.from(document.images).map((image: HTMLImageElement): Promise<void> => image.decode()));
    });
    fs.mkdirSync(path.dirname(file), { recursive: true });
    await page.screenshot({ path: file, fullPage: true });
  };

  return { compare, sheet, close: (): Promise<void> => browser.close() };
};
