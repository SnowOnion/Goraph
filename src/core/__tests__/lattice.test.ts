import { describe, expect, it, vi } from 'vitest';

vi.mock('@tarojs/taro', () => ({ default: {} }));

import { buildHexagonBoard, buildHoneycombBoard, buildTriangleBoard } from '../boards';
import { stoneRadius } from '../geometry';
import { gridAdj } from './helpers';

const degrees = (adj: Record<number, number[]>) => Object.values(adj).map((ns) => ns.length);
const count = (xs: number[], v: number) => xs.filter((x) => x === v).length;

describe('晶格棋盘', () => {
  it('六边形边长 n：3n(n-1)+1 点，6 个角各 3 邻，内部 6 邻', () => {
    const { adj, p } = buildHexagonBoard(5);
    const d = degrees(adj);
    expect(d).toHaveLength(61);
    expect(count(d, 3)).toBe(6);
    expect(count(d, 6)).toBe(3 * 4 * 3 + 1); // 内部是边长 4 的六边形：37 点
    expect(Math.max(...d)).toBe(6);
    // 中心点在棋盘正中
    const center = Object.keys(adj).map(Number).find((id) => Math.hypot(p[id].x - 500, p[id].y - 500) < 1);
    expect(center).toBeDefined();
  });

  it('三角形边长 n：n(n+1)/2 点，3 个角各 2 邻', () => {
    const d = degrees(buildTriangleBoard(8).adj);
    expect(d).toHaveLength(36);
    expect(count(d, 2)).toBe(3);
    expect(Math.max(...d)).toBe(6);
  });

  it('蜂巢半径 R：顶点数 6(R+1)²，每点 2 或 3 邻，满足欧拉公式', () => {
    const { adj } = buildHoneycombBoard(2);
    const d = degrees(adj);
    expect(d).toHaveLength(54);
    expect(d.every((x) => x === 2 || x === 3)).toBe(true);
    // 欧拉公式：V - E + F = 2，F = 19 个六边形 + 外部
    const E = d.reduce((a, b) => a + b, 0) / 2;
    expect(54 - E + 20).toBe(2);
  });

  it('等边：所有边长度相同', () => {
    for (const { adj, p } of [buildHexagonBoard(4), buildTriangleBoard(5), buildHoneycombBoard(1)]) {
      const lens = new Set<string>();
      for (const k in adj) for (const n of adj[k]) {
        lens.add(Math.hypot(p[k].x - p[n].x, p[k].y - p[n].y).toFixed(3));
      }
      expect(lens.size).toBe(1);
    }
  });
});

describe('stoneRadius', () => {
  it('边足够长时取上限 32', () => {
    const adj = gridAdj(2);
    const p = { 0: { x: 0, y: 0 }, 1: { x: 200, y: 0 }, 2: { x: 0, y: 200 }, 3: { x: 200, y: 200 } };
    expect(stoneRadius(adj, p)).toBe(32);
  });

  it('边短时按最短边缩小，相邻棋子不重叠', () => {
    const { adj, p } = buildHexagonBoard(10);
    const r = stoneRadius(adj, p);
    expect(r).toBeLessThan(32);
    expect(2 * r).toBeLessThan(Math.hypot(p[0].x - p[adj[0][0]].x, p[0].y - p[adj[0][0]].y));
  });
});
