/**
 * Random Forest = Bagging (bootstrap sampling) + har bir tugunda tasodifiy xususiyatlar to‘plami
 * + Majority Voting. Har bir daraxt decisionTree.ts dagi haqiqiy buildTree orqali quriladi.
 */
import type { Criterion, Label } from '../types';
import { mulberry32, randInt } from '../utils/random';
import { buildTree, flattenTree, predictTree, type PathStep, type TreeNode } from './decisionTree';

export type MaxFeaturesOption = 'sqrt' | 'log2' | 'all' | number;

export interface ForestParams {
  nEstimators: number;
  maxDepth: number;
  minSamplesSplit: number;
  minSamplesLeaf: number;
  maxFeatures: MaxFeaturesOption;
  criterion: Criterion;
  seed: number;
}

export interface ForestTree {
  id: number;
  /** bootstrap namunasi (training indekslari, takrorlanishi mumkin) */
  bootstrap: number[];
  /** Out-of-Bag: namunaga bir marta ham tushmagan indekslar */
  oob: number[];
  uniqueCount: number;
  root: TreeNode;
  /** daraxt splitlarida haqiqatda ishlatilgan xususiyatlar */
  featuresUsed: number[];
}

export interface Forest {
  params: ForestParams;
  maxFeatures: number;
  trees: ForestTree[];
  oobAccuracy: number;
  oobEvaluated: number;
}

export interface TreeVote {
  treeId: number;
  prediction: Label;
  probability: number;
  path: PathStep[];
  leafId: number;
}

export interface ForestPrediction {
  treeVotes: TreeVote[];
  votes: [number, number];
  /** ovozlar ulushi (kalibrlangan ehtimol EMAS) */
  share: [number, number];
  prediction: Label;
  tie: boolean;
}

export const MAX_ESTIMATORS = 100;

export function resolveMaxFeatures(mf: MaxFeaturesOption, nFeatures: number): number {
  if (typeof mf === 'number') return Math.max(1, Math.min(nFeatures, Math.round(mf)));
  if (mf === 'sqrt') return Math.max(1, Math.round(Math.sqrt(nFeatures)));
  if (mf === 'log2') return Math.max(1, Math.round(Math.log2(nFeatures)));
  return nFeatures;
}

/** Bootstrap: n ta yozuvdan replacement bilan n marta tanlash. */
export function bootstrapSample(n: number, seed: number): number[] {
  const rng = mulberry32(seed);
  return Array.from({ length: n }, () => randInt(rng, 0, n - 1));
}

export const treeSeed = (seed: number, t: number) => seed * 1000 + t * 7919 + 1;

export function trainRandomForest(X: number[][], y: Label[], params: ForestParams): Forest {
  if (X.length === 0) throw new Error('Random Forest uchun dataset bo‘sh');
  const n = X.length;
  const nFeat = X[0].length;
  const nTrees = Math.max(1, Math.min(MAX_ESTIMATORS, Math.round(params.nEstimators)));
  const mf = resolveMaxFeatures(params.maxFeatures, nFeat);
  const trees: ForestTree[] = [];

  for (let t = 0; t < nTrees; t++) {
    const s = treeSeed(params.seed, t);
    const bootstrap = bootstrapSample(n, s);
    const inBag = new Uint8Array(n);
    for (const i of bootstrap) inBag[i] = 1;
    const oob: number[] = [];
    for (let i = 0; i < n; i++) if (!inBag[i]) oob.push(i);
    const root = buildTree(
      X,
      y,
      {
        maxDepth: params.maxDepth,
        minSamplesSplit: params.minSamplesSplit,
        minSamplesLeaf: params.minSamplesLeaf,
        criterion: params.criterion,
        maxFeatures: mf,
        rng: mulberry32(s + 17),
      },
      bootstrap,
    );
    const used = new Set<number>();
    for (const nd of flattenTree(root)) if (nd.split) used.add(nd.split.feature);
    trees.push({
      id: t + 1,
      bootstrap,
      oob,
      uniqueCount: n - oob.length,
      root,
      featuresUsed: [...used].sort((a, b) => a - b),
    });
  }

  // Out-of-Bag baholash: har bir yozuvni faqat u ko‘rmagan daraxtlar ovozi bilan tekshiramiz
  let correct = 0;
  let evaluated = 0;
  for (let i = 0; i < n; i++) {
    const v: [number, number] = [0, 0];
    for (const tr of trees) if (tr.oob.includes(i)) v[predictTree(tr.root, X[i]).prediction]++;
    if (v[0] + v[1] === 0) continue;
    evaluated++;
    const p: Label = v[1] > v[0] ? 1 : 0;
    if (p === y[i]) correct++;
  }

  return {
    params: { ...params, nEstimators: nTrees },
    maxFeatures: mf,
    trees,
    oobAccuracy: evaluated === 0 ? 0 : correct / evaluated,
    oobEvaluated: evaluated,
  };
}

export function predictForest(forest: Forest, x: readonly number[]): ForestPrediction {
  const treeVotes: TreeVote[] = forest.trees.map((t) => {
    const r = predictTree(t.root, x);
    return { treeId: t.id, prediction: r.prediction, probability: r.probability, path: r.path, leafId: r.leaf.id };
  });
  const votes: [number, number] = [0, 0];
  for (const v of treeVotes) votes[v.prediction]++;
  const N = treeVotes.length;
  const tie = votes[0] === votes[1];
  let prediction: Label = votes[1] > votes[0] ? 1 : 0;
  if (tie) {
    // Tenglikda barglardagi o‘rtacha P(1) hal qiladi
    const avg = treeVotes.reduce((a, v) => a + v.probability, 0) / N;
    prediction = avg >= 0.5 ? 1 : 0;
  }
  return { treeVotes, votes, share: [votes[0] / N, votes[1] / N], prediction, tie };
}

export const predictForestMany = (f: Forest, X: number[][]): Label[] => X.map((x) => predictForest(f, x).prediction);

/** Random Forest feature importance: daraxtlar bo‘yicha o‘rtacha (samples × gain). */
export function forestImportance(f: Forest, nFeatures: number): number[] {
  const imp = new Array(nFeatures).fill(0);
  for (const t of f.trees) for (const n of flattenTree(t.root)) if (n.split) imp[n.split.feature] += n.samples * n.split.gain;
  const s = imp.reduce((a, b) => a + b, 0);
  return s === 0 ? imp : imp.map((v) => v / s);
}
