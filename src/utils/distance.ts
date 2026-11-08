/** Euclidean masofa: d(x,y) = sqrt( Σ (xi − yi)² ). */
export function euclidean(a: readonly number[], b: readonly number[]): number {
  if (a.length !== b.length) throw new Error('Vektorlar uzunligi bir xil bo‘lishi kerak');
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2;
  return Math.sqrt(s);
}

/** Kvadrat Euclidean masofa (K-Means WCSS uchun): Σ (xi − ci)². */
export function squaredEuclidean(a: readonly number[], b: readonly number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2;
  return s;
}

/** Manhattan masofa: d(x,y) = Σ |xi − yi|. */
export function manhattan(a: readonly number[], b: readonly number[]): number {
  if (a.length !== b.length) throw new Error('Vektorlar uzunligi bir xil bo‘lishi kerak');
  let s = 0;
  for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]);
  return s;
}
