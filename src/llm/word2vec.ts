/**
 * Word2Vec (skip-gram with negative sampling) — the 2013 idea that turned words
 * into vectors that actually carry meaning.
 *
 * The intuition, straight from Firth (1957): "you shall know a word by the
 * company it keeps." So we train each word to predict the words around it. Words
 * that appear in similar company drift to similar vectors — and, famously, the
 * directions between them become meaningful: king − man + woman ≈ queen.
 *
 * The training loop is just four moves, repeated millions of times:
 *   1. slide a window over the text to get (centre, neighbour) pairs,
 *   2. PULL a word and its real neighbour together,
 *   3. PUSH a word away from a few random "negative" words,
 *   4. repeat for every pair, every epoch.
 *
 * "Negative sampling" (move 3) is the shortcut that makes it fast: instead of
 * scoring the whole vocabulary each step, we only nudge the true neighbour and a
 * handful of random words. Without it, every vector would collapse into one blob.
 */

import { makeRng, gaussian, shuffle, type Rng } from './rng';
import { pca2 } from './pca';

export interface Neighbor {
  word: string;
  score: number; // cosine similarity, −1 … +1
}

// Squash any number into 0–1 so a raw score reads like a probability ("how
// likely are these two words to be neighbours?"). Clamped so exp() never blows up.
const sigmoid = (x: number) => (x > 6 ? 1 : x < -6 ? 0 : 1 / (1 + Math.exp(-x)));

export interface Word2VecOptions {
  dim?: number; //          length of each word vector (how many dimensions)
  window?: number; //       how many words on each side count as "neighbours"
  negatives?: number; //    how many random words to push away per step
  lr?: number; //           learning rate — the size of each nudge
  seed?: number; //         fixes the randomness so runs are reproducible
  targetEpochs?: number; // used to fade the learning rate toward the end
}

export class Word2Vec {
  readonly D: number; //           vector length (dimensions)
  readonly window: number;
  readonly neg: number;
  readonly vocab: string[]; //     every distinct word, in id order
  readonly index: Map<string, number>; // word → its id
  // TWO vectors per word. Win is the "word vector" we keep and show; Wout is a
  // scratch "context vector" used only while training. Splitting them is the
  // standard skip-gram setup and makes the math behave.
  Win: number[][]; //  center vectors — these become the meaningful "word vectors"
  Wout: number[][]; // context vectors — helpers, thrown away after training
  epoch = 0;

  private pairs: [number, number][]; // every (centre, neighbour) training pair
  private negTable: number[]; //       bag of word ids to draw random negatives from
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

    // 1. Build the vocabulary: split each sentence into words and collect the
    //    distinct ones. `index` lets us go word → id (e.g. "queen" → 7).
    const tokenized = sentences.map((s) => s.toLowerCase().split(/\s+/).filter(Boolean));
    const freq = new Map<string, number>();
    for (const toks of tokenized) for (const w of toks) freq.set(w, (freq.get(w) ?? 0) + 1);
    this.vocab = [...freq.keys()];
    this.index = new Map(this.vocab.map((w, i) => [w, i]));
    const V = this.vocab.length;

    // 2. Start from noise: every word gets a small RANDOM vector (Win), and a
    //    zero context vector (Wout). Training turns this noise into meaning.
    this.Win = Array.from({ length: V }, () =>
      Array.from({ length: this.D }, () => gaussian(this.rng) * 0.1),
    );
    this.Wout = Array.from({ length: V }, () => new Array<number>(this.D).fill(0));

    // 3. Slide a window over every sentence to collect (centre, neighbour) pairs.
    //    In "the king loves the queen" with window 2, "king" pairs with "the",
    //    "loves" and "queen". These pairs are the entire training set.
    this.pairs = [];
    for (const toks of tokenized) {
      const ids = toks.map((w) => this.index.get(w)!);
      for (let i = 0; i < ids.length; i++) {
        for (let j = Math.max(0, i - this.window); j <= Math.min(ids.length - 1, i + this.window); j++) {
          if (j !== i) this.pairs.push([ids[i], ids[j]]);
        }
      }
    }

    // 4. Build a "lucky dip" for random negatives. A word is added to the bag
    //    ∝ frequency^0.75 — common words like "the" appear more often (so they're
    //    likely negatives), but the ^0.75 power stops them from dominating.
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

  // Draw one random word id from the bag, retrying so we don't accidentally pick
  // the real neighbour we're currently trying to pull closer.
  private sampleNegative(avoid: number): number {
    for (let tries = 0; tries < 10; tries++) {
      const n = this.negTable[Math.floor(this.rng() * this.negTable.length)];
      if (n !== avoid) return n;
    }
    return this.negTable[0];
  }

