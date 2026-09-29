import {
  randomUUID
} from 'crypto';

/* =========================================================
   PROJECT PLANNING UUID
========================================================= */

export function makePrjUUID() {
  return randomUUID()
    .replaceAll(
      '-',
      ''
    )
    .slice(
      0,
      16
    );
}