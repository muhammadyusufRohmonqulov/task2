/** Asosiy statistik funksiyalar. Bo‘sh massivlar uchun 0 qaytariladi (NaN emas). */
export function sum(xs: readonly number[]): number {
  let s = 0;
  for (const x of xs) s += x;
  return s;
}

export function mean(xs: readonly number[]): number {
  return xs.length === 0 ? 0 : sum(xs) / xs.length;
}

/**
 * Standart og‘ish. Default — populyatsiya (σ, N ga bo‘linadi), bu
 * scikit-learn StandardScaler bilan bir xil.
 */
export function std(xs: readonly number[], sample = false): number {
  const n = xs.length;
  if (n === 0 || (sample && n < 2)) return 0;
  const m = mean(xs);
  let s = 0;
  for (const x of xs) s += (x - m) ** 2;
  return Math.sqrt(s / (sample ? n - 1 : n));
}

export function min(xs: readonly number[]): number {
  let m = Infinity;
  for (const x of xs) if (x < m) m = x;
  return xs.length === 0 ? 0 : m;
}

export function max(xs: readonly number[]): number {
  let m = -Infinity;
  for (const x of xs) if (x > m) m = x;
  return xs.length === 0 ? 0 : m;
}

export function median(xs: readonly number[]): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export interface Summary {
  mean: number;
  std: number;
  min: number;
  max: number;
  median: number;
}

export function describe(xs: readonly number[]): Summary {
  return { mean: mean(xs), std: std(xs), min: min(xs), max: max(xs), median: median(xs) };
}
