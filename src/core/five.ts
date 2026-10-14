/**
 * 五子棋规则检查
 * 仅在矩形棋盘上使用
 * 迁移自 legacy/script/five.js
 */

import { GameState } from './types';

/**
 * 检查是否符合五子棋结束条件。
 * 在围棋落子规则判定、生效后调用。
 *
 * @param gameStatus 游戏状态
 * @param w 棋盘宽度
 * @param h 棋盘高度
 * @param nodeID 刚下的位置
 * @returns 0=不结束, 1=黑胜, 2=白胜
 */
export function checkFiveWinning(gameState: GameState, w: number, h: number, nodeID: number): number {
  const oneToTwo = (n: number) => ({ i: Math.floor(n / w), j: n % w });
  const twoToOne = (p: { i: number; j: number }) => p.i * w + p.j;
  const inside = (p: { i: number; j: number }) => p.j >= 0 && p.j < w && p.i >= 0 && p.i < h;

  const newColor = gameState[nodeID].s;
  if (newColor === 0) return 0;

  let e0 = 0, e45 = 0, e90 = 0, e135 = 0, e180 = 0, e225 = 0, e270 = 0, e315 = 0;
  const p = oneToTwo(nodeID);

  for (let k = 1; k <= 4; k++) {
    let pp: { i: number; j: number };

    if (inside((pp = { i: p.i, j: p.j + k })) && gameState[twoToOne(pp)].s === newColor) e0++;
    if (inside((pp = { i: p.i + k, j: p.j + k })) && gameState[twoToOne(pp)].s === newColor) e45++;
    if (inside((pp = { i: p.i + k, j: p.j })) && gameState[twoToOne(pp)].s === newColor) e90++;
    if (inside((pp = { i: p.i + k, j: p.j - k })) && gameState[twoToOne(pp)].s === newColor) e135++;
    if (inside((pp = { i: p.i, j: p.j - k })) && gameState[twoToOne(pp)].s === newColor) e180++;
    if (inside((pp = { i: p.i - k, j: p.j - k })) && gameState[twoToOne(pp)].s === newColor) e225++;
    if (inside((pp = { i: p.i - k, j: p.j })) && gameState[twoToOne(pp)].s === newColor) e270++;
    if (inside((pp = { i: p.i - k, j: p.j + k })) && gameState[twoToOne(pp)].s === newColor) e315++;

    if (e0 + e180 >= 4 || e45 + e225 >= 4 || e90 + e270 >= 4 || e135 + e315 >= 4) {
      return newColor;
    }
  }
  return 0;
}
