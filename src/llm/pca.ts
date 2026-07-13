/**
 * Just enough PCA to squash high-dimensional word vectors down to 2D so we can
 * plot them. We find the two directions of greatest variance (the top two
 * principal components) with power iteration, then project onto them.
 */

function dot(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

function normalize(v: number[]): number[] {
  const n = Math.sqrt(dot(v, v)) || 1;
  return v.map((x) => x / n);
}

/** Dominant eigenvector of a symmetric matrix via power iteration. */
function topEigenvector(cov: number[][], iters = 60): number[] {
  const d = cov.length;
  let v = normalize(Array.from({ length: d }, (_, i) => Math.sin(i + 1)));
  for (let it = 0; it < iters; it++) {
    const next = new Array<number>(d).fill(0);
    for (let i = 0; i < d; i++) {
      let s = 0;
      for (let j = 0; j < d; j++) s += cov[i][j] * v[j];
      next[i] = s;
    }
    v = normalize(next);
  }
  return v;
}

/** Project rows of `data` (n × d) onto their top-2 principal components. */
export function pca2(data: number[][]): { x: number; y: number }[] {
  const n = data.length;
  if (n === 0) return [];
  const d = data[0].length;

  // center the columns
  const mean = new Array<number>(d).fill(0);
  for (const row of data) for (let j = 0; j < d; j++) mean[j] += row[j] / n;
  const centered = data.map((row) => row.map((v, j) => v - mean[j]));

  // covariance (d × d)
  const cov: number[][] = Array.from({ length: d }, () => new Array<number>(d).fill(0));
  for (const row of centered) {
    for (let i = 0; i < d; i++) {
      for (let j = i; j < d; j++) {
        cov[i][j] += (row[i] * row[j]) / n;
      }
    }
  }
  for (let i = 0; i < d; i++) for (let j = 0; j < i; j++) cov[i][j] = cov[j][i];

  const pc1 = topEigenvector(cov);

  // Hotelling deflation: subtract λ₁·(pc1 pc1ᵀ) so the next power iteration
  // finds the SECOND-largest direction. λ₁ = pc1ᵀ·cov·pc1.
  let lambda1 = 0;
  for (let i = 0; i < d; i++) lambda1 += pc1[i] * dot(cov[i], pc1);
  for (let i = 0; i < d; i++) {
    for (let j = 0; j < d; j++) {
      cov[i][j] -= lambda1 * pc1[i] * pc1[j];
    }
  }
  const pc2 = topEigenvector(cov);

  return centered.map((row) => ({ x: dot(row, pc1), y: dot(row, pc2) }));
}
