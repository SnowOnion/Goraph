import { describe, expect, it } from 'vitest';
import { isOwnEye, pickAIMove } from '../ai';
import { boardHash, GamePosition, tryPlay } from '../game-engine';
import { gridAdj, newGame, setup } from './helpers';

const noRandom = () => 0;
function pos(n: number, black: number[], white: number[], next: 1 | 2): GamePosition {
  const g = newGame(gridAdj(n));
  setup(g, black, white);
  return { gameState: g.gameState, stoneStrings: g.stoneStrings, meta: { ...g.meta, next } };
}

describe('AI', () => {
  it('能提子时提子', () => {
    // 3×3：白 1 只剩一口气 4，黑 0 2 围着
    const p = pos(3, [0, 2], [1], 1);
    expect(pickAIMove(gridAdj(3), p, {}, null, undefined, noRandom)).toBe(4);
  });

  it('救被叫吃的己方棋子', () => {
    // 4×4：白 0 被黑 1 叫吃（只剩气 4），白应长到 4
    const p = pos(4, [1, 15], [0], 2);
    expect(pickAIMove(gridAdj(4), p, {}, null, undefined, noRandom)).toBe(4);
  });

  it('不填自己的眼；只剩眼位时虚手', () => {
    // 3×3：白占除 0、8 外所有点，0 与 8 都是白的真眼
    const adj = gridAdj(3);
    const p = pos(3, [], [1, 2, 3, 4, 5, 6, 7], 2);
    expect(isOwnEye(adj, p, 0, 2)).toBe(true);
    expect(pickAIMove(adj, p, {}, null, undefined, noRandom)).toBeNull();
  });

  it('遵守禁止全同再现：不立即提回劫', () => {
    const adj = gridAdj(4);
    let p = pos(4, [1, 4, 9], [2, 5, 7, 10], 1);
    const seen = new Set([boardHash(p.gameState)]);
    const r = tryPlay(adj, p, 6, seen);
    if ('error' in r) throw new Error(r.error);
    p = r.position;
    seen.add(boardHash(p.gameState));
    const move = pickAIMove(adj, p, {}, seen, undefined, noRandom);
    expect(move).not.toBe(5);
    // 不启用规则时会贪提
    expect(pickAIMove(adj, p, {}, null, undefined, noRandom)).toBe(5);
  });

  it('对方虚手且己方不落后时虚手', () => {
    const p = pos(3, [], [4], 2);
    p.meta.passed = 1;
    expect(pickAIMove(gridAdj(3), p, {}, null, undefined, noRandom)).toBeNull();
  });

  it('对方虚手但己方落后时继续下', () => {
    const p = pos(3, [4], [], 2);
    p.meta.passed = 1;
    expect(pickAIMove(gridAdj(3), p, {}, null, undefined, noRandom)).not.toBeNull();
  });

  it('level 0 随机但同样不填眼', () => {
    const adj = gridAdj(3);
    const p = pos(3, [], [1, 2, 3, 4, 5, 6, 7], 2);
    expect(pickAIMove(adj, p, {}, null, { level: 0, thinkMs: 0 }, noRandom)).toBeNull();
  });
});
