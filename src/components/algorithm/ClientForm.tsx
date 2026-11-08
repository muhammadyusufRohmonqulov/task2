import type { ClientFeatures, FeatureKey } from '../../types';
import { FEATURES, NEW_CLIENT } from '../../data/bankDataset';
import { Slider } from '../ui/Controls';
import { RotateCcw } from 'lucide-react';

const SLIDER_RANGE: Record<FeatureKey, [number, number, number]> = {
  age: [21, 65, 1],
  income: [2, 35, 0.1],
  creditScore: [450, 850, 1],
  dti: [5, 75, 1],
  latePayments: [0, 9, 1],
};

/** Yangi mijoz xususiyatlarini slider orqali o‘zgartirish (algoritm sahifalari uchun). */
export default function ClientSliders({ value, onChange }: { value: ClientFeatures; onChange: (v: ClientFeatures) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-ink">Yangi mijoz xususiyatlari</div>
        <button
          type="button"
          onClick={() => onChange({ ...NEW_CLIENT })}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted hover:bg-white/5 hover:text-cyan"
        >
          <RotateCcw size={12} /> Asl mijoz
        </button>
      </div>
      {FEATURES.map((f) => {
        const [mn, mx, st] = SLIDER_RANGE[f.key];
        return (
          <Slider
            key={f.key}
            label={
              <span>
                {f.uz} <span className="text-xs text-muted">({f.unit})</span>
              </span>
            }
            value={value[f.key]}
            min={mn}
            max={mx}
            step={st}
            format={(v) => (f.key === 'income' ? v.toFixed(1) : String(v))}
            onChange={(v) => onChange({ ...value, [f.key]: v })}
          />
        );
      })}
    </div>
  );
}
