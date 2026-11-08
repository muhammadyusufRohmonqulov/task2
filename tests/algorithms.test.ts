import { describe, expect, it } from 'vitest';
import { euclidean, manhattan } from '../src/utils/distance';
import { fitScaler, stratifiedSplit, transformRow, zScore } from '../src/utils/preprocessing';
import { mean, std } from '../src/utils/statistics';
import { accuracy, confusionMatrix, evaluate, f1Score, precision, recall } from '../src/utils/metrics';
import { buildTree, entropy, evaluateFeatureSplits, gini, predictTree } from '../src/algorithms/decisionTree';
import { computeCentroids, computeWCSS, runKMeans } from '../src/algorithms/kmeans';
import { fitKNN, knnQuery } from '../src/algorithms/knn';
import { bootstrapSample, predictForest, trainRandomForest } from '../src/algorithms/randomForest';
import { BANK_DATA, generateBankDataset, SPLIT, toCSV, Y_ALL } from '../src/data/bankDataset';
import { validateField } from '../src/utils/validation';

describe('Masofa funksiyalari', () => {
  it('Euclidean distance', () => {
    expect(euclidean([0, 0], [3, 4])).toBe(5);
    expect(euclidean([1, 2, 3], [1, 2, 3])).toBe(0);
  });
  it('Manhattan distance', () => {
    expect(manhattan([0, 0], [3, 4])).toBe(7);
    expect(manhattan([1, -1], [-1, 1])).toBe(4);
  });
});

describe('Standartlashtirish', () => {
  it('mean va populyatsiya std', () => {
    expect(mean([2, 4, 4, 4, 5, 5, 7, 9])).toBe(5);
    expect(std([2, 4, 4, 4, 5, 5, 7, 9])).toBe(2);
  });
  it('z-score', () => {
    expect(zScore(9, 5, 2)).toBe(2);
    expect(zScore(3, 3, 0)).toBe(0); // nolga bo‘lish yo‘q
  });
  it('scaler faqat train ustida fit qilinadi va yangi qatorga qo‘llanadi', () => {
    const s = fitScaler([[1, 10], [3, 30]], 'zscore');
    expect(transformRow(s, [2, 20])).toEqual([0, 0]);
    expect(transformRow(s, [3, 30])).toEqual([1, 1]);
    const m = fitScaler([[0, 10], [10, 20]], 'minmax');
    expect(transformRow(m, [5, 15])).toEqual([0.5, 0.5]);
  });
});

describe('Gini va Entropy', () => {
  it('Gini', () => {
    expect(gini([6, 4])).toBeCloseTo(0.48, 10);
    expect(gini([10, 0])).toBe(0);
    expect(gini([5, 5])).toBeCloseTo(0.5, 10);
    expect(gini([0, 0])).toBe(0);
  });
  it('Entropy', () => {
    expect(entropy([5, 5])).toBeCloseTo(1, 10);
    expect(entropy([10, 0])).toBe(0);
    expect(entropy([6, 4])).toBeCloseTo(0.97095, 4);
  });
  it('split nomzodlari va weighted Gini', () => {
    const X = [[1], [2], [3], [4]];
    const y = [0, 0, 1, 1];
    const c = evaluateFeatureSplits(X, y, [0, 1, 2, 3], 0, 'gini');
    expect(c.map((s) => s.threshold)).toEqual([1.5, 2.5, 3.5]);
    const best = c.find((s) => s.threshold === 2.5)!;
    expect(best.weighted).toBe(0);
    expect(best.gain).toBeCloseTo(0.5, 10);
  });
  it('daraxt to‘g‘ri ajratadi va bashorat qiladi', () => {
    const X = [[1], [2], [3], [10], [11], [12]];
    const y = [0, 0, 0, 1, 1, 1] as const;
    const t = buildTree(X, [...y], { maxDepth: 3, minSamplesSplit: 2, minSamplesLeaf: 1, criterion: 'gini' });
    expect(t.split?.threshold).toBe(6.5);
    expect(predictTree(t, [2]).prediction).toBe(0);
    expect(predictTree(t, [11]).prediction).toBe(1);
  });
});

