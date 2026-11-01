import { describe, expect, it } from 'vitest';
import { checkFiveWinning } from '../five';
import { gridAdj, newGame, setup } from './helpers';

describe('checkFiveWinning', () => {
  const n = 9;

  it('横向五连', () => {
    const g = newGame(gridAdj(n));
    setup(g, [10, 11, 12, 13, 14], []);
    expect(checkFiveWinning(g.gameState, n, n, 12)).toBe(1);
  });

  it('斜向五连', () => {
    const g = newGame(gridAdj(n));
    setup(g, [], [0, 10, 20, 30, 40]);
    expect(checkFiveWinning(g.gameState, n, n, 40)).toBe(2);
  });

  it('四连不算，且不跨行回绕', () => {
    const g = newGame(gridAdj(n));
    // 7 8 在第 0 行末尾，9 10 在第 1 行开头
    setup(g, [6, 7, 8, 9, 10], []);
    expect(checkFiveWinning(g.gameState, n, n, 8)).toBe(0);
  });
});
