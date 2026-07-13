/**
 * A tiny transformer — the 2017 architecture, shrunk until it trains live in
 * your browser on the Little Kingdom text.
 *
 * To keep the hand-written calculus correct AND readable, this is the smallest
 * honest version: word-level (each token is a whole word, or a period), ONE
 * causal self-attention head, a small feed-forward network, then a readout to
 * next-token probabilities. Real models stack many such blocks, run several
 * attention heads at once, use subword tokens (like the BPE ones from Ch.3), and
 * add layer-norm (we explain those in the chapter) — but the heart is exactly
 * this, and it's all here with no ML libraries.
 *
 * Forward for a sequence x₀…x_{L-1}, predicting the next char at each step:
 *   hₜ = E[xₜ] + P[t]                          (token + position embedding)
 *   qₜ,kₜ,vₜ = Wq hₜ, Wk hₜ, Wv hₜ             (queries / keys / values)
 *   scoreₜ,ₛ = (qₜ·kₛ)/√D   for s ≤ t          (causal: can't look ahead)
 *   αₜ = softmax(scoreₜ)                        (attention weights)
 *   zₜ = Σ αₜ,ₛ vₛ                              (a blend of the past)
 *   uₜ = hₜ + Wo zₜ                             (attention + residual)
 *   yₜ = uₜ + W2·relu(W1·uₜ)                    (feed-forward + residual)
 *   logitsₜ = Wl yₜ  → softmax → next char
 */

import { makeRng, gaussian, type Rng } from './rng';

const EPS = 1e-8;

/** A trainable matrix (rows × cols) carrying its own Adam optimizer state. */
class Param {
  data: Float64Array;
  grad: Float64Array;
  private m: Float64Array;
  private v: Float64Array;
  constructor(
    readonly rows: number,
    readonly cols: number,
  ) {
    const n = rows * cols;
    this.data = new Float64Array(n);
    this.grad = new Float64Array(n);
    this.m = new Float64Array(n);
    this.v = new Float64Array(n);
  }
  zeroGrad() {
    this.grad.fill(0);
  }
  adam(lr: number, t: number, b1 = 0.9, b2 = 0.999) {
    for (let i = 0; i < this.data.length; i++) {
      const g = this.grad[i];
      this.m[i] = b1 * this.m[i] + (1 - b1) * g;
      this.v[i] = b2 * this.v[i] + (1 - b2) * g * g;
      const mh = this.m[i] / (1 - Math.pow(b1, t));
      const vh = this.v[i] / (1 - Math.pow(b2, t));
      this.data[i] -= (lr * mh) / (Math.sqrt(vh) + EPS);
    }
  }
}

/** y = W·x  (W is rows×cols, x is length cols). */
function matVec(W: Param, x: Float64Array | number[]): Float64Array {
  const y = new Float64Array(W.rows);
  for (let i = 0; i < W.rows; i++) {
    let s = 0;
    const off = i * W.cols;
    for (let j = 0; j < W.cols; j++) s += W.data[off + j] * x[j];
    y[i] = s;
  }
  return y;
}

function softmax(v: number[] | Float64Array): number[] {
  let max = -Infinity;
  for (const x of v) if (x > max) max = x;
  const ex = Array.from(v, (x) => Math.exp(x - max));
  let sum = 0;
  for (const e of ex) sum += e;
  return ex.map((e) => e / sum);
}

export interface TransformerConfig {
  dim?: number;
  ffDim?: number;
  context?: number;
  lr?: number;
  seed?: number;
  batch?: number;
}

export interface ForwardCache {
  ids: number[];
  L: number;
  h: Float64Array[];
  q: Float64Array[];
  k: Float64Array[];
  v: Float64Array[];
  alpha: number[][]; // L×L lower-triangular attention weights
  z: Float64Array[];
  u: Float64Array[]; // after attention + residual
  f1: Float64Array[]; // feed-forward pre-activation (W1·u)
  act: Float64Array[]; // feed-forward hidden after ReLU
  y: Float64Array[]; // after feed-forward + residual
  probs: number[][];
}

export class TinyTransformer {
  readonly D: number;
  readonly F: number; // feed-forward hidden width
  readonly T: number;
  readonly vocab: string[];
  readonly stoi: Map<string, number>;
  readonly V: number;
  step = 0;

