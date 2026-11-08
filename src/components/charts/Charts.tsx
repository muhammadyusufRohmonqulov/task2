import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Metrics } from '../../types';
import { AXIS, GRID, MODEL_COLORS, TOOLTIP } from './chartTheme';

const pctFmt = (v: number) => `${(v * 100).toFixed(1)}%`;

/** Uchta model metrikalarini bitta guruhlangan diagrammada taqqoslash. */
export function MetricsComparisonChart({ data, height = 320 }: { data: { name: keyof typeof MODEL_COLORS; m: Metrics }[]; height?: number }) {
  const rows = (['accuracy', 'precision', 'recall', 'f1'] as const).map((k) => ({
    metric: k === 'f1' ? 'F1-score' : k[0].toUpperCase() + k.slice(1),
    ...Object.fromEntries(data.map((d) => [d.name, d.m[k]])),
  }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={rows} margin={{ top: 10, right: 8, left: -12, bottom: 0 }} barCategoryGap="22%">
        <CartesianGrid {...GRID} vertical={false} />
        <XAxis dataKey="metric" {...AXIS} />
        <YAxis {...AXIS} domain={[0, 1]} tickFormatter={(v) => `${Math.round(v * 100)}%`} />
        <Tooltip {...TOOLTIP} formatter={(v: number) => pctFmt(v)} />
        <Legend wrapperStyle={{ fontSize: 12, color: '#94A3B8' }} />
        {data.map((d) => (
          <Bar key={d.name} dataKey={d.name} fill={MODEL_COLORS[d.name]} radius={[6, 6, 0, 0]} animationDuration={900} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Bitta modelning 4 ta metrikasi. */
export function MetricsBars({ m, color = '#00D4FF', height = 220 }: { m: Metrics; color?: string; height?: number }) {
  const rows = [
    { k: 'Accuracy', v: m.accuracy },
    { k: 'Precision', v: m.precision },
    { k: 'Recall', v: m.recall },
    { k: 'F1-score', v: m.f1 },
  ];
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={rows} margin={{ top: 16, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid {...GRID} vertical={false} />
        <XAxis dataKey="k" {...AXIS} />
        <YAxis {...AXIS} domain={[0, 1]} tickFormatter={(v) => `${Math.round(v * 100)}%`} />
        <Tooltip {...TOOLTIP} formatter={(v: number) => pctFmt(v)} />
        <Bar dataKey="v" name="Qiymat" fill={color} radius={[6, 6, 0, 0]} animationDuration={800} label={{ position: 'top', fill: '#CBD5E1', fontSize: 11, formatter: (v: number) => pctFmt(v) }} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ClassDonut({ counts, height = 240 }: { counts: [number, number]; height?: number }) {
  const data = [
    { name: '0 — Muammosiz', value: counts[0], color: '#10B981' },
    { name: '1 — Muammoli', value: counts[1], color: '#F43F5E' },
  ];
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="85%" paddingAngle={3} stroke="none" animationDuration={900}>
          {data.map((d) => (
            <Cell key={d.name} fill={d.color} />
          ))}
        </Pie>
        <Tooltip {...TOOLTIP} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

/** Parametr qiymatiga qarab train/test accuracy (masalan K, max depth, daraxtlar soni). */
export function ParamSweepChart({
  data,
  xLabel,
  current,
  height = 260,
  lines = [
    { key: 'train', name: 'Training accuracy', color: '#8B5CF6' },
    { key: 'test', name: 'Testing accuracy', color: '#00D4FF' },
  ],
}: {
  data: Record<string, number>[];
  xLabel: string;
  current?: number;
  height?: number;
  lines?: { key: string; name: string; color: string }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 12, left: -12, bottom: 14 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="x" {...AXIS} label={{ value: xLabel, position: 'insideBottom', offset: -8, fill: '#94A3B8', fontSize: 12 }} />
        <YAxis {...AXIS} domain={[0.4, 1]} tickFormatter={(v) => `${Math.round(v * 100)}%`} />
        <Tooltip {...TOOLTIP} formatter={(v: number) => pctFmt(v)} labelFormatter={(l) => `${xLabel}: ${l}`} />
        <Legend verticalAlign="top" wrapperStyle={{ fontSize: 12 }} />
        {current !== undefined && <ReferenceLine x={current} stroke="#F59E0B" strokeDasharray="4 4" label={{ value: 'tanlangan', fill: '#F59E0B', fontSize: 11, position: 'top' }} />}
        {lines.map((l) => (
          <Line key={l.key} type="monotone" dataKey={l.key} name={l.name} stroke={l.color} strokeWidth={2.4} dot={{ r: 3 }} animationDuration={900} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ElbowChart({ data, current, height = 280 }: { data: { k: number; wcss: number }[]; current: number; height?: number }) {
  const cur = data.find((d) => d.k === current);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 16, right: 16, left: -4, bottom: 14 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="k" {...AXIS} label={{ value: 'Klasterlar soni (K)', position: 'insideBottom', offset: -8, fill: '#94A3B8', fontSize: 12 }} />
        <YAxis {...AXIS} tickFormatter={(v) => v.toFixed(0)} />
        <Tooltip {...TOOLTIP} formatter={(v: number) => [v.toFixed(2), 'WCSS']} labelFormatter={(l) => `K = ${l}`} />
        <Line type="monotone" dataKey="wcss" stroke="#8B5CF6" strokeWidth={2.6} dot={{ r: 4, fill: '#8B5CF6' }} animationDuration={1000} />
        {cur && <ReferenceDot x={cur.k} y={cur.wcss} r={8} fill="#00D4FF" stroke="#080D1B" strokeWidth={2} />}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function FeatureImportanceChart({ data, color = '#3B82F6', height = 220 }: { data: { name: string; v: number }[]; color?: string; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 40, left: 10, bottom: 4 }}>
        <CartesianGrid {...GRID} horizontal={false} />
        <XAxis type="number" {...AXIS} domain={[0, 1]} tickFormatter={(v) => `${Math.round(v * 100)}%`} />
        <YAxis type="category" dataKey="name" {...AXIS} width={96} />
        <Tooltip {...TOOLTIP} formatter={(v: number) => [pctFmt(v), 'Ahamiyat']} />
        <Bar dataKey="v" fill={color} radius={[0, 6, 6, 0]} animationDuration={800} label={{ position: 'right', fill: '#CBD5E1', fontSize: 11, formatter: (v: number) => pctFmt(v, ) }} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SimpleBars({ data, color = '#00D4FF', height = 220, xKey = 'name', yKey = 'v', yLabel }: { data: Record<string, number | string>[]; color?: string; height?: number; xKey?: string; yKey?: string; yLabel?: string }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid {...GRID} vertical={false} />
        <XAxis dataKey={xKey} {...AXIS} />
        <YAxis {...AXIS} allowDecimals={false} />
        <Tooltip {...TOOLTIP} formatter={(v: number) => [v, yLabel ?? 'Soni']} />
        <Bar dataKey={yKey} fill={color} radius={[6, 6, 0, 0]} animationDuration={800} />
      </BarChart>
    </ResponsiveContainer>
  );
}
