/*
 * A file's fingerprint, for everything that pins generated output by content:
 * the baseline, the inventory's screenshots, the icon audit and the check that
 * a second build changes nothing.
 */

import crypto from 'node:crypto';

export const sha256 = (data: string | Buffer): string => crypto.createHash('sha256').update(data).digest('hex');
