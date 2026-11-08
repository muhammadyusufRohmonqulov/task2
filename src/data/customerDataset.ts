import type { SegmentCustomer } from '../types';
import { clamp, mulberry32, randNormal, round, shuffle } from '../utils/random';

export const CUSTOMER_SEED = 42;

interface LatentGroup {
  n: number;
  income: [number, number];
  spending: [number, number];
  tx: [number, number];
}

/**
 * Yashirin (algoritmga noma’lum) guruhlar. K-Means bu guruhlar haqida
 * hech narsa bilmaydi — u faqat sonlar orasidagi o‘xshashlikni ko‘radi.
 */
const GROUPS: LatentGroup[] = [
  { n: 26, income: [5, 1.3], spending: [2.2, 0.7], tx: [22, 6] }, // kam daromad, kam xarajat
  { n: 24, income: [8, 1.6], spending: [6.6, 1.1], tx: [68, 12] }, // o‘rta daromad, yuqori xarajat
  { n: 20, income: [21, 3.2], spending: [12.5, 2], tx: [48, 10] }, // yuqori daromad, yuqori xarajat
  { n: 18, income: [19, 3], spending: [4, 1.1], tx: [26, 7] }, // yuqori daromad, kam xarajat
];

export function generateCustomerDataset(seed = CUSTOMER_SEED): SegmentCustomer[] {
  const rng = mulberry32(seed);
  const rows: Omit<SegmentCustomer, 'id'>[] = [];
  for (const g of GROUPS) {
    for (let i = 0; i < g.n; i++) {
      const income = round(clamp(randNormal(rng, g.income[0], g.income[1]), 2, 35), 1);
      const spending = round(clamp(randNormal(rng, g.spending[0], g.spending[1]), 0.5, Math.max(1, income * 0.95)), 1);
      const transactions = Math.round(clamp(randNormal(rng, g.tx[0], g.tx[1]), 4, 140));
      rows.push({ income, spending, transactions });
    }
  }
  return shuffle(rows, rng).map((r, i) => ({ id: `C${String(i + 1).padStart(3, '0')}`, ...r }));
}

export const CUSTOMERS: SegmentCustomer[] = generateCustomerDataset();

export const SEGMENT_FEATURES = [
  { key: 'income', uz: 'Oylik daromad', en: 'Monthly Income', unit: 'mln so‘m' },
  { key: 'spending', uz: 'Oylik xarajat', en: 'Monthly Spending', unit: 'mln so‘m' },
  { key: 'transactions', uz: 'Tranzaksiyalar', en: 'Transactions', unit: 'ta/oy' },
] as const;
