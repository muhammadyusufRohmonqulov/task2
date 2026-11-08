import { motion } from 'framer-motion';
import type { Label } from '../../types';
import { CLASS_COLORS } from '../../data/algorithms';

/**
 * Daraxtlar → Majority Voting oqim chizmasi. Birinchi `shown` ta daraxt tepada,
 * har birining ovozi pastdagi ovoz berish blokiga oqib tushadi.
 */
export default function ForestFlow({
  votes,
  revealed,
  final,
  totalVotes,
  prediction,
}: {
  votes: Label[];
  revealed: number;
  final: boolean;
  totalVotes: [number, number];
  prediction: Label;
}) {
  const n = votes.length;
  const W = 720;
  const H = 300;
  const gap = W / (n + 1);
  const box = { x: W / 2 - 120, y: 210, w: 240, h: 64 };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Majority voting oqimi">
      {votes.map((v, i) => {
        const x = gap * (i + 1);
        const on = i < revealed;
        const c = CLASS_COLORS[v];
        return (
          <g key={i}>
            {/* daraxt ikonkasi */}
            <g opacity={on ? 1 : 0.35}>
              <line x1={x} y1={40} x2={x - 14} y2={70} stroke="rgba(148,163,184,0.5)" />
              <line x1={x} y1={40} x2={x + 14} y2={70} stroke="rgba(148,163,184,0.5)" />
              <circle cx={x} cy={40} r={7} fill="#10B981" />
              <circle cx={x - 14} cy={72} r={5} fill="#3B82F6" />
              <circle cx={x + 14} cy={72} r={5} fill="#3B82F6" />
              <text x={x} y={20} textAnchor="middle" fontSize="11" fill="#94A3B8">
                Tree {i + 1}
              </text>
            </g>
            {on && (
              <>
                <motion.path
                  d={`M${x},96 C${x},160 ${W / 2},150 ${W / 2},${box.y}`}
                  fill="none"
                  stroke={c}
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.85 }}
                  transition={{ duration: 0.6 }}
                />
                <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ originX: `${x}px`, originY: '96px' }}>
                  <rect x={x - 20} y={84} width={40} height={22} rx={11} fill={`${c}26`} stroke={c} />
                  <text x={x} y={99} textAnchor="middle" fontSize="12" fontWeight={700} fill={c}>
                    {v}
                  </text>
                </motion.g>
              </>
            )}
          </g>
        );
      })}
      <rect x={box.x} y={box.y} width={box.w} height={box.h} rx={14} fill="#111A2E" stroke={final ? CLASS_COLORS[prediction] : 'rgba(148,163,184,0.3)'} strokeWidth={final ? 2.5 : 1.2} />
      <text x={W / 2} y={box.y + 24} textAnchor="middle" fontSize="12" fontWeight={700} fill="#F8FAFC">
        Majority Voting
      </text>
      <text x={W / 2} y={box.y + 46} textAnchor="middle" fontSize="12" fill={final ? CLASS_COLORS[prediction] : '#94A3B8'} fontWeight={final ? 700 : 400}>
        {final ? `0: ${totalVotes[0]}  ·  1: ${totalVotes[1]}  →  sinf ${prediction}` : 'ovozlar yig‘ilmoqda…'}
      </text>
    </svg>
  );
}
