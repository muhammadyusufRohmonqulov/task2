/**
 * Deterministik (seeded) tasodifiy sonlar generatori — Mulberry32.
 * Bir xil seed har doim bir xil ketma-ketlikni beradi, shuning uchun
 * dataset va modellar natijasi takrorlanuvchan.
 */
export type RNG = () => number;

export function mulberry32(seed: number): RNG {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Box–Muller usulida normal taqsimotdan son. */
export function randNormal(rng: RNG, mean = 0, sd = 1): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** [min, max] oralig‘idagi butun son (ikkala chegara ham kiradi). */
export function randInt(rng: RNG, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/** Poisson taqsimotidan son (Knuth algoritmi). */
export function randPoisson(rng: RNG, lambda: number): number {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= rng();
  } while (p > L && k < 100);
  return k - 1;
}

/** Fisher–Yates aralashtirish (asl massiv o‘zgarmaydi). */
export function shuffle<T>(arr: readonly T[], rng: RNG): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 0..n-1 oralig‘idan takrorlanmaydigan k ta indeks. */
export function sampleWithoutReplacement(n: number, k: number, rng: RNG): number[] {
  return shuffle(
    Array.from({ length: n }, (_, i) => i),
    rng,
  ).slice(0, Math.min(k, n));
}

export const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
export const round = (x: number, digits = 0) => {
  const f = 10 ** digits;
  return Math.round(x * f) / f;
};
