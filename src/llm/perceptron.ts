/**
 * A single perceptron — the 1958 idea, and the one that hit a wall.
 *
 * It computes ONE weighted sum of its inputs, squashes it, and calls that the
 * answer. That's enough to draw a single straight line between "yes" and "no".
 * The catch: XOR can't be split by a single straight line — so no matter how
 * long you train this thing, it never gets below ~0.25 error. That failure is
 * the whole reason hidden layers (the next file) had to be invented.
 */

import { makeRng, uniform, type Rng } from './rng';

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

/** The four XOR examples: output is 1 only when the inputs differ. */
export const XOR_DATA: { x: [number, number]; y: number }[] = [
  { x: [0, 0], y: 0 },
  { x: [0, 1], y: 1 },
  { x: [1, 0], y: 1 },
  { x: [1, 1], y: 0 },
];

export class Perceptron {
  w: [number, number];
  b: number;
  private rng: Rng;

  constructor(seed = 42) {
    this.rng = makeRng(seed);
    this.w = [uniform(this.rng, -1, 1), uniform(this.rng, -1, 1)];
    this.b = uniform(this.rng, -1, 1);
  }

  predict(x: [number, number]): number {
    return sigmoid(this.w[0] * x[0] + this.w[1] * x[1] + this.b);
  }

  /** One pass over the data. Returns mean-squared error (it will stall ~0.25). */
  trainEpoch(lr = 0.5): number {
    let loss = 0;
    for (const { x, y } of XOR_DATA) {
      const out = this.predict(x);
      const err = out - y;
      loss += err * err;
      // gradient of MSE through the sigmoid
      const grad = err * out * (1 - out);
      this.w[0] -= lr * grad * x[0];
      this.w[1] -= lr * grad * x[1];
      this.b -= lr * grad;
    }
    return loss / XOR_DATA.length;
  }
}
