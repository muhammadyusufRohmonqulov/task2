/**
 * Uchta klassifikatsiya algoritmini BIR XIL train/test split (80/20, stratified, seed 42)
 * ustida o‘qitish va baholash. Test to‘plami o‘qitishda ishlatilmaydi.
 */
import type { Criterion, DistanceMetric, Label, Metrics, ScalingMethod } from '../types';
import { TEST, TRAIN } from '../data/bankDataset';
import { evaluate } from '../utils/metrics';
import { fitKNN, knnPredictMany, type KNNModel } from './knn';
import { buildTree, predictTreeMany, type TreeNode } from './decisionTree';
import { predictForestMany, trainRandomForest, type Forest, type MaxFeaturesOption } from './randomForest';

export interface KNNConfig {
  k: number;
  metric: DistanceMetric;
  scaling: ScalingMethod;
  weighted: boolean;
}
export interface TreeConfig {
  maxDepth: number;
  minSamplesSplit: number;
  minSamplesLeaf: number;
  criterion: Criterion;
}
export interface ForestConfig extends TreeConfig {
  nEstimators: number;
  maxFeatures: MaxFeaturesOption;
  seed: number;
}

export const DEFAULT_KNN: KNNConfig = { k: 5, metric: 'euclidean', scaling: 'zscore', weighted: false };
export const DEFAULT_TREE: TreeConfig = { maxDepth: 4, minSamplesSplit: 6, minSamplesLeaf: 3, criterion: 'gini' };
export const DEFAULT_FOREST: ForestConfig = {
  nEstimators: 25,
  maxDepth: 6,
  minSamplesSplit: 12,
  minSamplesLeaf: 3,
  criterion: 'gini',
  maxFeatures: 'sqrt',
  seed: 42,
};

export interface EvalResult<M> {
  model: M;
  train: Metrics;
  test: Metrics;
  testPred: Label[];
}

export function evaluateKNN(cfg: KNNConfig): EvalResult<KNNModel> {
  const model = fitKNN(TRAIN.X, TRAIN.y, cfg.scaling);
  const opts = { k: cfg.k, metric: cfg.metric, weighted: cfg.weighted };
  // Training baholashda nuqtaning o‘zi ham qo‘shnilar ichida bo‘ladi (masofa 0) — KNN uchun bu odatiy
  const trainPred = knnPredictMany(model, TRAIN.X, opts);
  const testPred = knnPredictMany(model, TEST.X, opts);
  return { model, train: evaluate(TRAIN.y, trainPred), test: evaluate(TEST.y, testPred), testPred };
}

export function trainTree(cfg: TreeConfig): TreeNode {
  return buildTree(TRAIN.X, TRAIN.y, cfg);
}

export function evaluateTree(cfg: TreeConfig): EvalResult<TreeNode> {
  const model = trainTree(cfg);
  const testPred = predictTreeMany(model, TEST.X);
  return {
    model,
    train: evaluate(TRAIN.y, predictTreeMany(model, TRAIN.X)),
    test: evaluate(TEST.y, testPred),
    testPred,
  };
}

export function trainForest(cfg: ForestConfig): Forest {
  return trainRandomForest(TRAIN.X, TRAIN.y, cfg);
}

export function evaluateForest(cfg: ForestConfig): EvalResult<Forest> {
  const model = trainForest(cfg);
  const testPred = predictForestMany(model, TEST.X);
  return {
    model,
    train: evaluate(TRAIN.y, predictForestMany(model, TRAIN.X)),
    test: evaluate(TEST.y, testPred),
    testPred,
  };
}

/** Train va test accuracy farqiga qarab overfitting holatini sodda baholash. */
export function overfitStatus(train: Metrics, test: Metrics): { label: string; level: 'low' | 'mid' | 'high' } {
  const gap = train.accuracy - test.accuracy;
  if (gap > 0.15) return { label: 'Kuchli overfitting', level: 'high' };
  if (gap > 0.07) return { label: 'O‘rtacha overfitting', level: 'mid' };
  return { label: 'Past / yo‘q', level: 'low' };
}