  private E: Param; // V×D token embeddings
  private P: Param; // T×D positional embeddings
  private Wq: Param;
  private Wk: Param;
  private Wv: Param;
  private Wo: Param;
  private W1: Param; // F×D feed-forward up-projection
  private W2: Param; // D×F feed-forward down-projection
  private Wl: Param; // V×D readout
  private params: Param[];
  private lr: number;
  private batch: number;
  private rng: Rng;
  private data: number[]; // whole corpus as char ids

  constructor(text: string, cfg: TransformerConfig = {}) {
    this.D = cfg.dim ?? 24;
    this.F = cfg.ffDim ?? this.D * 4;
    this.T = cfg.context ?? 32;
    this.lr = cfg.lr ?? 0.01;
    this.batch = cfg.batch ?? 8;
    this.rng = makeRng(cfg.seed ?? 3);

    const toks = TinyTransformer.tokenize(text);
    this.vocab = [...new Set(toks)].sort();
    this.stoi = new Map(this.vocab.map((c, i) => [c, i]));
    this.V = this.vocab.length;
    this.data = toks.map((c) => this.stoi.get(c)!);

    const { D, F, V, T } = this;
    this.E = this.init(V, D, 0.02);
    this.P = this.init(T, D, 0.02);
    this.Wq = this.xavier(D, D);
    this.Wk = this.xavier(D, D);
    this.Wv = this.xavier(D, D);
    this.Wo = this.xavier(D, D);
    this.W1 = this.xavier(F, D);
    this.W2 = this.xavier(D, F);
    this.Wl = this.init(V, D, 0.02);
    this.params = [this.E, this.P, this.Wq, this.Wk, this.Wv, this.Wo, this.W1, this.W2, this.Wl];
  }

  private init(rows: number, cols: number, scale: number): Param {
    const p = new Param(rows, cols);
    for (let i = 0; i < p.data.length; i++) p.data[i] = gaussian(this.rng) * scale;
    return p;
  }
  private xavier(rows: number, cols: number): Param {
    const p = new Param(rows, cols);
    const lim = Math.sqrt(6 / (rows + cols));
    for (let i = 0; i < p.data.length; i++) p.data[i] = (this.rng() * 2 - 1) * lim;
    return p;
  }

  /** Run the model over a sequence of ids, caching everything backprop needs. */
  forward(ids: number[]): ForwardCache {
    const L = ids.length;
    const { D, F } = this;
    const h: Float64Array[] = [];
    const q: Float64Array[] = [];
    const k: Float64Array[] = [];
    const v: Float64Array[] = [];
    for (let t = 0; t < L; t++) {
      const ht = new Float64Array(D);
      const eOff = ids[t] * D;
      const pOff = t * D;
      for (let d = 0; d < D; d++) ht[d] = this.E.data[eOff + d] + this.P.data[pOff + d];
      h.push(ht);
      q.push(matVec(this.Wq, ht));
      k.push(matVec(this.Wk, ht));
      v.push(matVec(this.Wv, ht));
    }

    const scale = 1 / Math.sqrt(D);
    const alpha: number[][] = [];
    const z: Float64Array[] = [];
    const u: Float64Array[] = [];
    const f1: Float64Array[] = [];
    const act: Float64Array[] = [];
    const y: Float64Array[] = [];
    const probs: number[][] = [];

    for (let t = 0; t < L; t++) {
      // --- self-attention (causal) ---
      const scores: number[] = [];
      for (let s = 0; s <= t; s++) {
        let dot = 0;
        for (let d = 0; d < D; d++) dot += q[t][d] * k[s][d];
        scores.push(dot * scale);
      }
      const a = softmax(scores);
      alpha.push(a);

      const zt = new Float64Array(D);
      for (let s = 0; s <= t; s++) for (let d = 0; d < D; d++) zt[d] += a[s] * v[s][d];
      z.push(zt);

      const ot = matVec(this.Wo, zt);
      const ut = new Float64Array(D);
      for (let d = 0; d < D; d++) ut[d] = h[t][d] + ot[d]; // residual around attention
      u.push(ut);

      // --- feed-forward: expand → ReLU → compress, with a residual ---
      const f1t = matVec(this.W1, ut); // length F
      const at = new Float64Array(F);
      for (let f = 0; f < F; f++) at[f] = f1t[f] > 0 ? f1t[f] : 0; // ReLU
      const f2t = matVec(this.W2, at); // length D
      const yt = new Float64Array(D);
      for (let d = 0; d < D; d++) yt[d] = ut[d] + f2t[d]; // residual around FFN
      f1.push(f1t);
      act.push(at);
      y.push(yt);

      probs.push(softmax(matVec(this.Wl, yt)));
    }

    return { ids, L, h, q, k, v, alpha, z, u, f1, act, y, probs };
  }

