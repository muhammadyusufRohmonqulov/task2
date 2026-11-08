/**
 * K-Nearest Neighbors (KNN) klassifikatori — tashqi kutubxonasiz implementatsiya.
 *
 * "O‘qitish" bosqichida KNN faqat training ma’lumotlarini (scaling qilingan holda) eslab qoladi.
 * Bashorat: yangi nuqtadan barcha training nuqtalarigacha masofa → eng yaqin K ta →
 * ovoz berish (oddiy yoki masofaga asoslangan weighted).
 */
import type { DistanceMetric, Label, ScalingMethod } from '../types';
import { euclidean, manhattan } from '../utils/distance';
import { fitScaler, transformRow, type Scaler } from '../utils/preprocessing';

export interface KNNModel {
  scaler: Scaler;
  Xraw: number[][];
  Xs: number[][];
  y: Label[];
}

export interface KNNOptions {
  k: number;
  metric: DistanceMetric;
  weighted: boolean;
}

export interface NeighborInfo {
  /** training massividagi indeks */
  index: number;
  distance: number;
  label: Label;
  /** weighted voting uchun og‘irlik: 1 / (d + ε) */
  weight: number;
  rank: number;
}

export interface KNNResult {
  query: number[];
  queryScaled: number[];
  /** barcha training nuqtalari, masofa bo‘yicha o‘sish tartibida */
  ranked: NeighborInfo[];
  neighbors: NeighborInfo[];
  votes: [number, number];
  weightedVotes: [number, number];
  /** P(class) = ovozlar / K (yoki weighted ulush) */
  probabilities: [number, number];
  prediction: Label;
  /** oddiy ovozlarda tenglik bo‘ldimi */
  tie: boolean;
}

export const WEIGHT_EPS = 1e-6;

export function fitKNN(X: number[][], y: Label[], scaling: ScalingMethod): KNNModel {
  if (X.length === 0) throw new Error('KNN uchun training dataset bo‘sh');
  const scaler = fitScaler(X, scaling);
  return { scaler, Xraw: X, Xs: X.map((r) => transformRow(scaler, r)), y };
}

export const distanceFn = (m: DistanceMetric) => (m === 'euclidean' ? euclidean : manhattan);

export function knnQuery(model: KNNModel, x: number[], opts: KNNOptions): KNNResult {
  const n = model.Xs.length;
  const k = Math.max(1, Math.min(Math.round(opts.k), n));
  const qs = transformRow(model.scaler, x);
  const dist = distanceFn(opts.metric);

  const ranked: NeighborInfo[] = model.Xs.map((row, i) => {
    const d = dist(qs, row);
    return { index: i, distance: d, label: model.y[i], weight: 1 / (d + WEIGHT_EPS), rank: 0 };
  });
  // masofa bo‘yicha; teng masofada indeks bo‘yicha (deterministik)
  ranked.sort((a, b) => a.distance - b.distance || a.index - b.index);
  ranked.forEach((r, i) => (r.rank = i + 1));

  const neighbors = ranked.slice(0, k);
  const votes: [number, number] = [0, 0];
  const wv: [number, number] = [0, 0];
  for (const nb of neighbors) {
    votes[nb.label]++;
    wv[nb.label] += nb.weight;
  }
  const tie = votes[0] === votes[1];

  let prediction: Label;
  let probabilities: [number, number];
  if (opts.weighted) {
    const tot = wv[0] + wv[1];
    probabilities = [wv[0] / tot, wv[1] / tot];
    prediction = wv[1] > wv[0] ? 1 : 0;
  } else {
    probabilities = [votes[0] / k, votes[1] / k];
    // Tenglik bo‘lsa (juft K), eng yaqin qo‘shnilarning weighted ovozi hal qiladi
    prediction = votes[1] > votes[0] ? 1 : votes[0] > votes[1] ? 0 : wv[1] > wv[0] ? 1 : 0;
  }

  return { query: x, queryScaled: qs, ranked, neighbors, votes, weightedVotes: wv, probabilities, prediction, tie };
}

export function knnPredictMany(model: KNNModel, X: number[][], opts: KNNOptions): Label[] {
  return X.map((x) => knnQuery(model, x, opts).prediction);
}
