import { describe, expect, it } from 'vitest';
import { calculateScore, connectedGroup } from '../game-engine';
import { gridAdj, newGame, setup } from './helpers';

describe('终局点死子', () => {
  // 5×5：黑占第 1 列，白占第 3 列，白方空里还有一颗黑子 14（第 2 行第 4 列）
  //  . B . W .
  //  . B . W .
  //  . B . W B   <- 14 是死子
  //  . B . W .
  //  . B . W .
  function board() {
    const g = newGame(gridAdj(5));
    setup(g, [1, 6, 11, 16, 21, 14], [3, 8, 13, 18, 23]);
    return g;
  }

  it('不标死子时，死子所在空域变成中立', () => {
    const g = board();
    const s = calculateScore(g.gameState, g.adj);
    expect(s.whiteTerritory).toBe(0);
    expect(s.black).toBe(6 + 5);
    expect(s.white).toBe(5);
  });

  it('标为死子后，该子与其所在空域都归白', () => {
    const g = board();
    const s = calculateScore(g.gameState, g.adj, 0, new Set([14]));
    expect(s).toMatchObject({ deadBlack: 1, deadWhite: 0, blackStones: 5, whiteTerritory: 5, black: 10, white: 10 });
  });

  it('connectedGroup 返回同色相连整块', () => {
    const g = board();
    expect(connectedGroup(g.gameState, g.adj, 6).sort((a, b) => a - b)).toEqual([1, 6, 11, 16, 21]);
    expect(connectedGroup(g.gameState, g.adj, 14)).toEqual([14]);
    expect(connectedGroup(g.gameState, g.adj, 0)).toEqual([]);
  });
});
