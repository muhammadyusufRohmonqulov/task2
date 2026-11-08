import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Label } from '../../types';
import { CLASS_COLORS } from '../../data/algorithms';
import { niceTicks, scale } from './chartTheme';

export interface ScatterPoint {
  id: string;
  x: number;
  y: number;
  label: Label;
  extra?: string;
}

export interface NeighborMark {
  index: number;
  rank: number;
  distance: number;
}

const W = 680;
const H = 440;
const M = { l: 56, r: 18, t: 18, b: 48 };

/**
 * KNN uchun maxsus SVG scatter plot: X — Credit Score, Y — Monthly Income.
 * Yangi mijoz, eng yaqin K qo‘shniga tortilgan chiziqlar va skanerlash animatsiyasi.
 */
export default function KNNScatter({
  points,
  query,
  neighbors,
  revealed,
  showQuery,
  scanning,
  xLabel = 'Credit Score (ball)',
  yLabel = 'Monthly Income (mln so‘m)',
}: {
  points: ScatterPoint[];
  query: { x: number; y: number } | null;
  neighbors: NeighborMark[];
  revealed: number;
  showQuery: boolean;
  scanning: boolean;
  xLabel?: string;
  yLabel?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const { sx, sy, xt, yt } = useMemo(() => {
    const xs = points.map((p) => p.x).concat(query ? [query.x] : []);
    const ys = points.map((p) => p.y).concat(query ? [query.y] : []);
    const x0 = Math.min(...xs);
    const x1 = Math.max(...xs);
    const y0 = Math.min(...ys);
    const y1 = Math.max(...ys);
    const px = (x1 - x0) * 0.05 || 1;
    const py = (y1 - y0) * 0.06 || 1;
    const dx: [number, number] = [x0 - px, x1 + px];
    const dy: [number, number] = [Math.max(0, y0 - py), y1 + py];
    return {
      sx: scale(dx[0], dx[1], M.l, W - M.r),
      sy: scale(dy[0], dy[1], H - M.b, M.t),
      xt: niceTicks(dx[0], dx[1], 7),
      yt: niceTicks(dy[0], dy[1], 6),
    };
  }, [points, query]);

  const nbMap = useMemo(() => new Map(neighbors.map((n) => [n.index, n])), [neighbors]);
  const qx = query ? sx(query.x) : 0;
  const qy = query ? sy(query.y) : 0;
  const hp = hover !== null ? points[hover] : null;

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full select-none" role="img" aria-label="KNN scatter plot">
        <defs>
          <radialGradient id="knn-q" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="100%" stopColor="#F59E0B" />
          </radialGradient>
          <filter id="knn-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* grid + o‘qlar */}
        {xt.map((t) => (
          <g key={`x${t}`}>
            <line x1={sx(t)} x2={sx(t)} y1={M.t} y2={H - M.b} stroke="rgba(148,163,184,0.08)" />
            <text x={sx(t)} y={H - M.b + 18} textAnchor="middle" fontSize="11" fill="#94A3B8">
              {t}
            </text>
          </g>
        ))}
        {yt.map((t) => (
          <g key={`y${t}`}>
            <line x1={M.l} x2={W - M.r} y1={sy(t)} y2={sy(t)} stroke="rgba(148,163,184,0.08)" />
            <text x={M.l - 8} y={sy(t) + 4} textAnchor="end" fontSize="11" fill="#94A3B8">
              {t}
            </text>
          </g>
        ))}
        <text x={(M.l + W - M.r) / 2} y={H - 8} textAnchor="middle" fontSize="12" fill="#CBD5E1">
          {xLabel}
        </text>
        <text transform={`translate(14 ${(M.t + H - M.b) / 2}) rotate(-90)`} textAnchor="middle" fontSize="12" fill="#CBD5E1">
          {yLabel}
        </text>

        {/* skanerlash halqasi */}
        <AnimatePresence>
          {query && scanning && (
            <motion.circle
              key="scan"
              cx={qx}
              cy={qy}
              fill="none"
              stroke="#F59E0B"
              strokeWidth={1.5}
              initial={{ r: 4, opacity: 0.9 }}
              animate={{ r: 260, opacity: 0 }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
            />
          )}
        </AnimatePresence>

        {/* qo‘shnilarga chiziqlar */}
        {query &&
          neighbors
            .filter((n) => n.rank <= revealed)
            .map((n) => {
              const p = points[n.index];
              return (
                <motion.line
                  key={`l-${n.index}`}
                  x1={qx}
                  y1={qy}
                  x2={sx(p.x)}
                  y2={sy(p.y)}
                  stroke={CLASS_COLORS[p.label]}
                  strokeWidth={1.8}
                  strokeDasharray="5 4"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.9 }}
                  transition={{ duration: 0.5 }}
                />
              );
            })}

        {/* training nuqtalari */}
        {points.map((p, i) => {
          const nb = nbMap.get(i);
          const on = nb && nb.rank <= revealed;
          return (
            <g key={p.id} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} style={{ cursor: 'pointer' }}>
              {on && (
                <motion.circle
                  cx={sx(p.x)}
                  cy={sy(p.y)}
                  fill="none"
                  stroke={CLASS_COLORS[p.label]}
                  strokeWidth={2}
                  initial={{ r: 4, opacity: 0 }}
                  animate={{ r: 10, opacity: 1 }}
                />
              )}
              <circle
                cx={sx(p.x)}
                cy={sy(p.y)}
                r={on ? 6 : 4.5}
                fill={CLASS_COLORS[p.label]}
                fillOpacity={revealed > 0 && !on ? 0.28 : 0.85}
                stroke={hover === i ? '#fff' : 'rgba(8,13,27,0.8)'}
                strokeWidth={1.2}
                style={{ transition: 'all .3s' }}
              />
              {on && (
                <text x={sx(p.x) + 9} y={sy(p.y) - 9} fontSize="10" fontWeight={700} fill="#F8FAFC">
                  {nb!.rank}
                </text>
              )}
            </g>
          );
        })}

        {/* yangi mijoz */}
        <AnimatePresence>
          {query && showQuery && (
            <motion.g key="q" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} style={{ originX: `${qx}px`, originY: `${qy}px` }}>
              <circle cx={qx} cy={qy} r={16} fill="#F59E0B" opacity={0.15} />
              <path
                d={starPath(qx, qy, 11, 5)}
                fill="url(#knn-q)"
                stroke="#080D1B"
                strokeWidth={1.5}
                filter="url(#knn-glow)"
              />
              <text x={qx + 16} y={qy + 4} fontSize="11" fontWeight={700} fill="#FDE68A">
                Yangi mijoz
              </text>
            </motion.g>
          )}
        </AnimatePresence>

        {hp && (
          <g pointerEvents="none">
            <rect
              x={Math.min(sx(hp.x) + 10, W - 190)}
              y={Math.max(sy(hp.y) - 58, 4)}
              width={178}
              height={hp.extra ? 54 : 40}
              rx={8}
              fill="rgba(11,17,32,0.95)"
              stroke="rgba(148,163,184,0.25)"
            />
            <text x={Math.min(sx(hp.x) + 20, W - 180)} y={Math.max(sy(hp.y) - 40, 22)} fontSize="11" fill="#F8FAFC" fontWeight={700}>
              {hp.id} · sinf {hp.label}
            </text>
            <text x={Math.min(sx(hp.x) + 20, W - 180)} y={Math.max(sy(hp.y) - 25, 37)} fontSize="10.5" fill="#94A3B8">
              CS {hp.x} · {hp.y} mln
            </text>
            {hp.extra && (
              <text x={Math.min(sx(hp.x) + 20, W - 180)} y={Math.max(sy(hp.y) - 11, 51)} fontSize="10.5" fill="#94A3B8">
                {hp.extra}
              </text>
            )}
          </g>
        )}
      </svg>
      <div className="mt-2 flex flex-wrap items-center gap-4 px-2 text-xs text-muted">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald" /> 0 — muammosiz</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> 1 — to‘lovda muammo</span>
        <span className="flex items-center gap-1.5"><span className="text-amber-400">★</span> Yangi mijoz</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-0 w-5 border-t-2 border-dashed border-slate-400" /> Eng yaqin qo‘shni (raqam — tartib)</span>
      </div>
    </div>
  );
}

function starPath(cx: number, cy: number, R: number, r: number) {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? R : r;
    d += `${i === 0 ? 'M' : 'L'}${cx + rad * Math.cos(a)},${cy + rad * Math.sin(a)}`;
  }
  return d + 'Z';
}