  /**
   * One EPOCH = one full pass over every (centre, neighbour) pair, in random
   * order. For each pair we do moves 2–3 from the top of the file. Returns the
   * average loss — the number you watch fall as the map organizes itself.
   */
  trainEpoch(): number {
    // Fade the learning rate toward the end so early epochs move boldly and
    // later ones settle down (never below 0.005).
    const lr = Math.max(0.005, this.baseLr * (1 - this.epoch / this.targetEpochs));
    const order = shuffle([...this.pairs], this.rng);
    let loss = 0;

    for (const [c, o] of order) {
      const inVec = this.Win[c]; // the centre word's vector (the one we keep)
      const gradIn = new Array<number>(this.D).fill(0); // its pending nudge

      // One POSITIVE example — the real neighbour `o`, which we want to score
      // high (label 1) — plus a few NEGATIVES, random words we want scored low.
      const targets: [number, number][] = [[o, 1]];
      for (let k = 0; k < this.neg; k++) targets.push([this.sampleNegative(o), 0]);

      for (const [t, label] of targets) {
        const outVec = this.Wout[t];
        // Score = dot product of the two vectors. Bigger when they point the same
        // way. Sigmoid turns it into a 0–1 "are these neighbours?" probability.
        let dotp = 0;
        for (let d = 0; d < this.D; d++) dotp += inVec[d] * outVec[d];
        const pred = sigmoid(dotp);
        // Error × learning rate. For a real neighbour (label 1) this is positive
        // → the two vectors get pulled together; for a negative (label 0) it's
        // negative → they get pushed apart. That's moves 2 and 3.
        const g = (label - pred) * lr;
        for (let d = 0; d < this.D; d++) {
          gradIn[d] += g * outVec[d]; // remember how to nudge the centre word
          outVec[d] += g * inVec[d]; //  nudge the context word now
        }
        loss += label ? -Math.log(pred + 1e-9) : -Math.log(1 - pred + 1e-9);
      }
      // Apply the centre word's accumulated nudge once, after all its targets.
      for (let d = 0; d < this.D; d++) inVec[d] += gradIn[d];
    }

    this.epoch++;
    return loss / order.length;
  }

  /** Look up a word's learned vector (or null if it wasn't in the corpus). */
  vector(word: string): number[] | null {
    const i = this.index.get(word.toLowerCase());
    return i === undefined ? null : this.Win[i];
  }

  /**
   * Cosine similarity: the cosine of the angle between two vectors. +1 = same
   * direction (similar meaning), 0 = perpendicular (unrelated), −1 = opposite.
   * We divide by both lengths so only DIRECTION matters, not how long the arrows
   * are. This is the score behind every "nearest" list below.
   */
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

  // Rank every word by cosine similarity to a target vector and return the top k.
  nearestToVector(v: number[], k = 5, exclude: Set<string> = new Set()): Neighbor[] {
    return this.vocab
      .map((word, i) => ({ word, score: this.cosine(v, this.Win[i]) }))
      .filter((n) => !exclude.has(n.word))
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  }

  /** The k words whose vectors point most like `word`'s (its nearest neighbours). */
  nearest(word: string, k = 5): Neighbor[] {
    const v = this.vector(word);
    if (!v) return [];
    return this.nearestToVector(v, k, new Set([word.toLowerCase()]));
  }

  /**
   * Analogy "a is to b as c is to ?". We do the arithmetic on the arrows —
   * target = b − a + c — then find the word nearest that spot. With a=man,
   * b=king, c=woman the target lands right on "queen".
   */
  analogy(a: string, b: string, c: string, k = 3): Neighbor[] {
    const va = this.vector(a);
    const vb = this.vector(b);
    const vc = this.vector(c);
    if (!va || !vb || !vc) return [];
    const target = vb.map((_, d) => vb[d] - va[d] + vc[d]);
    return this.nearestToVector(target, k, new Set([a, b, c].map((w) => w.toLowerCase())));
  }

  /**
   * Squash the D-dimensional vectors down to 2 with PCA, just so we can draw them
   * on a flat screen. The clusters are real; the exact xy positions are a
   * flattened shadow of the full space.
   */
  positions2D(): { word: string; x: number; y: number }[] {
    const pts = pca2(this.Win);
    return this.vocab.map((word, i) => ({ word, x: pts[i].x, y: pts[i].y }));
  }
}
