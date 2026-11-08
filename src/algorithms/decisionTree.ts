/**
 * CART uslubidagi Decision Tree klassifikatori (binar ajratishlar, Gini yoki Entropy).
 * Tashqi kutubxonasiz, to‘liq TypeScript implementatsiya.
 *
 * Shart: x[feature] <= threshold → chap shox (Ha / True), aks holda o‘ng shox (Yo‘q / False).
 */
import type { Criterion, Label } from '../types';
import { sampleWithoutReplacement, type RNG } from '../utils/random';

export interface TreeParams {
  maxDepth: number;
  minSamplesSplit: number;
  minSamplesLeaf: number;
  criterion: Criterion;
  /** Har bir tugunda ko‘rib chiqiladigan xususiyatlar soni (Random Forest uchun). Bo‘lmasa — hammasi. */
  maxFeatures?: number;
  rng?: RNG;
}

export interface SplitCandidate {
  feature: number;
  threshold: number;
  nLeft: number;
  nRight: number;
  countsLeft: [number, number];
  countsRight: [number, number];
  impurityLeft: number;
  impurityRight: number;
  /** (N_left/N)·I_left + (N_right/N)·I_right */
  weighted: number;
  /** I_parent − weighted */
  gain: number;
}

export type StopReason = 'pure' | 'maxDepth' | 'minSamplesSplit' | 'noValidSplit' | 'noGain';

export interface TreeNode {
  id: number;
  depth: number;
  /** tugunga kelgan training yozuvlari indekslari (bootstrapda takrorlanishi mumkin) */
  indices: number[];
  samples: number;
  counts: [number, number];
  impurity: number;
  prediction: Label;
  /** P(1) = counts[1] / samples */
  probability: number;
  isLeaf: boolean;
  stopReason?: StopReason;
  split?: SplitCandidate;
  /** har bir ko‘rib chiqilgan xususiyat bo‘yicha eng yaxshi split (tushuntirish uchun) */
  bestPerFeature: SplitCandidate[];
  featuresConsidered: number[];
  left?: TreeNode;
  right?: TreeNode;
}

export const MAX_DEPTH_LIMIT = 15;

export function gini(counts: readonly number[]): number {
  const n = counts.reduce((a, b) => a + b, 0);
  if (n === 0) return 0;
  let s = 0;
  for (const c of counts) s += (c / n) ** 2;
  return 1 - s;
}

export function entropy(counts: readonly number[]): number {
  const n = counts.reduce((a, b) => a + b, 0);
  if (n === 0) return 0;
  let h = 0;
  for (const c of counts) {
    if (c === 0) continue;
    const p = c / n;
    h -= p * Math.log2(p);
  }
  return h;
}

export const impurity = (counts: readonly number[], criterion: Criterion) =>
  criterion === 'gini' ? gini(counts) : entropy(counts);

export function classCounts(y: readonly number[], idx: readonly number[]): [number, number] {
  const c: [number, number] = [0, 0];
  for (const i of idx) c[y[i]]++;
  return c;
}

/**
 * Bitta xususiyat bo‘yicha BARCHA nomzod thresholdlarni baholaydi.
 * Thresholdlar — tartiblangan qo‘shni noyob qiymatlar o‘rtasi.
 */
export function evaluateFeatureSplits(
  X: readonly number[][],
  y: readonly number[],
  idx: readonly number[],
  feature: number,
  criterion: Criterion,
  minSamplesLeaf = 1,
): SplitCandidate[] {
  const n = idx.length;
  if (n < 2) return [];
  const sorted = [...idx].sort((a, b) => X[a][feature] - X[b][feature]);
  const total = classCounts(y, idx);
  const parentImp = impurity(total, criterion);
  const left: [number, number] = [0, 0];
  const out: SplitCandidate[] = [];
  for (let p = 0; p < n - 1; p++) {
    left[y[sorted[p]]]++;
    const v = X[sorted[p]][feature];
    const vNext = X[sorted[p + 1]][feature];
    if (v === vNext) continue;
    const nL = p + 1;
    const nR = n - nL;
    if (nL < minSamplesLeaf || nR < minSamplesLeaf) continue;
    const cL: [number, number] = [left[0], left[1]];
    const cR: [number, number] = [total[0] - left[0], total[1] - left[1]];
    const iL = impurity(cL, criterion);
    const iR = impurity(cR, criterion);
    const weighted = (nL / n) * iL + (nR / n) * iR;
    out.push({
      feature,
      threshold: (v + vNext) / 2,
      nLeft: nL,
      nRight: nR,
      countsLeft: cL,
      countsRight: cR,
      impurityLeft: iL,
      impurityRight: iR,
      weighted,
      gain: parentImp - weighted,
    });
  }
  return out;
}

export function findBestSplit(
  X: readonly number[][],
  y: readonly number[],
  idx: readonly number[],
  features: readonly number[],
  criterion: Criterion,
  minSamplesLeaf: number,
): { best: SplitCandidate | null; bestPerFeature: SplitCandidate[] } {
  let best: SplitCandidate | null = null;
  const bestPerFeature: SplitCandidate[] = [];
  for (const f of features) {
    const cands = evaluateFeatureSplits(X, y, idx, f, criterion, minSamplesLeaf);
    let fb: SplitCandidate | null = null;
    for (const c of cands) if (!fb || c.gain > fb.gain + 1e-12) fb = c;
    if (fb) {
      bestPerFeature.push(fb);
      if (!best || fb.gain > best.gain + 1e-12) best = fb;
    }
  }
  return { best, bestPerFeature: bestPerFeature.sort((a, b) => b.gain - a.gain) };
}

