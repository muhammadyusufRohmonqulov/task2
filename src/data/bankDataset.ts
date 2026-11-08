import type { BankClient, ClientFeatures, FeatureKey, FeatureMeta, Label } from '../types';
import { clamp, mulberry32, randNormal, randPoisson, round } from '../utils/random';
import { stratifiedSplit } from '../utils/preprocessing';

/** Datasetni takrorlanuvchan qilish uchun random seed. */
export const DATASET_SEED = 42;
export const DATASET_SIZE = 150;

export const FEATURES: FeatureMeta[] = [
  {
    key: 'age',
    uz: 'Mijoz yoshi',
    en: 'Age',
    short: 'Yosh',
    unit: 'yil',
    min: 18,
    max: 80,
    step: 1,
    description: 'Mijozning to‘liq yillardagi yoshi.',
  },
  {
    key: 'income',
    uz: 'Oylik daromadi',
    en: 'Monthly Income',
    short: 'Daromad',
    unit: 'mln so‘m',
    min: 0.5,
    max: 100,
    step: 0.1,
    description: 'Mijozning rasmiy oylik daromadi, million so‘mda.',
  },
  {
    key: 'creditScore',
    uz: 'Kredit reytingi',
    en: 'Credit Score',
    short: 'Credit Score',
    unit: 'ball',
    min: 300,
    max: 900,
    step: 1,
    description: 'Kredit byurosi bergan reyting: qancha yuqori bo‘lsa, kredit tarixi shuncha yaxshi.',
  },
  {
    key: 'dti',
    uz: 'Qarz va daromad nisbati',
    en: 'Debt-to-Income Ratio',
    short: 'DTI',
    unit: '%',
    min: 0,
    max: 100,
    step: 1,
    description: 'Oylik qarz to‘lovlarining oylik daromadga nisbati, foizda.',
  },
  {
    key: 'latePayments',
    uz: 'Kechiktirilgan to‘lovlar',
    en: 'Late Payments',
    short: 'Kechikishlar',
    unit: 'ta',
    min: 0,
    max: 12,
    step: 1,
    description: 'So‘nggi 12 oyda kechiktirilgan to‘lovlar soni.',
  },
];

export const FEATURE_KEYS: FeatureKey[] = FEATURES.map((f) => f.key);
export const featureMeta = (k: FeatureKey) => FEATURES.find((f) => f.key === k)!;

export const CLASS_NAMES: Record<Label, string> = {
  0: 'Muammosiz to‘lagan',
  1: 'To‘lovda muammo',
};
export const CLASS_SHORT: Record<Label, string> = { 0: 'Muammosiz', 1: 'Muammoli' };

/** O‘quv misollarida ishlatiladigan yangi mijoz. */
export const NEW_CLIENT: ClientFeatures = {
  age: 34,
  income: 7.5,
  creditScore: 655,
  dti: 40,
  latePayments: 2,
};

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

/**
 * Sun’iy bank mijozlari datasetini yaratadi.
 *
 * Mantiq: kredit reytingi past, DTI yuqori, kechikishlari ko‘p va daromadi
 * past mijozlarda default ehtimoli yuqoriroq. Ammo logistik modelga tasodifiy
 * shovqin qo‘shilgani uchun sinflar to‘liq ajralmaydi — algoritmlar orasidagi
 * farqlarni ko‘rish mumkin bo‘ladi.
 */
export function generateBankDataset(n = DATASET_SIZE, seed = DATASET_SEED): BankClient[] {
  const rng = mulberry32(seed);
  const out: BankClient[] = [];
  for (let i = 0; i < n; i++) {
    const age = clamp(Math.round(randNormal(rng, 38, 10)), 21, 65);
    const income = round(
      clamp(Math.exp(randNormal(rng, Math.log(8), 0.42)) + (age - 38) * 0.06, 2.5, 35),
      1,
    );
    const creditScore = Math.round(clamp(randNormal(rng, 640 + 3.5 * (income - 8), 62), 450, 850));
    const dti = Math.round(clamp(randNormal(rng, 36 - 0.5 * (income - 8), 12), 5, 75));
    const lambda = Math.max(0.15, 1.5 - (creditScore - 640) / 85 + (dti - 36) / 30);
    const latePayments = clamp(randPoisson(rng, lambda), 0, 9);

    const z =
      -0.55 -
      0.013 * (creditScore - 640) +
      0.05 * (dti - 36) +
      0.42 * (latePayments - 1.5) -
      0.07 * (income - 8) -
      0.012 * (age - 38) +
      randNormal(rng, 0, 0.7);
    const label: Label = rng() < sigmoid(z) ? 1 : 0;

    out.push({
      id: `M${String(i + 1).padStart(3, '0')}`,
      age,
      income,
      creditScore,
      dti,
      latePayments,
      default: label,
    });
  }
  return out;
}

export const BANK_DATA: BankClient[] = generateBankDataset();

/** Mijoz → xususiyatlar vektori (FEATURES tartibida). */
export const toVector = (c: ClientFeatures): number[] => FEATURE_KEYS.map((k) => c[k]);

export const X_ALL: number[][] = BANK_DATA.map(toVector);
export const Y_ALL: Label[] = BANK_DATA.map((c) => c.default);

/** Barcha klassifikatsiya algoritmlari uchun umumiy 80/20 stratified split (seed = 42). */
export const SPLIT = stratifiedSplit(Y_ALL, 0.2, DATASET_SEED);

export const TRAIN = {
  idx: SPLIT.train,
  X: SPLIT.train.map((i) => X_ALL[i]),
  y: SPLIT.train.map((i) => Y_ALL[i]),
  clients: SPLIT.train.map((i) => BANK_DATA[i]),
};
export const TEST = {
  idx: SPLIT.test,
  X: SPLIT.test.map((i) => X_ALL[i]),
  y: SPLIT.test.map((i) => Y_ALL[i]),
  clients: SPLIT.test.map((i) => BANK_DATA[i]),
};

/** Qo‘lda hisob-kitobni tushuntirish uchun kichik namuna (datasetning birinchi 10 yozuvi). */
export const HAND_SAMPLE: BankClient[] = BANK_DATA.slice(0, 10);

export function toCSV(rows: BankClient[]): string {
  const header = ['id', 'age', 'monthly_income_mln', 'credit_score', 'dti_percent', 'late_payments', 'payment_default'];
  const lines = rows.map((r) =>
    [r.id, r.age, r.income, r.creditScore, r.dti, r.latePayments, r.default].join(','),
  );
  return [header.join(','), ...lines].join('\n');
}

export function formatFeature(k: FeatureKey, v: number): string {
  switch (k) {
    case 'income':
      return v.toFixed(1);
    case 'dti':
      return `${Math.round(v * 10) / 10}`;
    default:
      return Number.isInteger(v) ? String(v) : v.toFixed(1);
  }
}
