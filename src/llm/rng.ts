/**
 * A tiny seeded random-number generator (mulberry32).
 *
 * Why bother? So every "training" demo starts from the same place each time you
 * press the button — the animation is reproducible, and the story ("watch it go
 * from random to solved") always lands the same way.
 */

export type Rng = () => number;

/** Make a seeded generator returning floats in [0, 1). */
export function makeRng(seed: number): Rng {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A uniform number in [min, max). */
export function uniform(rng: Rng, min: number, max: number): number {
  return min + (max - min) * rng();
}

/** A standard-normal sample (Box–Muller). Handy for weight initialization. */
export function gaussian(rng: Rng): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** In-place Fisher–Yates shuffle using the seeded generator. */
export function shuffle<T>(arr: T[], rng: Rng): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
