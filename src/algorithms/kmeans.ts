/**
 * K-Means klasterizatsiyasi (Lloyd algoritmi) — tashqi kutubxonasiz.
 * Har bir iteratsiya: (1) har bir nuqtani eng yaqin centroidga biriktirish,
 * (2) centroidlarni klaster nuqtalarining o‘rtachasi sifatida qayta hisoblash.
 * Konvergentsiya: centroidlar siljishi < tol yoki biriktirishlar o‘zgarmasa. maxIter cheklovi bor.
 */
import { euclidean, squaredEuclidean } from '../utils/distance';
import { mulberry32, sampleWithoutReplacement, type RNG } from '../utils/random';

export type KMeansInit = 'kmeans++' | 'random';

export interface KMeansParams {
  k: number;
  maxIter?: number;
  tol?: number;
  init?: KMeansInit;
  seed?: number;
}

export interface KMeansIteration {
  iteration: number;
  centroidsBefore: number[][];
  assignments: number[];
  centroidsAfter: number[][];
  counts: number[];
  /** yangi centroidlarga nisbatan WCSS */
  wcss: number;
  /** har bir centroid qancha siljigani */
  shift: number[];
  changedAssignments: number;
}

export interface KMeansResult {
  k: number;
  initialCentroids: number[][];
  iterations: KMeansIteration[];
  centroids: number[][];
  assignments: number[];
  wcss: number;
  converged: boolean;
}

export const MAX_ITER_LIMIT = 300;

/** Nuqtani eng yaqin centroid indeksiga biriktiradi. */
export function nearestCentroid(x: readonly number[], centroids: readonly number[][]): { index: number; distances: number[] } {
  const distances = centroids.map((c) => euclidean(x, c));
  let index = 0;
  for (let j = 1; j < distances.length; j++) if (distances[j] < distances[index]) index = j;
  return { index, distances };
}

export function assignPoints(X: readonly number[][], centroids: readonly number[][]): number[] {
  return X.map((x) => nearestCentroid(x, centroids).index);
}

/**
 * C_j = (1 / N_j) · Σ x_i. Bo‘sh klaster bo‘lsa, oldingi centroid saqlanadi.
 */
export function computeCentroids(
  X: readonly number[][],
  assignments: readonly number[],
  k: number,
  previous?: readonly number[][],
): { centroids: number[][]; counts: number[] } {
  const d = X[0]?.length ?? 0;
  const sums = Array.from({ length: k }, () => new Array(d).fill(0));
  const counts = new Array(k).fill(0);
  X.forEach((x, i) => {
    const c = assignments[i];
    counts[c]++;
    for (let j = 0; j < d; j++) sums[c][j] += x[j];
  });
  const centroids = sums.map((s, c) =>
    counts[c] === 0 ? (previous ? [...previous[c]] : new Array(d).fill(0)) : s.map((v) => v / counts[c]),
  );
  return { centroids, counts };
}

/** WCSS = Σ_j Σ_{x ∈ C_j} ||x − C_j||² */
export function computeWCSS(X: readonly number[][], assignments: readonly number[], centroids: readonly number[][]): number {
  let s = 0;
  X.forEach((x, i) => (s += squaredEuclidean(x, centroids[assignments[i]])));
  return s;
}

/** k-means++: birinchi centroid tasodifiy, keyingilari D(x)² ga proporsional ehtimol bilan. */
export function initKMeansPlusPlus(X: readonly number[][], k: number, rng: RNG): number[][] {
  const n = X.length;
  const centroids: number[][] = [[...X[Math.floor(rng() * n)]]];
  while (centroids.length < k) {
    const d2 = X.map((x) => Math.min(...centroids.map((c) => squaredEuclidean(x, c))));
    const total = d2.reduce((a, b) => a + b, 0);
    if (total === 0) {
      centroids.push([...X[Math.floor(rng() * n)]]);
      continue;
    }
    let r = rng() * total;
    let idx = 0;
    for (; idx < n - 1; idx++) {
      r -= d2[idx];
      if (r <= 0) break;
    }
    centroids.push([...X[idx]]);
  }
  return centroids;
}

export function initRandom(X: readonly number[][], k: number, rng: RNG): number[][] {
  return sampleWithoutReplacement(X.length, k, rng).map((i) => [...X[i]]);
}

export function runKMeans(X: readonly number[][], params: KMeansParams): KMeansResult {
  if (X.length === 0) throw new Error('K-Means uchun dataset bo‘sh');
  const k = Math.max(1, Math.min(Math.round(params.k), X.length));
  const maxIter = Math.max(1, Math.min(MAX_ITER_LIMIT, params.maxIter ?? 100));
  const tol = params.tol ?? 1e-6;
  const rng = mulberry32(params.seed ?? 42);
  const initial = (params.init ?? 'kmeans++') === 'kmeans++' ? initKMeansPlusPlus(X, k, rng) : initRandom(X, k, rng);

  let centroids = initial.map((c) => [...c]);
  let prevAssign: number[] | null = null;
  const iterations: KMeansIteration[] = [];
  let converged = false;

  for (let it = 1; it <= maxIter; it++) {
    const assignments = assignPoints(X, centroids);
    const { centroids: next, counts } = computeCentroids(X, assignments, k, centroids);
    const shift = next.map((c, j) => euclidean(c, centroids[j]));
    const changed = prevAssign ? assignments.reduce((a, v, i) => a + (v !== prevAssign![i] ? 1 : 0), 0) : X.length;
    iterations.push({
      iteration: it,
      centroidsBefore: centroids,
      assignments,
      centroidsAfter: next,
      counts,
      wcss: computeWCSS(X, assignments, next),
      shift,
      changedAssignments: changed,
    });
    centroids = next;
    if (Math.max(...shift) < tol || (prevAssign && changed === 0)) {
      converged = true;
      break;
    }
    prevAssign = assignments;
  }

  const last = iterations[iterations.length - 1];
  return {
    k,
    initialCentroids: initial,
    iterations,
    centroids,
    assignments: last.assignments,
    wcss: last.wcss,
    converged,
  };
}

/** Bir nechta tasodifiy boshlanishdan eng kichik WCSS li natija (n_init). */
export function runKMeansBest(X: readonly number[][], k: number, seed = 42, nInit = 5): KMeansResult {
  let best: KMeansResult | null = null;
  for (let r = 0; r < nInit; r++) {
    const res = runKMeans(X, { k, seed: seed + r * 101 });
    if (!best || res.wcss < best.wcss) best = res;
  }
  return best!;
}

/** Elbow Method: K = kMin..kMax uchun WCSS. */
export function elbowCurve(X: readonly number[][], kMin = 1, kMax = 8, seed = 42): { k: number; wcss: number }[] {
  const out: { k: number; wcss: number }[] = [];
  for (let k = kMin; k <= Math.min(kMax, X.length); k++) out.push({ k, wcss: runKMeansBest(X, k, seed).wcss });
  return out;
}
