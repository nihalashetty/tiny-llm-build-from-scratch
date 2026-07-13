/**
 * Word2Vec (skip-gram with negative sampling) — the 2013 idea that turned words
 * into vectors that actually carry meaning.
 *
 * The intuition, straight from Firth (1957): "you shall know a word by the
 * company it keeps." So we train a word to predict its neighbours. Words that
 * appear in similar company drift to similar vectors — and, famously, the
 * directions between them become meaningful: king − man + woman ≈ queen.
 *
 * "Negative sampling" is the shortcut that makes it fast: instead of scoring the
 * whole vocabulary each step, we push the true neighbour together and shove a
 * handful of random words apart.
 */

import { makeRng, gaussian, shuffle, type Rng } from './rng';
import { pca2 } from './pca';

export interface Neighbor {
  word: string;
  score: number;
}

const sigmoid = (x: number) => (x > 6 ? 1 : x < -6 ? 0 : 1 / (1 + Math.exp(-x)));

export interface Word2VecOptions {
  dim?: number;
  window?: number;
  negatives?: number;
  lr?: number;
  seed?: number;
  targetEpochs?: number;
}

export class Word2Vec {
  readonly D: number;
  readonly window: number;
  readonly neg: number;
  readonly vocab: string[];
  readonly index: Map<string, number>;
  Win: number[][]; // center vectors — these become the "word vectors"
  Wout: number[][]; // context vectors
  epoch = 0;

  private pairs: [number, number][];
  private negTable: number[];
  private rng: Rng;
  private baseLr: number;
  private targetEpochs: number;

  constructor(sentences: string[], opts: Word2VecOptions = {}) {
    this.D = opts.dim ?? 16;
    this.window = opts.window ?? 2;
    this.neg = opts.negatives ?? 5;
    this.baseLr = opts.lr ?? 0.05;
    this.targetEpochs = opts.targetEpochs ?? 400;
    this.rng = makeRng(opts.seed ?? 1);

    // build vocabulary
    const tokenized = sentences.map((s) => s.toLowerCase().split(/\s+/).filter(Boolean));
    const freq = new Map<string, number>();
    for (const toks of tokenized) for (const w of toks) freq.set(w, (freq.get(w) ?? 0) + 1);
    this.vocab = [...freq.keys()];
    this.index = new Map(this.vocab.map((w, i) => [w, i]));
    const V = this.vocab.length;

    // init: center vectors small-random, context vectors zero (standard SGNS)
    this.Win = Array.from({ length: V }, () =>
      Array.from({ length: this.D }, () => gaussian(this.rng) * 0.1),
    );
    this.Wout = Array.from({ length: V }, () => new Array<number>(this.D).fill(0));

    // (center, context) training pairs from a sliding window
    this.pairs = [];
    for (const toks of tokenized) {
      const ids = toks.map((w) => this.index.get(w)!);
      for (let i = 0; i < ids.length; i++) {
        for (let j = Math.max(0, i - this.window); j <= Math.min(ids.length - 1, i + this.window); j++) {
          if (j !== i) this.pairs.push([ids[i], ids[j]]);
        }
      }
    }

    // negative-sampling table ∝ frequency^0.75
    this.negTable = [];
    const power = 0.75;
    const weights = this.vocab.map((w) => Math.pow(freq.get(w)!, power));
    const total = weights.reduce((a, b) => a + b, 0);
    const TABLE = 2000;
    for (let i = 0; i < V; i++) {
      const n = Math.max(1, Math.round((weights[i] / total) * TABLE));
      for (let k = 0; k < n; k++) this.negTable.push(i);
    }
  }

  private sampleNegative(avoid: number): number {
    for (let tries = 0; tries < 10; tries++) {
      const n = this.negTable[Math.floor(this.rng() * this.negTable.length)];
      if (n !== avoid) return n;
    }
    return this.negTable[0];
  }

  /** One full pass over the shuffled pairs. Returns average loss. */
  trainEpoch(): number {
    const lr = Math.max(0.005, this.baseLr * (1 - this.epoch / this.targetEpochs));
    const order = shuffle([...this.pairs], this.rng);
    let loss = 0;

    for (const [c, o] of order) {
      const inVec = this.Win[c];
      const gradIn = new Array<number>(this.D).fill(0);

      // one positive sample (label 1) + `neg` negatives (label 0)
      const targets: [number, number][] = [[o, 1]];
      for (let k = 0; k < this.neg; k++) targets.push([this.sampleNegative(o), 0]);

      for (const [t, label] of targets) {
        const outVec = this.Wout[t];
        let dotp = 0;
        for (let d = 0; d < this.D; d++) dotp += inVec[d] * outVec[d];
        const pred = sigmoid(dotp);
        const g = (label - pred) * lr;
        for (let d = 0; d < this.D; d++) {
          gradIn[d] += g * outVec[d];
          outVec[d] += g * inVec[d];
        }
        loss += label ? -Math.log(pred + 1e-9) : -Math.log(1 - pred + 1e-9);
      }
      for (let d = 0; d < this.D; d++) inVec[d] += gradIn[d];
    }

    this.epoch++;
    return loss / order.length;
  }

  vector(word: string): number[] | null {
    const i = this.index.get(word.toLowerCase());
    return i === undefined ? null : this.Win[i];
  }

  cosine(a: number[], b: number[]): number {
    let dot = 0;
    let na = 0;
    let nb = 0;
    for (let d = 0; d < a.length; d++) {
      dot += a[d] * b[d];
      na += a[d] * a[d];
      nb += b[d] * b[d];
    }
    return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-9);
  }

  nearestToVector(v: number[], k = 5, exclude: Set<string> = new Set()): Neighbor[] {
    return this.vocab
      .map((word, i) => ({ word, score: this.cosine(v, this.Win[i]) }))
      .filter((n) => !exclude.has(n.word))
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  }

  nearest(word: string, k = 5): Neighbor[] {
    const v = this.vector(word);
    if (!v) return [];
    return this.nearestToVector(v, k, new Set([word.toLowerCase()]));
  }

  /** "a is to b as c is to ?"  →  b − a + c */
  analogy(a: string, b: string, c: string, k = 3): Neighbor[] {
    const va = this.vector(a);
    const vb = this.vector(b);
    const vc = this.vector(c);
    if (!va || !vb || !vc) return [];
    const target = vb.map((_, d) => vb[d] - va[d] + vc[d]);
    return this.nearestToVector(target, k, new Set([a, b, c].map((w) => w.toLowerCase())));
  }

  /** 2D PCA projection of the word vectors, for the scatter plot. */
  positions2D(): { word: string; x: number; y: number }[] {
    const pts = pca2(this.Win);
    return this.vocab.map((word, i) => ({ word, x: pts[i].x, y: pts[i].y }));
  }
}
