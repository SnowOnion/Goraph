import { describe, expect, it } from 'vitest';
import { boardHash, calculateScore, tryPlay, GamePosition } from '../game-engine';
import { gridAdj, newGame, setup } from './helpers';

describe('calculateScore（数子法）', () => {
  it('空棋盘：全部中立', () => {
    const g = newGame(gridAdj(3));
    expect(calculateScore(g.gameState, g.adj)).toMatchObject({ black: 0, white: 0, neutral: 9 });
  });

  it('按空域整体判定：远离棋子的空点也归属围住它的一方', () => {
    // 5×5，黑占第 1 列，白占第 3 列：
    //  . B . W .
    // 第 0 列（5 点）只碰黑 → 黑空；第 2 列碰双方 → 中立；第 4 列只碰白 → 白空
    const g = newGame(gridAdj(5));
    setup(g, [1, 6, 11, 16, 21], [3, 8, 13, 18, 23]);
    const s = calculateScore(g.gameState, g.adj);
    expect(s).toMatchObject({
      blackStones: 5, whiteStones: 5,
      blackTerritory: 5, whiteTerritory: 5, neutral: 5,
      black: 10, white: 10,
    });
  });

  it('提子数不重复计入', () => {
    const g = newGame(gridAdj(3));
    setup(g, [0, 2], [1]);
    const r = tryPlay(g.adj, { ...g, meta: { ...g.meta, next: 1 } }, 4);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.position.meta.capturedByBlack).toBe(1);
    const s = calculateScore(r.position.gameState, g.adj);
    // 黑 3 子，其余 6 个空点只碰黑
    expect(s.black).toBe(9);
    expect(s.white).toBe(0);
  });

  it('贴目加给白方', () => {
    const g = newGame(gridAdj(2));
    expect(calculateScore(g.gameState, g.adj, 0.5).white).toBe(0.5);
  });
});

describe('tryPlay', () => {
  const start = (n: number): GamePosition => {
    const g = newGame(gridAdj(n));
    return { gameState: g.gameState, stoneStrings: g.stoneStrings, meta: g.meta };
  };

  it('不修改入参，成功后轮到对方', () => {
    const p = start(3);
    const before = JSON.stringify(p.gameState);
    const r = tryPlay(gridAdj(3), p, 4);
    expect(JSON.stringify(p.gameState)).toBe(before);
    expect(r.ok && r.position.meta.next).toBe(2);
    expect(r.ok && r.position.gameState[4].s).toBe(1);
  });

  it('错误分类：occupied / suicide / ended', () => {
    const adj = gridAdj(3);
    let p = start(3);
    const r1 = tryPlay(adj, p, 4);
    if (!r1.ok) throw new Error();
    p = r1.position;
    expect(tryPlay(adj, p, 4)).toEqual({ ok: false, error: 'occupied' });

    const g = newGame(adj);
    setup(g, [1, 3], []);
    expect(tryPlay(adj, { ...g, meta: { ...g.meta, next: 2 } }, 0)).toEqual({ ok: false, error: 'suicide' });
    expect(tryPlay(adj, { ...g, meta: { ...g.meta, ended: true } }, 8)).toEqual({ ok: false, error: 'ended' });
  });

  it('禁止全同再现：打劫不能立即提回', () => {
    // 4×4 标准劫形：
    //  . B W .
    //  B W . W
    //  . B W .
    const adj = gridAdj(4);
    const g = newGame(adj);
    setup(g, [1, 4, 9], [2, 5, 7, 10]);
    let p: GamePosition = { ...g, meta: { ...g.meta, next: 1 } };
    const seen = new Set([boardHash(p.gameState)]);

    const take = tryPlay(adj, p, 6, seen); // 黑提劫
    if ('error' in take) throw new Error(take.error);
    p = take.position;
    seen.add(boardHash(p.gameState));

    // 白立即在 5 提回 → 盘面回到提劫之前，禁止
    expect(tryPlay(adj, p, 5, seen)).toEqual({ ok: false, error: 'superko' });
    // 不启用规则时允许
    expect(tryPlay(adj, p, 5, null).ok).toBe(true);
  });
});