describe('Metrikalar', () => {
  const yT = [1, 1, 0, 0, 1, 0];
  const yP = [1, 0, 0, 1, 1, 0];
  it('Confusion matrix', () => {
    expect(confusionMatrix(yT, yP)).toEqual({ tp: 2, tn: 2, fp: 1, fn: 1 });
  });
  it('Accuracy, Precision, Recall, F1', () => {
    const cm = confusionMatrix(yT, yP);
    expect(accuracy(cm)).toBeCloseTo(4 / 6);
    expect(precision(cm)).toBeCloseTo(2 / 3);
    expect(recall(cm)).toBeCloseTo(2 / 3);
    expect(f1Score(cm)).toBeCloseTo(2 / 3);
  });
  it('nolga bo‘lishda 0', () => {
    const m = evaluate([0, 0], [0, 0]);
    expect(m.precision).toBe(0);
    expect(m.recall).toBe(0);
    expect(m.f1).toBe(0);
    expect(m.accuracy).toBe(1);
  });
});

describe('K-Means', () => {
  it('centroid = klaster nuqtalari o‘rtachasi', () => {
    const X = [[0, 0], [2, 0], [10, 10], [12, 10]];
    const { centroids, counts } = computeCentroids(X, [0, 0, 1, 1], 2);
    expect(centroids).toEqual([[1, 0], [11, 10]]);
    expect(counts).toEqual([2, 2]);
    expect(computeWCSS(X, [0, 0, 1, 1], centroids)).toBe(4);
  });
  it('bo‘sh klaster oldingi centroidni saqlaydi', () => {
    const { centroids } = computeCentroids([[1, 1]], [0], 2, [[0, 0], [5, 5]]);
    expect(centroids[1]).toEqual([5, 5]);
  });
  it('konvergentsiya va iteratsiya chegarasi', () => {
    const X = [[0, 0], [0, 1], [1, 0], [9, 9], [9, 10], [10, 9]];
    const r = runKMeans(X, { k: 2, seed: 1 });
    expect(r.converged).toBe(true);
    expect(new Set(r.assignments.slice(0, 3)).size).toBe(1);
    expect(r.assignments[0]).not.toBe(r.assignments[3]);
    const r2 = runKMeans(X, { k: 2, maxIter: 1 });
    expect(r2.iterations.length).toBe(1);
  });
});

describe('KNN', () => {
  it('eng yaqin qo‘shnilar ovozi', () => {
    const m = fitKNN([[0], [1], [2], [10], [11]], [0, 0, 0, 1, 1], 'none');
    const r = knnQuery(m, [1.4], { k: 3, metric: 'euclidean', weighted: false });
    expect(r.neighbors.map((n) => n.index)).toEqual([1, 2, 0]);
    expect(r.votes).toEqual([3, 0]);
    expect(r.prediction).toBe(0);
    expect(r.probabilities[0]).toBe(1);
  });
});

describe('Random Forest va dataset', () => {
  it('bootstrap replacement bilan, deterministik', () => {
    const a = bootstrapSample(50, 7);
    expect(a).toEqual(bootstrapSample(50, 7));
    expect(new Set(a).size).toBeLessThan(50);
  });
  it('forest daraxtlar sonini va ovozlarni to‘g‘ri sanaydi', () => {
    const X = BANK_DATA.map((c) => [c.age, c.income, c.creditScore, c.dti, c.latePayments]);
    const f = trainRandomForest(X, Y_ALL, { nEstimators: 7, maxDepth: 4, minSamplesSplit: 4, minSamplesLeaf: 1, maxFeatures: 'sqrt', criterion: 'gini', seed: 42 });
    expect(f.trees.length).toBe(7);
    const p = predictForest(f, X[0]);
    expect(p.votes[0] + p.votes[1]).toBe(7);
  });
  it('dataset deterministik va stratified split', () => {
    expect(generateBankDataset()).toEqual(BANK_DATA);
    expect(BANK_DATA.length).toBeGreaterThanOrEqual(100);
    expect(SPLIT.train.length + SPLIT.test.length).toBe(BANK_DATA.length);
    expect(SPLIT.train.filter((i) => SPLIT.test.includes(i)).length).toBe(0);
    const s = stratifiedSplit([0, 0, 0, 0, 0, 1, 1, 1, 1, 1], 0.2, 42);
    expect(s.test.length).toBe(2);
  });
  it('CSV eksport', () => {
    const lines = toCSV(BANK_DATA).split('\n');
    expect(lines[0]).toBe('id,age,monthly_income_mln,credit_score,dti_percent,late_payments,payment_default');
    expect(lines.length).toBe(BANK_DATA.length + 1);
  });
  it('validatsiya', () => {
    expect(validateField('age', '34')).toBeNull();
    expect(validateField('age', 'abc')).not.toBeNull();
    expect(validateField('creditScore', '1200')).not.toBeNull();
    expect(validateField('latePayments', '1.5')).not.toBeNull();
  });
});
