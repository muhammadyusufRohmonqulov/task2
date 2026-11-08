import type { ClientFeatures, FeatureKey } from '../types';
import { FEATURES } from '../data/bankDataset';

export type ClientDraft = Record<FeatureKey, string>;
export type ValidationErrors = Partial<Record<FeatureKey, string>>;

const INTEGER_KEYS: FeatureKey[] = ['age', 'creditScore', 'latePayments'];

/** Bitta maydonni tekshiradi; xato bo‘lsa o‘zbekcha xabar qaytaradi. */
export function validateField(key: FeatureKey, raw: string): string | null {
  const meta = FEATURES.find((f) => f.key === key)!;
  const s = raw.trim().replace(',', '.');
  if (s === '') return `${meta.uz} kiritilmagan.`;
  const v = Number(s);
  if (!Number.isFinite(v)) return `${meta.uz} son bo‘lishi kerak.`;
  if (INTEGER_KEYS.includes(key) && !Number.isInteger(v)) return `${meta.uz} butun son bo‘lishi kerak.`;
  if (v < meta.min || v > meta.max)
    return `${meta.uz} ${meta.min} va ${meta.max} ${meta.unit} oralig‘ida bo‘lishi kerak.`;
  return null;
}

export function validateClient(draft: ClientDraft): { ok: boolean; errors: ValidationErrors; value?: ClientFeatures } {
  const errors: ValidationErrors = {};
  for (const f of FEATURES) {
    const e = validateField(f.key, draft[f.key] ?? '');
    if (e) errors[f.key] = e;
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  const value = Object.fromEntries(
    FEATURES.map((f) => [f.key, Number(draft[f.key].trim().replace(',', '.'))]),
  ) as unknown as ClientFeatures;
  return { ok: true, errors, value };
}

export const toDraft = (c: ClientFeatures): ClientDraft =>
  Object.fromEntries(FEATURES.map((f) => [f.key, String(c[f.key])])) as ClientDraft;
