export const AXIS = { stroke: '#475569', fontSize: 12, tick: { fill: '#94A3B8' } };
export const GRID = { stroke: 'rgba(148,163,184,0.12)', strokeDasharray: '3 3' };
export const TOOLTIP = {
  contentStyle: {
    background: 'rgba(11,17,32,0.96)',
    border: '1px solid rgba(148,163,184,0.2)',
    borderRadius: 12,
    color: '#F8FAFC',
    fontSize: 12,
    boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
  },
  labelStyle: { color: '#94A3B8', marginBottom: 4 },
  itemStyle: { color: '#E2E8F0' },
  cursor: { fill: 'rgba(148,163,184,0.06)' },
};
export const MODEL_COLORS = { KNN: '#00D4FF', 'Decision Tree': '#3B82F6', 'Random Forest': '#10B981' } as const;

/** Chiziqli shkala: [d0,d1] → [r0,r1] */
export const scale = (d0: number, d1: number, r0: number, r1: number) => (v: number) =>
  d1 === d0 ? (r0 + r1) / 2 : r0 + ((v - d0) / (d1 - d0)) * (r1 - r0);

export function niceTicks(lo: number, hi: number, count = 5): number[] {
  const span = hi - lo || 1;
  const raw = span / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= count) ?? raw;
  const start = Math.ceil(lo / step) * step;
  const out: number[] = [];
  for (let v = start; v <= hi + 1e-9; v += step) out.push(Math.round(v * 1e6) / 1e6);
  return out;
}
