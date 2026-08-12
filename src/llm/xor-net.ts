/**
 * A neural network that learns XOR - the problem that stumped researchers for
 * seventeen years, cracked by adding one "hidden" layer of neurons and training
 * with backpropagation (Rumelhart, Hinton & Williams, 1986).
 *
 * Like the perceptron, we train on ONE concrete task - XOR - so you can trace
 * real numbers through every line. Read this top to bottom and you'll
 * understand the three ideas ALL of deep learning is built on:
 *   • a WEIGHT  - a number that says how much one input matters,
 *   • the ERROR - a number that says how wrong the current guess is,
 *   • TRAINING  - nudging every weight a little to make the error smaller,
 *                 then repeating that thousands of times.
 *
 * Shape: 2 inputs → 4 hidden neurons → 1 output. No ML libraries; just loops.
 */

import { makeRng, uniform, type Rng } from './rng';
// The same four XOR examples we trained the perceptron on.
import { XOR_INPUTS, XOR_TARGETS } from './perceptron';

// The "squash" function. It takes any number and bends it into the range 0–1,
// so the network's output reads like a confidence ("how strongly: yes?").
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

export class XorNet {
  readonly hidden: number;

  // WEIGHTS. These numbers ARE the network's knowledge - the only thing that
  // changes as it learns. w1[i][j] is how strongly input i pushes on hidden
  // neuron j; w2[j] is how strongly hidden neuron j pushes on the output.
  w1: number[][]; // input → hidden   (2 × hidden)
  b1: number[]; //   hidden biases   (a per-neuron nudge, like a threshold)
  w2: number[]; //   hidden → output (hidden values)
  b2: number; //     output bias

  epoch = 0; // how many full passes over the data we've done so far
  private rng: Rng;

  constructor(hidden = 4, seed = 7) {
    this.hidden = hidden;
    this.rng = makeRng(seed);
    // Start every weight at a small RANDOM number. The network begins knowing
    // nothing, so its first guesses are basically coin-flips - that's expected.
    this.w1 = [
      Array.from({ length: hidden }, () => uniform(this.rng, -1, 1)),
      Array.from({ length: hidden }, () => uniform(this.rng, -1, 1)),
    ];
    this.b1 = Array.from({ length: hidden }, () => uniform(this.rng, -1, 1));
    this.w2 = Array.from({ length: hidden }, () => uniform(this.rng, -1, 1));
    this.b2 = uniform(this.rng, -1, 1);
  }

  /**
   * FORWARD PASS - make a guess.
   * Each neuron computes  squash( inputs · weights + bias ). We do that for the
   * hidden layer, then again for the single output neuron. We keep the hidden
   * values `h` because the training step needs them.
   */
  forward(x: [number, number]): { h: number[]; out: number } {
    const h = new Array<number>(this.hidden);
    for (let j = 0; j < this.hidden; j++) {
      // hidden neuron j: weigh both inputs, add its bias, squash to 0–1
      h[j] = sigmoid(this.w1[0][j] * x[0] + this.w1[1][j] * x[1] + this.b1[j]);
    }
    // output neuron: weigh every hidden value, add bias, squash
    let sum = this.b2;
    for (let j = 0; j < this.hidden; j++) sum += this.w2[j] * h[j];
    return { h, out: sigmoid(sum) };
  }

  predict(x: [number, number]): number {
    return this.forward(x).out;
  }

  /**
   * ONE EPOCH of training = one full pass over the four XOR examples.
   *
   * Take one row - say input [0, 1], where we WANT a 1. We:
   *   1. guess it (forward pass) - maybe the network says 0.73,
   *   2. measure how wrong that was:  error = guess − want = 0.73 − 1 = −0.27
   *      (we sum error², so bigger mistakes count for far more),
   *   3. work out which way to nudge every weight to shrink that error - this is
   *      BACKPROPAGATION: start at the output and pass the "blame" backward
   *      through the network using the chain rule from calculus,
   *   4. take a small step that way. `lr` (the LEARNING RATE) is the step size:
   *      too big and we overshoot, too small and it crawls.
   *
   * (The demo lets you edit the wanted answers to make AND / OR / XOR, so
   * `inputs` and `targets` are arguments - but they default to the XOR task.)
   *
   * Returns the average error over the four examples - the number you watch fall.
   */
  trainEpoch(lr = 1, inputs = XOR_INPUTS, targets = XOR_TARGETS): number {
    let loss = 0;
    for (let i = 0; i < inputs.length; i++) {
      const x = inputs[i]; //     one input pair, e.g. [0, 1]
      const want = targets[i]; // the answer we want for it, e.g. 1

      // 1. GUESS
      const { h, out } = this.forward(x);

      // 2. MEASURE how wrong. error > 0 → guessed too high, < 0 → too low.
      const error = out - want;
      loss += error * error;

      // 3. ASSIGN BLAME (backpropagation).
      // How much the output should change: the error, scaled by how sensitive
      // the squash was here (sigmoid's slope is out·(1−out)).
      const dOut = error * out * (1 - out);
      // Pass that blame back to each hidden neuron, in proportion to how
      // strongly it was wired to the output (w2[j]).
      const dH = new Array<number>(this.hidden);
      for (let j = 0; j < this.hidden; j++) {
        dH[j] = dOut * this.w2[j] * h[j] * (1 - h[j]);
      }

      // 4. NUDGE every weight a small step DOWN the error (hence −=).
      // Output layer first: a hidden neuron that fired strongly gets a bigger nudge.
      for (let j = 0; j < this.hidden; j++) this.w2[j] -= lr * dOut * h[j];
      this.b2 -= lr * dOut;
      // Then the hidden layer, one step further back.
      for (let j = 0; j < this.hidden; j++) {
        this.w1[0][j] -= lr * dH[j] * x[0];
        this.w1[1][j] -= lr * dH[j] * x[1];
        this.b1[j] -= lr * dH[j];
      }
    }
    this.epoch++;
    return loss / inputs.length; // average error this pass
  }
}

/**
 * Sample the network's output across the whole input square [0,1]², so we can
 * paint it. Returns a `res × res` grid of outputs, row by row (top row = high b).
 */
export function decisionGrid(net: XorNet, res = 24): number[] {
  const grid = new Array<number>(res * res);
  for (let r = 0; r < res; r++) {
    for (let c = 0; c < res; c++) {
      const x0 = c / (res - 1);
      const x1 = 1 - r / (res - 1);
      grid[r * res + c] = net.predict([x0, x1]);
    }
  }
  return grid;
}
