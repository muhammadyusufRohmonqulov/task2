import type { ConfusionMatrix, Metrics } from '../types';

/** Nolga bo‘lishda 0 qaytaradi. */
export const safeDiv = (a: number, b: number) => (b === 0 ? 0 : a / b);

/** Positive sinf = 1 (kredit to‘lovida muammo). */
export function confusionMatrix(yTrue: readonly number[], yPred: readonly number[]): ConfusionMatrix {
  if (yTrue.length !== yPred.length) throw new Error('yTrue va yPred uzunligi teng bo‘lishi kerak');
  const cm: ConfusionMatrix = { tp: 0, tn: 0, fp: 0, fn: 0 };
  for (let i = 0; i < yTrue.length; i++) {
    const t = yTrue[i];
    const p = yPred[i];
    if (t === 1 && p === 1) cm.tp++;
    else if (t === 0 && p === 0) cm.tn++;
    else if (t === 0 && p === 1) cm.fp++;
    else cm.fn++;
  }
  return cm;
}

export const accuracy = (c: ConfusionMatrix) => safeDiv(c.tp + c.tn, c.tp + c.tn + c.fp + c.fn);
export const precision = (c: ConfusionMatrix) => safeDiv(c.tp, c.tp + c.fp);
export const recall = (c: ConfusionMatrix) => safeDiv(c.tp, c.tp + c.fn);
export function f1Score(c: ConfusionMatrix): number {
  const p = precision(c);
  const r = recall(c);
  return safeDiv(2 * p * r, p + r);
}

export function evaluate(yTrue: readonly number[], yPred: readonly number[]): Metrics {
  const cm = confusionMatrix(yTrue, yPred);
  return {
    cm,
    accuracy: accuracy(cm),
    precision: precision(cm),
    recall: recall(cm),
    f1: f1Score(cm),
    n: yTrue.length,
  };
}
