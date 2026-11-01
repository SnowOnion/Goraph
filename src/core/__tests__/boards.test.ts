import { describe, expect, it, vi } from 'vitest';

vi.mock('@tarojs/taro', () => ({ default: {} }));

import { BOARDS } from '../boards';

describe('预设棋盘', () => {
  for (const board of BOARDS) {
    describe(board.name, () => {
      const ids = Object.keys(board.adj).map(Number);

      it('每个节点都有坐标', () => {
        for (const id of ids) expect(board.p[id], `node ${id}`).toBeDefined();
        expect(Object.keys(board.p)).toHaveLength(ids.length);
      });

      it('邻接关系对称、无自环、无重边、无悬空引用', () => {
        for (const id of ids) {
          const ns = board.adj[id];
          expect(new Set(ns).size, `node ${id} 重边`).toBe(ns.length);
          for (const n of ns) {
            expect(n, `node ${id} 自环`).not.toBe(id);
            expect(board.adj[n], `node ${id} -> ${n} 悬空`).toBeDefined();
            expect(board.adj[n], `node ${id} -> ${n} 不对称`).toContain(id);
          }
        }
      });

      it('坐标在 0..1000 内', () => {
        for (const id of ids) {
          const { x, y } = board.p[id];
          expect(x).toBeGreaterThanOrEqual(0);
          expect(x).toBeLessThanOrEqual(1000);
          expect(y).toBeGreaterThanOrEqual(0);
          expect(y).toBeLessThanOrEqual(1000);
        }
      });
    });
  }
});