/** Daraxtni quradi. `indices` berilmasa — barcha qatorlar (bootstrap uchun takrorlanishi mumkin). */
export function buildTree(
  X: readonly number[][],
  y: readonly Label[],
  params: TreeParams,
  indices?: number[],
): TreeNode {
  if (X.length === 0) throw new Error('Decision Tree uchun dataset bo‘sh');
  const nFeat = X[0].length;
  const maxDepth = Math.max(0, Math.min(MAX_DEPTH_LIMIT, Math.floor(params.maxDepth)));
  const minSplit = Math.max(2, Math.floor(params.minSamplesSplit));
  const minLeaf = Math.max(1, Math.floor(params.minSamplesLeaf));
  const mf = params.maxFeatures ? Math.max(1, Math.min(nFeat, params.maxFeatures)) : nFeat;
  let nextId = 0;

  const grow = (idx: number[], depth: number): TreeNode => {
    const counts = classCounts(y, idx);
    const samples = idx.length;
    const imp = impurity(counts, params.criterion);
    const node: TreeNode = {
      id: nextId++,
      depth,
      indices: idx,
      samples,
      counts,
      impurity: imp,
      // tenglikda bank xavfni kamaytirish uchun 1 (muammoli) deb belgilanadi
      prediction: counts[1] >= counts[0] ? 1 : 0,
      probability: samples === 0 ? 0 : counts[1] / samples,
      isLeaf: true,
      bestPerFeature: [],
      featuresConsidered: [],
    };

    if (imp <= 1e-12) return { ...node, stopReason: 'pure' };
    if (depth >= maxDepth) return { ...node, stopReason: 'maxDepth' };
    if (samples < minSplit) return { ...node, stopReason: 'minSamplesSplit' };

    const features =
      mf < nFeat && params.rng
        ? sampleWithoutReplacement(nFeat, mf, params.rng).sort((a, b) => a - b)
        : Array.from({ length: nFeat }, (_, i) => i);
    node.featuresConsidered = features;

    const { best, bestPerFeature } = findBestSplit(X, y, idx, features, params.criterion, minLeaf);
    node.bestPerFeature = bestPerFeature;
    if (!best) return { ...node, stopReason: 'noValidSplit' };
    if (best.gain <= 1e-12) return { ...node, stopReason: 'noGain' };

    const L: number[] = [];
    const R: number[] = [];
    for (const i of idx) (X[i][best.feature] <= best.threshold ? L : R).push(i);
    node.isLeaf = false;
    node.split = best;
    node.left = grow(L, depth + 1);
    node.right = grow(R, depth + 1);
    return node;
  };

  return grow(indices ?? X.map((_, i) => i), 0);
}

export interface PathStep {
  nodeId: number;
  feature: number;
  threshold: number;
  value: number;
  goLeft: boolean;
}

export function predictTree(root: TreeNode, x: readonly number[]): { prediction: Label; probability: number; leaf: TreeNode; path: PathStep[] } {
  const path: PathStep[] = [];
  let node = root;
  let guard = 0;
  while (!node.isLeaf && node.split && node.left && node.right && guard++ < 64) {
    const { feature, threshold } = node.split;
    const goLeft = x[feature] <= threshold;
    path.push({ nodeId: node.id, feature, threshold, value: x[feature], goLeft });
    node = goLeft ? node.left : node.right;
  }
  return { prediction: node.prediction, probability: node.probability, leaf: node, path };
}

export const predictTreeMany = (root: TreeNode, X: readonly number[][]): Label[] =>
  X.map((x) => predictTree(root, x).prediction);

export function flattenTree(root: TreeNode): TreeNode[] {
  const out: TreeNode[] = [];
  const stack = [root];
  while (stack.length) {
    const n = stack.pop()!;
    out.push(n);
    if (n.right) stack.push(n.right);
    if (n.left) stack.push(n.left);
  }
  return out.sort((a, b) => a.id - b.id);
}

export function treeStats(root: TreeNode) {
  const nodes = flattenTree(root);
  const leaves = nodes.filter((n) => n.isLeaf);
  return {
    nodes: nodes.length,
    leaves: leaves.length,
    depth: Math.max(...nodes.map((n) => n.depth)),
  };
}

/** Xususiyat ahamiyati: har bir split uchun samples × gain yig‘indisi, normallashtirilgan. */
export function featureImportance(root: TreeNode, nFeatures: number): number[] {
  const imp = new Array(nFeatures).fill(0);
  for (const n of flattenTree(root)) if (n.split) imp[n.split.feature] += n.samples * n.split.gain;
  const s = imp.reduce((a, b) => a + b, 0);
  return s === 0 ? imp : imp.map((v) => v / s);
}

/** Tugunlarni BFS tartibida qaytaradi (animatsiyada ketma-ket ochish uchun). */
export function bfsOrder(root: TreeNode): TreeNode[] {
  const out: TreeNode[] = [];
  const q = [root];
  while (q.length) {
    const n = q.shift()!;
    out.push(n);
    if (n.left) q.push(n.left);
    if (n.right) q.push(n.right);
  }
  return out;
}
