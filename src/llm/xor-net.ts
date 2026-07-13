/**
 * A neural network that learns XOR — the problem that froze the field for
 * seventeen years, solved by adding ONE hidden layer and training with
 * backpropagation (Rumelhart, Hinton & Williams, 1986).
 *
 * Shape: 2 inputs → 4 hidden neurons → 1 output, all sigmoid.
 * The hidden layer bends the input space until "same" and "different" become
 * separable by the final neuron. There are no ML libraries here — just loops
 * and the chain rule, written out so you can read every step.
 */

import { makeRng, uniform, type Rng } from './rng';
import { INPUTS, XOR_DATA, type Sample } from './perceptron';

export { INPUTS, XOR_DATA };

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

export class XorNet {
  readonly hidden: number;
  /** input→hidden weights [2][H] and biases [H] */
  w1: number[][];
  b1: number[];
  /** hidden→output weights [H] and bias */
  w2: number[];
  b2: number;
  epoch = 0;
  private rng: Rng;

  constructor(hidden = 4, seed = 7) {
    this.hidden = hidden;
    this.rng = makeRng(seed);
    this.w1 = [
      Array.from({ length: hidden }, () => uniform(this.rng, -1, 1)),
      Array.from({ length: hidden }, () => uniform(this.rng, -1, 1)),
    ];
    this.b1 = Array.from({ length: hidden }, () => uniform(this.rng, -1, 1));
    this.w2 = Array.from({ length: hidden }, () => uniform(this.rng, -1, 1));
    this.b2 = uniform(this.rng, -1, 1);
  }

  /** Run the network forward, keeping the hidden activations for backprop. */
  forward(x: [number, number]): { h: number[]; out: number } {
    const h = new Array<number>(this.hidden);
    for (let j = 0; j < this.hidden; j++) {
      h[j] = sigmoid(this.w1[0][j] * x[0] + this.w1[1][j] * x[1] + this.b1[j]);
    }
    let sum = this.b2;
    for (let j = 0; j < this.hidden; j++) sum += this.w2[j] * h[j];
    return { h, out: sigmoid(sum) };
  }

  predict(x: [number, number]): number {
    return this.forward(x).out;
  }

  /** One epoch of online backprop over the given examples (XOR by default). */
  trainEpoch(lr = 1, data: Sample[] = XOR_DATA): number {
    let loss = 0;
    for (const { x, y } of data) {
      const { h, out } = this.forward(x);
      const err = out - y;
      loss += err * err;

      // output neuron gradient
      const dOut = err * out * (1 - out);

      // hidden neuron gradients (chain rule back through w2)
      const dH = new Array<number>(this.hidden);
      for (let j = 0; j < this.hidden; j++) {
        dH[j] = dOut * this.w2[j] * h[j] * (1 - h[j]);
      }

      // update output layer
      for (let j = 0; j < this.hidden; j++) this.w2[j] -= lr * dOut * h[j];
      this.b2 -= lr * dOut;

      // update hidden layer
      for (let j = 0; j < this.hidden; j++) {
        this.w1[0][j] -= lr * dH[j] * x[0];
        this.w1[1][j] -= lr * dH[j] * x[1];
        this.b1[j] -= lr * dH[j];
      }
    }
    this.epoch++;
    return loss / data.length;
  }
}

/**
 * Sample the network's output across the input square [0,1]², for drawing the
 * decision surface. Returns a `res × res` grid of outputs in row-major order.
 */
export function decisionGrid(net: XorNet, res = 24): number[] {
  const grid = new Array<number>(res * res);
  for (let r = 0; r < res; r++) {
    for (let c = 0; c < res; c++) {
      const x0 = c / (res - 1);
      const x1 = 1 - r / (res - 1); // row 0 = top = x1 high
      grid[r * res + c] = net.predict([x0, x1]);
    }
  }
  return grid;
}
