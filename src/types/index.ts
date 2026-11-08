/** Klassifikatsiya xususiyatlarining kalitlari (tartib muhim: matritsa ustunlari shu tartibda). */
export type FeatureKey = 'age' | 'income' | 'creditScore' | 'dti' | 'latePayments';

export type Label = 0 | 1;

/** Kredit olgan bank mijozi (sun’iy yozuv). */
export interface BankClient {
  id: string;
  age: number;
  income: number;
  creditScore: number;
  dti: number;
  latePayments: number;
  /** 1 — kredit to‘lovida muammo bo‘lgan, 0 — muammosiz. */
  default: Label;
}

export type ClientFeatures = Omit<BankClient, 'id' | 'default'>;

export interface FeatureMeta {
  key: FeatureKey;
  uz: string;
  en: string;
  short: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  description: string;
}

/** K-Means uchun bank mijozi (segmentatsiya). */
export interface SegmentCustomer {
  id: string;
  income: number;
  spending: number;
  transactions: number;
}

export interface ConfusionMatrix {
  tp: number;
  tn: number;
  fp: number;
  fn: number;
}

export interface Metrics {
  cm: ConfusionMatrix;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  n: number;
}

export type DistanceMetric = 'euclidean' | 'manhattan';
export type ScalingMethod = 'zscore' | 'minmax' | 'none';
export type Criterion = 'gini' | 'entropy';
export type AnimationSpeed = 'slow' | 'normal' | 'fast';