  /** Cross-entropy of predicting the next char at every position. */
  private lossFrom(cache: ForwardCache): number {
    let loss = 0;
    for (let t = 0; t < cache.L - 1; t++) {
      const target = cache.ids[t + 1];
      loss += -Math.log(cache.probs[t][target] + EPS);
    }
    return loss / Math.max(1, cache.L - 1);
  }

  /** Backprop the hand-derived gradients for one sequence into every param. */
  private backward(cache: ForwardCache) {
    const { D, F, V } = this;
    const { L, ids, h, q, k, v, alpha, z, u, f1, act, y } = cache;
    const scale = 1 / Math.sqrt(D);

    // gradient accumulators for the per-position vectors
    const dh = Array.from({ length: L }, () => new Float64Array(D));
    const dq = Array.from({ length: L }, () => new Float64Array(D));
    const dk = Array.from({ length: L }, () => new Float64Array(D));
    const dv = Array.from({ length: L }, () => new Float64Array(D));

    const n = Math.max(1, L - 1);

    for (let t = 0; t < L - 1; t++) {
      const target = ids[t + 1];

      // dLoss/dlogits = (softmax - onehot) / n
      const dlogits = new Float64Array(V);
      for (let c = 0; c < V; c++) dlogits[c] = cache.probs[t][c] / n;
      dlogits[target] -= 1 / n;

      // readout: logits = Wl y  → grad and dy
      const dy = new Float64Array(D);
      for (let c = 0; c < V; c++) {
        const g = dlogits[c];
        const off = c * D;
        for (let d = 0; d < D; d++) {
          this.Wl.grad[off + d] += g * y[t][d];
          dy[d] += g * this.Wl.data[off + d];
        }
      }

      // feed-forward: y = u + W2·relu(W1·u)
      const du = new Float64Array(D);
      for (let d = 0; d < D; d++) du[d] += dy[d]; // residual straight-through
      // f2 = W2 act  → grad W2, and dact
      const dact = new Float64Array(F);
      for (let i = 0; i < D; i++) {
        const off = i * F;
        const g = dy[i];
        for (let j = 0; j < F; j++) {
          this.W2.grad[off + j] += g * act[t][j];
          dact[j] += g * this.W2.data[off + j];
        }
      }
      // relu: df1 = dact where f1 > 0
      const df1 = new Float64Array(F);
      for (let j = 0; j < F; j++) df1[j] = f1[t][j] > 0 ? dact[j] : 0;
      // f1 = W1 u  → grad W1, and add into du
      for (let i = 0; i < F; i++) {
        const g = df1[i];
        if (g === 0) continue;
        const off = i * D;
        for (let j = 0; j < D; j++) {
          this.W1.grad[off + j] += g * u[t][j];
          du[j] += g * this.W1.data[off + j];
        }
      }

      // u = h + Wo z  → residual sends du into dh[t]; the rest into z via Wo
      for (let d = 0; d < D; d++) dh[t][d] += du[d];
      const dz = new Float64Array(D);
      for (let i = 0; i < D; i++) {
        const off = i * D;
        const g = du[i];
        for (let j = 0; j < D; j++) {
          this.Wo.grad[off + j] += g * z[t][j];
          dz[j] += g * this.Wo.data[off + j];
        }
      }

      // z = Σ α v  → grads to v and to α
      const a = alpha[t];
      const dAlpha = new Float64Array(t + 1);
      for (let s = 0; s <= t; s++) {
        let da = 0;
        for (let d = 0; d < D; d++) {
          dv[s][d] += a[s] * dz[d];
          da += dz[d] * v[s][d];
        }
        dAlpha[s] = da;
      }

      // softmax backward: dscore_s = α_s (dα_s - Σ α_{s'} dα_{s'})
      let dot = 0;
      for (let s = 0; s <= t; s++) dot += a[s] * dAlpha[s];
      const dScore = new Float64Array(t + 1);
      for (let s = 0; s <= t; s++) dScore[s] = a[s] * (dAlpha[s] - dot);

      // score_{t,s} = (q_t·k_s) * scale
      for (let s = 0; s <= t; s++) {
        const g = dScore[s] * scale;
        for (let d = 0; d < D; d++) {
          dq[t][d] += g * k[s][d];
          dk[s][d] += g * q[t][d];
        }
      }
    }

    // q,k,v = W·h  → grads to the W matrices and back into dh
    const accumLinear = (W: Param, dOut: Float64Array[], pos: number, hh: Float64Array[]) => {
      for (let i = 0; i < D; i++) {
        const off = i * D;
        const g = dOut[pos][i];
        if (g === 0) continue;
        for (let j = 0; j < D; j++) {
          W.grad[off + j] += g * hh[pos][j];
          dh[pos][j] += g * W.data[off + j];
        }
      }
    };
    for (let t = 0; t < L; t++) {
      accumLinear(this.Wq, dq, t, h);
      accumLinear(this.Wk, dk, t, h);
      accumLinear(this.Wv, dv, t, h);
    }

    // h = E[id] + P[t]
    for (let t = 0; t < L; t++) {
      const eOff = ids[t] * D;
      const pOff = t * D;
      for (let d = 0; d < D; d++) {
        this.E.grad[eOff + d] += dh[t][d];
        this.P.grad[pOff + d] += dh[t][d];
      }
    }
  }

