import { AdjacencyList, PositionsMap } from './types';

/** 棋子半径（棋盘坐标系 0..1000）：默认 32，边较短时缩到最短边长的 0.45 倍，避免相邻棋子重叠 */
export function stoneRadius(adj: AdjacencyList, p: PositionsMap, max = 32): number {
  let minEdge = Infinity;
  for (const k in adj) {
    const a = p[Number(k)];
    if (!a) continue;
    for (const n of adj[Number(k)]) {
      const b = p[n];
      if (b) minEdge = Math.min(minEdge, Math.hypot(a.x - b.x, a.y - b.y));
    }
  }
  return Number.isFinite(minEdge) ? Math.min(max, minEdge * 0.45) : max;
}
