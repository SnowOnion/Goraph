import { describe, expect, it } from 'vitest';
import { executePass, findNearestNodeID, oppoColor } from '../game-engine';
import { colors, gridAdj, newGame, play, setup } from './helpers';

describe('validWrtRuleAndUpdate', () => {
  it('落子到空点，形成单子棋串', () => {
    const g = newGame(gridAdj(3));
    expect(play(g, 4, 1)).toBe(true);
    expect(g.gameState[4].s).toBe(1);
    const ss = g.stoneStrings[g.gameState[4].stoneStringID!];
    expect([...ss.nodes]).toEqual([4]);
    expect([...ss.chiSet].sort()).toEqual([1, 3, 5, 7]);
  });

  it('相邻同色合并棋串，气为并集减去落子点', () => {
    const g = newGame(gridAdj(3));
    setup(g, [0, 2], []);
    expect(play(g, 1, 1)).toBe(true);
    const id = g.gameState[1].stoneStringID!;
    expect(g.gameState[0].stoneStringID).toBe(id);
    expect(g.gameState[2].stoneStringID).toBe(id);
    expect([...g.stoneStrings[id].nodes].sort()).toEqual([0, 1, 2]);
    expect([...g.stoneStrings[id].chiSet].sort()).toEqual([3, 4, 5]);
    expect(Object.keys(g.stoneStrings)).toHaveLength(1);
  });

  it('提掉没气的对方棋子并计数，提子后己方棋串长气', () => {
    // 3×3: 白 1，黑 0 2 → 黑 4 提白 1
    const g = newGame(gridAdj(3));
    setup(g, [0, 2], [1]);
    expect(play(g, 4, 1)).toBe(true);
    expect(g.gameState[1].s).toBe(0);
    expect(g.meta.capturedByBlack).toBe(1);
    expect(g.stoneStrings[g.gameState[0].stoneStringID!].chiSet.has(1)).toBe(true);
    expect(g.stoneStrings[g.gameState[4].stoneStringID!].chiSet.has(1)).toBe(true);
  });

  it('禁止自杀（无气且不提子）', () => {
    const g = newGame(gridAdj(3));
    setup(g, [1, 3], []);
    const before = colors(g);
    expect(play(g, 0, 2)).toBe(false);
    expect(colors(g)).toEqual(before);
  });

  it('能提子时允许“看似自杀”的落子', () => {
    // 4×4，黑 6 落下时四邻全是白子（直接气为 0），但白 5 只剩气 6，会被提
    //  .  B  W  .
    //  B  W  ·  W
    //  .  B  W  .
    const g = newGame(gridAdj(4));
    setup(g, [1, 4, 9], [2, 5, 7, 10]);
    expect(play(g, 6, 1)).toBe(true);
    expect(g.gameState[5].s).toBe(0);
    expect(g.meta.capturedByBlack).toBe(1);
  });

  it('自己的棋串还有其他气时允许填入', () => {
    const g = newGame(gridAdj(3));
    setup(g, [0], [3]);
    // 黑 1：直接气 2、4 → 合法
    expect(play(g, 1, 1)).toBe(true);
  });

  it('同时提掉多块棋', () => {
    // 3×3，白 1、白 3 都只剩气 0，黑 0 同时提两块
    const g = newGame(gridAdj(3));
    setup(g, [2, 4, 6], [1, 3]);
    expect(play(g, 0, 1)).toBe(true);
    expect(g.gameState[1].s).toBe(0);
    expect(g.gameState[3].s).toBe(0);
    expect(g.meta.capturedByBlack).toBe(2);
  });
});

describe('executePass', () => {
  it('连续两次虚手终局', () => {
    const g = newGame(gridAdj(3));
    executePass(g.meta);
    expect(g.meta.next).toBe(2);
    expect(g.meta.ended).toBe(false);
    executePass(g.meta);
    expect(g.meta.ended).toBe(true);
  });
});

describe('杂项', () => {
  it('oppoColor', () => {
    expect(oppoColor(1)).toBe(2);
    expect(oppoColor(2)).toBe(1);
  });

  it('findNearestNodeID', () => {
    const p = { 0: { x: 0, y: 0 }, 1: { x: 100, y: 0 }, 2: { x: 0, y: 100 } };
    expect(findNearestNodeID(p, 90, 10)).toBe(1);
    expect(findNearestNodeID(p, 10, 70)).toBe(2);
  });
});