  /**
   * One training step. We average over a small BATCH of random windows before
   * nudging the weights — a single window is far too noisy to learn from, so we
   * accumulate gradients across a handful and take one Adam step. Returns the
   * average loss over the batch (the smooth number you watch fall).
   */
  trainStep(): number {
    const L = this.T;
    for (const p of this.params) p.zeroGrad();
    let loss = 0;
    for (let b = 0; b < this.batch; b++) {
      const start = Math.floor(this.rng() * (this.data.length - L - 1));
      const ids = this.data.slice(start, start + L);
      const cache = this.forward(ids);
      loss += this.lossFrom(cache);
      this.backward(cache); // gradients accumulate across the batch
    }
    this.step++;
    for (const p of this.params) p.adam(this.lr, this.step); // Adam is scale-invariant, so summed grads are fine
    return loss / this.batch;
  }

  /** Split text into tokens: whole words and standalone periods. */
  static tokenize(text: string): string[] {
    return text.toLowerCase().match(/[a-z]+|\./g) ?? [];
  }

  private encode(text: string): number[] {
    // keep only words the model actually knows (drop out-of-story words)
    return TinyTransformer.tokenize(text)
      .map((c) => this.stoi.get(c))
      .filter((i): i is number => i !== undefined);
  }

  /** Join token ids back into readable text (no space before a period). */
  private detok(ids: number[]): string {
    let s = '';
    for (const id of ids) {
      const w = this.vocab[id];
      s += w === '.' ? '.' : (s.length ? ' ' : '') + w;
    }
    return s;
  }

  /** Attention weights for a prompt (for the heatmap): rows attend to columns. */
  attentionFor(text: string): { tokens: string[]; alpha: number[][] } {
    const ids = this.encode(text).slice(-this.T);
    const cache = this.forward(ids);
    return { tokens: ids.map((i) => this.vocab[i]), alpha: cache.alpha };
  }

  /** The model's probability distribution for the very next character. */
  nextDistribution(text: string): { char: string; p: number }[] {
    const ids = this.encode(text).slice(-this.T);
    const cache = this.forward(ids);
    const last = cache.probs[cache.probs.length - 1];
    return this.vocab.map((char, i) => ({ char, p: last[i] }));
  }

  /**
   * Autoregressive generation with temperature + nucleus (top-p) sampling.
   * Returns the detokenized prompt (so the UI can highlight it) and the full text.
   */
  generate(prompt: string, length = 40, temperature = 0.8, topP = 0.9): { prompt: string; text: string } {
    const promptIds = this.encode(prompt);
    const ids = promptIds.slice();
    if (ids.length === 0) ids.push(0);

    for (let i = 0; i < length; i++) {
      const ctx = ids.slice(-this.T);
      const cache = this.forward(ctx);
      const logits = cache.probs[cache.probs.length - 1].map((p) => Math.log(p + EPS) / temperature);
      const probs = softmax(logits);

      // nucleus sampling: keep the smallest set of tokens whose mass ≥ topP
      const ranked = probs.map((p, idx) => ({ p, idx })).sort((a, b) => b.p - a.p);
      let cum = 0;
      const keep: { p: number; idx: number }[] = [];
      for (const r of ranked) {
        keep.push(r);
        cum += r.p;
        if (cum >= topP) break;
      }
      let r = this.rng() * keep.reduce((s, x) => s + x.p, 0);
      let chosen = keep[keep.length - 1].idx;
      for (const item of keep) {
        r -= item.p;
        if (r <= 0) {
          chosen = item.idx;
          break;
        }
      }
      ids.push(chosen);
    }
    return { prompt: this.detok(promptIds), text: this.detok(ids) };
  }
}
