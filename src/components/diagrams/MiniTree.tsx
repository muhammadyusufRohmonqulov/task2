import { useMemo } from 'react';
import type { TreeNode } from '../../algorithms/decisionTree';
import { CLASS_COLORS } from '../../data/algorithms';
import { layoutTree } from './treeLayout';

/** Random Forest kartalari uchun kichik daraxt sxemasi; yangi mijoz yo‘li ajratib ko‘rsatiladi. */
export default function MiniTree({ root, pathIds, height = 90 }: { root: TreeNode; pathIds?: Set<number>; height?: number }) {
  const { nodes, width, h } = useMemo(() => {
    const l = layoutTree(root, 14, 18, 8);
    return { nodes: l.nodes, width: Math.max(l.width, 60), h: l.height + 8 };
  }, [root]);
  const byId = new Map(nodes.map((n) => [n.node.id, n]));
  return (
    <svg viewBox={`0 0 ${width} ${h}`} preserveAspectRatio="xMidYMid meet" style={{ height, width: '100%' }} aria-hidden>
      {nodes.map((ln) => {
        if (ln.parentId === null) return null;
        const p = byId.get(ln.parentId)!;
        const on = pathIds?.has(ln.node.id) && pathIds?.has(p.node.id);
        return <line key={`e${ln.node.id}`} x1={p.x} y1={p.y} x2={ln.x} y2={ln.y} stroke={on ? '#F59E0B' : 'rgba(148,163,184,0.3)'} strokeWidth={on ? 2.2 : 1} />;
      })}
      {nodes.map((ln) => {
        const on = pathIds?.has(ln.node.id);
        return (
          <circle
            key={`n${ln.node.id}`}
            cx={ln.x}
            cy={ln.y}
            r={ln.node.isLeaf ? 3.4 : 2.6}
            fill={ln.node.isLeaf ? CLASS_COLORS[ln.node.prediction] : '#94A3B8'}
            stroke={on ? '#F59E0B' : 'none'}
            strokeWidth={1.6}
            opacity={on || !pathIds ? 1 : 0.55}
          />
        );
      })}
    </svg>
  );
}
