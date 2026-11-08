import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CLUSTER_COLORS } from '../../data/algorithms';
import { niceTicks, scale } from './chartTheme';

const W = 680;
const H = 440;
const M = { l: 56, r: 18, t: 18, b: 48 };

export interface KMPoint {
  id: string;
  x: number;
  y: number;
  extra?: string;
}

/**
 * K-Means animatsiyasi uchun SVG scatter: nuqtalar klaster rangida, centroidlar yirik belgi bilan
 * va silliq harakatlanadi; biriktirish bosqichida nuqtadan centroidga chiziqlar tortiladi.
 */
export default function KMeansScatter({
  points,
  assignments,
  centroids,
  prevCentroids,
  showLines,
  showCentroids,
  focusIndex,
  onPointClick,
}: {
  points: KMPoint[];
  /** null — hali biriktirilmagan */
  assignments: number[] | null;
  centroids: { x: number; y: number }[];
  prevCentroids?: { x: number; y: number }[] | null;
  showLines: boolean;
  showCentroids: boolean;
  focusIndex?: number | null;
  onPointClick?: (i: number) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const { sx, sy, xt, yt } = useMemo(() => {
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const x0 = Math.min(...xs);
    const x1 = Math.max(...xs);
    const y0 = Math.min(...ys);
    const y1 = Math.max(...ys);
    const px = (x1 - x0) * 0.05 || 1;
    const py = (y1 - y0) * 0.06 || 1;
    return {
      sx: scale(Math.max(0, x0 - px), x1 + px, M.l, W - M.r),
      sy: scale(Math.max(0, y0 - py), y1 + py, H - M.b, M.t),
      xt: niceTicks(Math.max(0, x0 - px), x1 + px, 7),
      yt: niceTicks(Math.max(0, y0 - py), y1 + py, 6),
    };
  }, [points]);

  const hp = hover !== null ? points[hover] : null;

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full select-none" role="img" aria-label="K-Means klaster grafigi">
        <defs>
          <filter id="km-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
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
          Monthly Income — oylik daromad (mln so‘m)
        </text>
        <text transform={`translate(14 ${(M.t + H - M.b) / 2}) rotate(-90)`} textAnchor="middle" fontSize="12" fill="#CBD5E1">
          Monthly Spending — oylik xarajat (mln so‘m)
        </text>

        {/* nuqta → centroid chiziqlari */}
        {showLines && assignments && showCentroids &&
          points.map((p, i) => {
            const c = centroids[assignments[i]];
            if (!c) return null;
            return (
              <motion.line
                key={`ln-${p.id}`}
                x1={sx(p.x)}
                y1={sy(p.y)}
                initial={false}
                animate={{ x2: sx(c.x), y2: sy(c.y) }}
                transition={{ duration: 0.6 }}
                stroke={CLUSTER_COLORS[assignments[i] % CLUSTER_COLORS.length]}
                strokeOpacity={focusIndex === i ? 0.95 : 0.22}
                strokeWidth={focusIndex === i ? 2 : 1}
              />
            );
          })}

        {/* oldingi centroid izi */}
        {showCentroids && prevCentroids &&
          prevCentroids.map((pc, j) => {
            const c = centroids[j];
            if (!c) return null;
            const moved = Math.hypot(sx(pc.x) - sx(c.x), sy(pc.y) - sy(c.y)) > 1;
            return moved ? (
              <g key={`tr-${j}`}>
                <line x1={sx(pc.x)} y1={sy(pc.y)} x2={sx(c.x)} y2={sy(c.y)} stroke={CLUSTER_COLORS[j % CLUSTER_COLORS.length]} strokeWidth={1.5} strokeDasharray="3 3" opacity={0.7} />
                <circle cx={sx(pc.x)} cy={sy(pc.y)} r={6} fill="none" stroke={CLUSTER_COLORS[j % CLUSTER_COLORS.length]} strokeDasharray="2 2" opacity={0.7} />
              </g>
            ) : null;
          })}

        {/* mijozlar */}
        {points.map((p, i) => {
          const a = assignments?.[i];
          const color = a === undefined || a === null ? '#64748B' : CLUSTER_COLORS[a % CLUSTER_COLORS.length];
          return (
            <motion.circle
              key={p.id}
              cx={sx(p.x)}
              cy={sy(p.y)}
              r={focusIndex === i ? 7 : 5}
              initial={false}
              animate={{ fill: color }}
              transition={{ duration: 0.5, delay: (i % 20) * 0.01 }}
              fillOpacity={0.85}
              stroke={focusIndex === i || hover === i ? '#fff' : 'rgba(8,13,27,0.8)'}
              strokeWidth={focusIndex === i ? 2 : 1.2}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onPointClick?.(i)}
              style={{ cursor: onPointClick ? 'pointer' : 'default' }}
            />
          );
        })}

        {/* centroidlar */}
        {showCentroids &&
          centroids.map((c, j) => {
            const col = CLUSTER_COLORS[j % CLUSTER_COLORS.length];
            return (
              <motion.g
                key={`c-${j}`}
                initial={{ x: sx(c.x), y: sy(c.y), scale: 0, opacity: 0 }}
                animate={{ x: sx(c.x), y: sy(c.y), scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 90, damping: 16 }}
              >
                <circle r={18} fill={col} opacity={0.15} />
                <path d="M0,-14 L14,0 L0,14 L-14,0 Z" fill={col} stroke="#F8FAFC" strokeWidth={2.2} filter="url(#km-glow)" />
                <path d="M-5,0 L5,0 M0,-5 L0,5" stroke="#080D1B" strokeWidth={2} />
                <text y={-18} textAnchor="middle" fontSize="11" fontWeight={700} fill={col}>
                  C{j + 1}
                </text>
              </motion.g>
            );
          })}

        {hp && (
          <g pointerEvents="none">
            <rect x={Math.min(sx(hp.x) + 10, W - 180)} y={Math.max(sy(hp.y) - 54, 4)} width={168} height={46} rx={8} fill="rgba(11,17,32,0.95)" stroke="rgba(148,163,184,0.25)" />
            <text x={Math.min(sx(hp.x) + 20, W - 170)} y={Math.max(sy(hp.y) - 36, 22)} fontSize="11" fill="#F8FAFC" fontWeight={700}>
              {hp.id}
              {assignments ? ` · C${assignments[hover!] + 1}` : ''}
            </text>
            <text x={Math.min(sx(hp.x) + 20, W - 170)} y={Math.max(sy(hp.y) - 20, 38)} fontSize="10.5" fill="#94A3B8">
              {hp.x} / {hp.y} mln · {hp.extra}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
