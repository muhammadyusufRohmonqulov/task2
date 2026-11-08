import type { TreeNode } from '../../algorithms/decisionTree';

export interface LaidNode {
  node: TreeNode;
  x: number;
  y: number;
  parentId: number | null;
  /** chap shox (Ha) orqali kelinganmi */
  fromLeft: boolean | null;
}

/**
 * Daraxtni tekislikka joylashtiradi: barglar chapdan o‘ngga ketma-ket slotlarga,
 * ichki tugun esa bolalarining o‘rtasiga qo‘yiladi.
 */
export function layoutTree(root: TreeNode, slotW: number, levelH: number, pad = 0): { nodes: LaidNode[]; width: number; height: number } {
  const out: LaidNode[] = [];
  let slot = 0;
  let maxDepth = 0;
  const walk = (n: TreeNode, parentId: number | null, fromLeft: boolean | null): number => {
    maxDepth = Math.max(maxDepth, n.depth);
    let x: number;
    if (n.isLeaf || !n.left || !n.right) {
      x = pad + slot * slotW + slotW / 2;
      slot++;
      out.push({ node: n, x, y: 0, parentId, fromLeft });
      out[out.length - 1].y = pad + n.depth * levelH;
      return x;
    }
    const entry: LaidNode = { node: n, x: 0, y: pad + n.depth * levelH, parentId, fromLeft };
    out.push(entry);
    const lx = walk(n.left, n.id, true);
    const rx = walk(n.right, n.id, false);
    x = (lx + rx) / 2;
    entry.x = x;
    return x;
  };
  walk(root, null, null);
  return { nodes: out, width: pad * 2 + slot * slotW, height: pad * 2 + maxDepth * levelH };
}
