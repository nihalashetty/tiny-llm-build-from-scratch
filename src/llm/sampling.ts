/**
 * How a model turns a pile of scores ("logits") into an actual next-token
 * choice. These four little functions are the last mechanism in the whole
 * pipeline, and the knobs (temperature, top-p) you may have seen in an API.
 */

/**
 * Softmax with temperature. Dividing the logits by the temperature before the
 * exponential controls how "peaky" the result is:
 *   • low temp (→0)  → almost all probability on the single top choice (safe)
 *   • temp = 1       → the raw distribution
 *   • high temp (>1) → flattened, adventurous, more surprising
 */
export function softmaxT(logits: number[], temperature: number): number[] {
  const t = Math.max(1e-6, temperature);
  const scaled = logits.map((l) => l / t);
  const max = Math.max(...scaled);
  const ex = scaled.map((l) => Math.exp(l - max));
  const sum = ex.reduce((a, b) => a + b, 0);
  return ex.map((e) => e / sum);
}

/**
 * Nucleus (top-p) filtering: keep the smallest set of tokens whose probabilities
 * add up to at least `p`, zero out the rest, and renormalize. This trims the
 * long tail of unlikely (often nonsensical) tokens while staying flexible.
 */
export function topP(probs: number[], p: number): number[] {
  const ranked = probs.map((prob, i) => ({ prob, i })).sort((a, b) => b.prob - a.prob);
  const keep = new Set<number>();
  let cum = 0;
  for (const r of ranked) {
    keep.add(r.i);
    cum += r.prob;
    if (cum >= p) break;
  }
  const masked = probs.map((prob, i) => (keep.has(i) ? prob : 0));
  const sum = masked.reduce((a, b) => a + b, 0) || 1;
  return masked.map((m) => m / sum);
}

/** Top-k filtering: keep only the k most likely tokens, renormalize. */
export function topK(probs: number[], k: number): number[] {
  const cutoff = [...probs].sort((a, b) => b - a)[Math.min(k, probs.length) - 1] ?? 0;
  const masked = probs.map((prob) => (prob >= cutoff ? prob : 0));
  const sum = masked.reduce((a, b) => a + b, 0) || 1;
  return masked.map((m) => m / sum);
}

/** Draw one index from a probability distribution. */
export function sample(probs: number[], rng: () => number = Math.random): number {
  let r = rng();
  for (let i = 0; i < probs.length; i++) {
    r -= probs[i];
    if (r <= 0) return i;
  }
  return probs.length - 1;
}
