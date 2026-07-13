/**
 * A single perceptron — the 1958 idea, and the one that hit a wall.
 *
 * It computes ONE weighted sum of its inputs, squashes it to a 0–1 answer, and
 * that's the whole model. Enough to draw a single straight line between "yes"
 * and "no" — but no more. We train it on ONE concrete task, XOR, so you can
 * watch real numbers flow through every line.
 *
 * The catch you'll see for yourself: XOR can't be split by a single straight
 * line, so no matter how long this trains on XOR it never gets below ~0.25
 * error. That failure is the whole reason hidden layers (xor-net.ts) exist.
 */

import { makeRng, uniform, type Rng } from './rng';

// The "squash": bends any number into 0–1, so the output reads like confidence.
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

// THE TASK, spelled out. XOR ("exclusive or") wants a 1 only when the two
// inputs DIFFER. Two bits have exactly four combinations, so these four rows
// ARE the entire training set — each input paired with the answer we want.
// (xor-net.ts trains on these same four examples.)
export const XOR_INPUTS: [number, number][] = [
  [0, 0], // same   → want 0
  [0, 1], // differ → want 1
  [1, 0], // differ → want 1
  [1, 1], // same   → want 0
];
export const XOR_TARGETS = [0, 1, 1, 0];

export class Perceptron {
  // Two weights (one per input) and a bias. These three numbers are everything
  // the perceptron knows — and the only things training changes.
  w: [number, number];
  b: number;
  private rng: Rng;

  constructor(seed = 42) {
    this.rng = makeRng(seed);
    // Start random, so the very first guesses are basically coin-flips.
    this.w = [uniform(this.rng, -1, 1), uniform(this.rng, -1, 1)];
    this.b = uniform(this.rng, -1, 1);
  }

  // Guess: weigh each input, add the bias, squash to 0–1.
  predict(x: [number, number]): number {
    return sigmoid(this.w[0] * x[0] + this.w[1] * x[1] + this.b);
  }

  /**
   * One EPOCH = one pass over the four XOR examples. For each we guess, measure
   * the error, and nudge the two weights + bias to shrink it. Returns the
   * average squared error — which, for XOR, stubbornly stalls around 0.25.
   */
  trainEpoch(lr = 0.5, inputs = XOR_INPUTS, targets = XOR_TARGETS): number {
    let loss = 0;
    for (let i = 0; i < inputs.length; i++) {
      const x = inputs[i]; //     one input pair, e.g. [0, 1]
      const want = targets[i]; // the answer we want for it, e.g. 1

      const out = this.predict(x); // our guess, e.g. 0.62
      const err = out - want; //     how wrong: + too high, − too low
      loss += err * err;

      // Which way to nudge: the error, scaled by the sigmoid's slope here.
      const grad = err * out * (1 - out);
      this.w[0] -= lr * grad * x[0]; // step each weight down the error
      this.w[1] -= lr * grad * x[1];
      this.b -= lr * grad;
    }
    return loss / inputs.length; // average error this pass
  }
}
