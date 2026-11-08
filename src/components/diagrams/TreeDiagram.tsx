import { useEffect, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { TreeNode } from '../../algorithms/decisionTree';
import type { Criterion } from '../../types';
import { FEATURES } from '../../data/bankDataset';
import { CLASS_COLORS } from '../../data/algorithms';
import { layoutTree } from './treeLayout';

const NODE_W = 156;
const NODE_H = 70;
const SLOT_W = 172;
const LEVEL_H = 118;

const SHORT_EN = ['Age', 'Income', 'Credit Score', 'DTI', 'Late Payments'];

export const conditionText = (feature: number, threshold: number) => {
  const name = SHORT_EN[feature] ?? FEATURES[feature].en;
  const t = Number.isInteger(threshold) ? threshold : Number(threshold.toFixed(2));
  return `${name} ≤ ${t}`;
};

/**
 * Katta interaktiv qaror daraxti. `visibleIds` — animatsiyada ochilgan tugunlar;
 * `pathIds` — yangi mijoz bosib o‘tgan tugunlar; tugun bosilsa `onSelect`.
 */
export default function TreeDiagram({
  root,
  criterion,
  visibleIds,
  pathIds,
  selectedId,
  onSelect,
}: {
  root: TreeNode;
  criterion: Criterion;
  visibleIds?: Set<number>;
  pathIds?: Set<number>;
  selectedId?: number | null;
  onSelect?: (n: TreeNode) => void;
}) {
  const { nodes, width, height } = useMemo(() => layoutTree(root, SLOT_W, LEVEL_H, 22), [root]);
  const byId = useMemo(() => new Map(nodes.map((n) => [n.node.id, n])), [nodes]);
  const W = Math.max(width, 640);
  const H = height + NODE_H + 24;
  const offsetX = (W - width) / 2;
  const vis = (id: number) => !visibleIds || visibleIds.has(id);
  const impLabel = criterion === 'gini' ? 'Gini' : 'Entropy';
  const box = useRef<HTMLDivElement>(null);
  // Katta daraxtda ildiz ko‘rinib turishi uchun gorizontal scrollni markazga qo‘yamiz
  useEffect(() => {
    const el = box.current;
    if (el) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
  }, [W]);

  return (
    <div ref={box} className="scroll-thin overflow-x-auto rounded-xl">
      <svg viewBox={`0 0 ${W} ${H}`} style={{ minWidth: Math.round(W * 0.82), width: '100%', maxWidth: W * 1.15 }} className="mx-auto h-auto select-none" role="img" aria-label="Qaror daraxti diagrammasi">
        <defs>
          <filter id="dt-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g transform={`translate(${offsetX} 0)`}>
          {/* shoxlar */}
          <AnimatePresence>
            {nodes.map((ln) => {
              if (ln.parentId === null || !vis(ln.node.id)) return null;
              const p = byId.get(ln.parentId)!;
              const onPath = pathIds?.has(ln.node.id) && pathIds?.has(p.node.id);
              const x1 = p.x;
              const y1 = p.y + NODE_H;
              const x2 = ln.x;
              const y2 = ln.y;
              const my = (y1 + y2) / 2;
              return (
                <motion.g key={`e-${ln.node.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <motion.path
                    d={`M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}`}
                    fill="none"
                    stroke={onPath ? '#F59E0B' : 'rgba(148,163,184,0.35)'}
                    strokeWidth={onPath ? 3 : 1.6}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5 }}
                    filter={onPath ? 'url(#dt-glow)' : undefined}
                  />
                  <rect x={(x1 + x2) / 2 - 18} y={my - 10} width={36} height={18} rx={9} fill="#0B1120" stroke={ln.fromLeft ? '#10B98155' : '#F43F5E55'} />
                  <text x={(x1 + x2) / 2} y={my + 3} textAnchor="middle" fontSize="10" fontWeight={700} fill={ln.fromLeft ? '#34D399' : '#FB7185'}>
                    {ln.fromLeft ? 'Ha' : 'Yo‘q'}
                  </text>
                </motion.g>
              );
            })}
          </AnimatePresence>

          {/* tugunlar */}
          <AnimatePresence>
            {nodes.map((ln) => {
              if (!vis(ln.node.id)) return null;
              const n = ln.node;
              const leaf = n.isLeaf;
              const sel = selectedId === n.id;
              const onPath = pathIds?.has(n.id);
              const c = CLASS_COLORS[n.prediction];
              const total = n.samples || 1;
              return (
                <motion.g
                  key={`n-${n.id}`}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 20 }}
                  style={{ originX: `${ln.x}px`, originY: `${ln.y + NODE_H / 2}px`, cursor: onSelect ? 'pointer' : 'default' }}
                  onClick={() => onSelect?.(n)}
                >
                  <rect
                    x={ln.x - NODE_W / 2}
                    y={ln.y}
                    width={NODE_W}
                    height={NODE_H}
                    rx={12}
                    fill={leaf ? `${c}1a` : '#111A2E'}
                    stroke={sel ? '#00D4FF' : onPath ? '#F59E0B' : leaf ? `${c}80` : 'rgba(148,163,184,0.28)'}
                    strokeWidth={sel || onPath ? 2.4 : 1.2}
                    filter={onPath ? 'url(#dt-glow)' : undefined}
                  />
                  <text x={ln.x} y={ln.y + 19} textAnchor="middle" fontSize="11.5" fontWeight={700} fill={leaf ? c : '#F8FAFC'}>
                    {leaf ? `Barg → sinf ${n.prediction}` : conditionText(n.split!.feature, n.split!.threshold)}
                  </text>
                  <text x={ln.x} y={ln.y + 36} textAnchor="middle" fontSize="10.5" fill="#94A3B8">
                    n = {n.samples} · [{n.counts[0]} / {n.counts[1]}]
                  </text>
                  <text x={ln.x} y={ln.y + 51} textAnchor="middle" fontSize="10.5" fill="#94A3B8">
                    {impLabel} = {n.impurity.toFixed(3)}
                  </text>
                  {/* sinflar ulushi chizig‘i */}
                  <rect x={ln.x - NODE_W / 2 + 10} y={ln.y + 58} width={NODE_W - 20} height={4} rx={2} fill="rgba(255,255,255,0.08)" />
                  <rect x={ln.x - NODE_W / 2 + 10} y={ln.y + 58} width={((NODE_W - 20) * n.counts[0]) / total} height={4} rx={2} fill="#10B981" />
                  <rect
                    x={ln.x - NODE_W / 2 + 10 + ((NODE_W - 20) * n.counts[0]) / total}
                    y={ln.y + 58}
                    width={((NODE_W - 20) * n.counts[1]) / total}
                    height={4}
                    rx={2}
                    fill="#F43F5E"
                  />
                  {n.depth === 0 && (
                    <text x={ln.x - NODE_W / 2} y={ln.y - 6} fontSize="10" fontWeight={700} fill="#00D4FF">
                      ROOT NODE
                    </text>
                  )}
                </motion.g>
              );
            })}
          </AnimatePresence>
        </g>
      </svg>
    </div>
  );
}
