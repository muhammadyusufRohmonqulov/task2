import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { AlgoId } from '../../data/algorithms';
import { mulberry32, randNormal } from '../../utils/random';

/** Hero bo‘limidagi neyron tarmoq + ma’lumotlar oqimi + analitik grafik. */
export function HeroVisual() {
  const layers = [4, 6, 6, 2];
  const W = 520;
  const H = 400;
  const nodes = layers.map((n, li) =>
    Array.from({ length: n }, (_, i) => ({ x: 70 + li * 125, y: H / 2 + (i - (n - 1) / 2) * 52, li, i })),
  );
  const edges: { a: (typeof nodes)[0][0]; b: (typeof nodes)[0][0]; k: string }[] = [];
  for (let l = 0; l < layers.length - 1; l++)
    for (const a of nodes[l]) for (const b of nodes[l + 1]) edges.push({ a, b, k: `${l}-${a.i}-${b.i}` });
  const inLabels = ['Age', 'Income', 'Score', 'DTI'];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" aria-hidden>
      <defs>
        <linearGradient id="hv-e" x1="0" x2="1">
          <stop offset="0" stopColor="#00D4FF" stopOpacity="0.5" />
          <stop offset="1" stopColor="#8B5CF6" stopOpacity="0.5" />
        </linearGradient>
        <radialGradient id="hv-n">
          <stop offset="0" stopColor="#00D4FF" />
          <stop offset="1" stopColor="#3B82F6" />
        </radialGradient>
        <filter id="hv-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {edges.map((e, idx) => (
        <line key={e.k} x1={e.a.x} y1={e.a.y} x2={e.b.x} y2={e.b.y} stroke="url(#hv-e)" strokeWidth={0.7} opacity={0.18 + ((idx * 37) % 10) / 40} />
      ))}
      {/* ma’lumot impulslari */}
      {edges
        .filter((_, i) => i % 7 === 0)
        .map((e, i) => (
          <motion.circle
            key={`p-${e.k}`}
            r={2.6}
            fill="#00D4FF"
            filter="url(#hv-glow)"
            initial={{ cx: e.a.x, cy: e.a.y, opacity: 0 }}
            animate={{ cx: [e.a.x, e.b.x], cy: [e.a.y, e.b.y], opacity: [0, 1, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: (i % 9) * 0.35, ease: 'easeInOut' }}
          />
        ))}
      {nodes.flat().map((n) => (
        <g key={`${n.li}-${n.i}`}>
          <motion.circle
            cx={n.x}
            cy={n.y}
            r={n.li === 3 ? 13 : 9}
            fill={n.li === 3 ? (n.i === 0 ? '#10B981' : '#F43F5E') : 'url(#hv-n)'}
            stroke="#080D1B"
            strokeWidth={2}
            filter="url(#hv-glow)"
            animate={{ opacity: [0.75, 1, 0.75] }}
            transition={{ duration: 2.4, repeat: Infinity, delay: (n.li + n.i) * 0.2 }}
          />
          {n.li === 0 && (
            <text x={n.x - 16} y={n.y + 4} textAnchor="end" fontSize="11" fill="#94A3B8" fontFamily="JetBrains Mono">
              {inLabels[n.i]}
            </text>
          )}
          {n.li === 3 && (
            <text x={n.x + 20} y={n.y + 4} fontSize="11" fill={n.i === 0 ? '#34D399' : '#FB7185'} fontFamily="JetBrains Mono">
              {n.i === 0 ? '0 · OK' : '1 · Risk'}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

function usePoints(seed: number, groups: { cx: number; cy: number; sd: number; n: number; c: string }[]) {
  return useMemo(() => {
    const r = mulberry32(seed);
    return groups.flatMap((g, gi) =>
      Array.from({ length: g.n }, (_, i) => ({ x: randNormal(r, g.cx, g.sd), y: randNormal(r, g.cy, g.sd), c: g.c, k: `${gi}-${i}` })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);
}

/** Algoritm kartalari ustidagi mini vizual. */
export function AlgoMiniVisual({ id }: { id: AlgoId }) {
  if (id === 'knn') return <KNNMini />;
  if (id === 'decision-tree') return <TreeMini />;
  if (id === 'random-forest') return <ForestMini />;
  return <KMeansMini />;
}

function KNNMini() {
  const pts = usePoints(7, [
    { cx: 70, cy: 60, sd: 22, n: 14, c: '#10B981' },
    { cx: 170, cy: 100, sd: 22, n: 14, c: '#F43F5E' },
  ]);
  const q = { x: 120, y: 80 };
  const near = [...pts].sort((a, b) => Math.hypot(a.x - q.x, a.y - q.y) - Math.hypot(b.x - q.x, b.y - q.y)).slice(0, 5);
  return (
    <svg viewBox="0 0 240 150" className="h-full w-full" aria-hidden>
      <motion.circle cx={q.x} cy={q.y} fill="none" stroke="#F59E0B" strokeWidth={1} initial={{ r: 4, opacity: 0.8 }} animate={{ r: 48, opacity: 0 }} transition={{ duration: 2, repeat: Infinity }} />
      {near.map((p, i) => (
        <motion.line key={p.k} x1={q.x} y1={q.y} x2={p.x} y2={p.y} stroke={p.c} strokeDasharray="3 3" initial={{ pathLength: 0 }} animate={{ pathLength: [0, 1, 1, 0] }} transition={{ duration: 3, repeat: Infinity, delay: i * 0.15 }} />
      ))}
      {pts.map((p) => (
        <circle key={p.k} cx={p.x} cy={p.y} r={3.2} fill={p.c} opacity={0.85} />
      ))}
      <circle cx={q.x} cy={q.y} r={6} fill="#F59E0B" stroke="#080D1B" strokeWidth={2} />
    </svg>
  );
}

function TreeMini() {
  const N = [
    { x: 120, y: 22, c: '#3B82F6' },
    { x: 65, y: 68, c: '#3B82F6' },
    { x: 175, y: 68, c: '#3B82F6' },
    { x: 35, y: 118, c: '#10B981' },
    { x: 95, y: 118, c: '#F43F5E' },
    { x: 150, y: 118, c: '#10B981' },
    { x: 205, y: 118, c: '#F43F5E' },
  ];
  const E = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]];
  return (
    <svg viewBox="0 0 240 150" className="h-full w-full" aria-hidden>
      {E.map(([a, b], i) => (
        <motion.line key={i} x1={N[a].x} y1={N[a].y} x2={N[b].x} y2={N[b].y} stroke="rgba(148,163,184,0.5)" strokeWidth={1.4} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.3 + i * 0.18, repeat: Infinity, repeatDelay: 3, repeatType: 'reverse' }} />
      ))}
      {N.map((n, i) => (
        <motion.rect key={i} x={n.x - 16} y={n.y - 9} width={32} height={18} rx={5} fill={`${n.c}30`} stroke={n.c} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.16 }} style={{ originX: `${n.x}px`, originY: `${n.y}px` }} />
      ))}
    </svg>
  );
}

function ForestMini() {
  const trees = [30, 75, 120, 165, 210];
  return (
    <svg viewBox="0 0 240 150" className="h-full w-full" aria-hidden>
      {trees.map((x, t) => (
        <g key={x}>
          <line x1={x} y1={22} x2={x - 13} y2={52} stroke="rgba(148,163,184,0.5)" />
          <line x1={x} y1={22} x2={x + 13} y2={52} stroke="rgba(148,163,184,0.5)" />
          <circle cx={x} cy={22} r={5} fill="#10B981" />
          <circle cx={x - 13} cy={52} r={4} fill={t % 2 ? '#F43F5E' : '#10B981'} />
          <circle cx={x + 13} cy={52} r={4} fill={t % 3 ? '#10B981' : '#F43F5E'} />
          <motion.line x1={x} y1={64} x2={120} y2={118} stroke="#10B981" strokeDasharray="3 3" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.8 }} transition={{ delay: 0.3 + t * 0.25, duration: 0.5, repeat: Infinity, repeatDelay: 2.5 }} />
        </g>
      ))}
      <rect x={88} y={112} width={64} height={24} rx={8} fill="#10B98122" stroke="#10B981" />
      <text x={120} y={128} textAnchor="middle" fontSize="10" fill="#34D399" fontWeight={700}>
        VOTE
      </text>
    </svg>
  );
}

function KMeansMini() {
  const pts = usePoints(11, [
    { cx: 60, cy: 50, sd: 14, n: 12, c: '#00D4FF' },
    { cx: 175, cy: 45, sd: 14, n: 12, c: '#8B5CF6' },
    { cx: 115, cy: 112, sd: 14, n: 12, c: '#10B981' },
  ]);
  const cs = [
    { s: [110, 70], e: [60, 50], c: '#00D4FF' },
    { s: [130, 60], e: [175, 45], c: '#8B5CF6' },
    { s: [120, 90], e: [115, 112], c: '#10B981' },
  ];
  return (
    <svg viewBox="0 0 240 150" className="h-full w-full" aria-hidden>
      {pts.map((p) => (
        <motion.circle key={p.k} cx={p.x} cy={p.y} r={3.2} initial={{ fill: '#64748B' }} animate={{ fill: ['#64748B', p.c, p.c, '#64748B'] }} transition={{ duration: 4, repeat: Infinity, times: [0, 0.35, 0.85, 1] }} />
      ))}
      {cs.map((c, i) => (
        <motion.path key={i} d="M0,-7 L7,0 L0,7 L-7,0 Z" fill={c.c} stroke="#080D1B" strokeWidth={1.5} initial={{ x: c.s[0], y: c.s[1] }} animate={{ x: [c.s[0], c.e[0], c.e[0], c.s[0]], y: [c.s[1], c.e[1], c.e[1], c.s[1]] }} transition={{ duration: 4, repeat: Infinity, times: [0, 0.35, 0.85, 1] }} />
      ))}
    </svg>
  );
}
