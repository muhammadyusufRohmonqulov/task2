import type { ScalingMethod } from '../types';
import { mean, std } from './statistics';
import { mulberry32, shuffle } from './random';

export type Scaler =
  | { method: 'zscore'; mean: number[]; std: number[] }
  | { method: 'minmax'; min: number[]; max: number[] }
  | { method: 'none'; dims: number };

const column = (X: readonly number[][], j: number) => X.map((r) => r[j]);

/**
 * Scalerni FAQAT training ma’lumotlari asosida o‘rgatadi (fit).
 * Keyin aynan shu parametrlar test va yangi mijozga qo‘llanadi — data leakage yo‘q.
 */
export function fitScaler(X: readonly number[][], method: ScalingMethod): Scaler {
  if (X.length === 0) throw new Error('Bo‘sh dataset uchun scaler o‘rgatib bo‘lmaydi');
  const d = X[0].length;
  if (method === 'none') return { method, dims: d };
  if (method === 'zscore') {
    const mu: number[] = [];
    const sd: number[] = [];
    for (let j = 0; j < d; j++) {
      const c = column(X, j);
      mu.push(mean(c));
      sd.push(std(c));
    }
    return { method, mean: mu, std: sd };
  }
  const mn: number[] = [];
  const mx: number[] = [];
  for (let j = 0; j < d; j++) {
    const c = column(X, j);
    mn.push(Math.min(...c));
    mx.push(Math.max(...c));
  }
  return { method, min: mn, max: mx };
}

/** Z-score: z = (x − μ) / σ. σ = 0 bo‘lsa nolga bo‘lish oldini olinadi. */
export function zScore(x: number, mu: number, sigma: number): number {
  return sigma === 0 ? 0 : (x - mu) / sigma;
}

/** Min-Max: x' = (x − min) / (max − min). */
export function minMax(x: number, lo: number, hi: number): number {
  return hi === lo ? 0 : (x - lo) / (hi - lo);
}

export function transformRow(s: Scaler, x: readonly number[]): number[] {
  switch (s.method) {
    case 'zscore':
      return x.map((v, j) => zScore(v, s.mean[j], s.std[j]));
    case 'minmax':
      return x.map((v, j) => minMax(v, s.min[j], s.max[j]));
    default:
      return x.slice();
  }
}

export function transform(s: Scaler, X: readonly number[][]): number[][] {
  return X.map((r) => transformRow(s, r));
}

export function inverseRow(s: Scaler, z: readonly number[]): number[] {
  switch (s.method) {
    case 'zscore':
      return z.map((v, j) => (s.std[j] === 0 ? s.mean[j] : v * s.std[j] + s.mean[j]));
    case 'minmax':
      return z.map((v, j) => v * (s.max[j] - s.min[j]) + s.min[j]);
    default:
      return z.slice();
  }
}

/**
 * Stratified train/test split: har bir sinf alohida aralashtiriladi va
 * bir xil ulushda bo‘linadi, shuning uchun sinflar nisbati ikkala qismda saqlanadi.
 */
export function stratifiedSplit(
  y: readonly number[],
  testRatio = 0.2,
  seed = 42,
): { train: number[]; test: number[] } {
  const rng = mulberry32(seed);
  const classes = Array.from(new Set(y)).sort((a, b) => a - b);
  const train: number[] = [];
  const test: number[] = [];
  for (const c of classes) {
    const idx = shuffle(
      y.map((v, i) => (v === c ? i : -1)).filter((i) => i >= 0),
      rng,
    );
    const nTest = Math.round(idx.length * testRatio);
    test.push(...idx.slice(0, nTest));
    train.push(...idx.slice(nTest));
  }
  return { train: train.sort((a, b) => a - b), test: test.sort((a, b) => a - b) };
}
