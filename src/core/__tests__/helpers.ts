import { AdjacencyList, GameMeta, GameState, StoneColor, StoneStringsMap } from '../types';
import { initGameMeta, initGameState, initStoneStrings, validWrtRuleAndUpdate } from '../game-engine';

/** n×n 网格邻接表（与 boards.ts 的编号一致：id = n*i + j） */
export function gridAdj(n: number): AdjacencyList {
  const adj: AdjacencyList = {};
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const id = n * i + j;
      adj[id] = [];
      if (j > 0) adj[id].push(id - 1);
      if (j < n - 1) adj[id].push(id + 1);
      if (i > 0) adj[id].push(id - n);
      if (i < n - 1) adj[id].push(id + n);
    }
  }
  return adj;
}

export interface Game {
  adj: AdjacencyList;
  gameState: GameState;
  stoneStrings: StoneStringsMap;
  meta: GameMeta;
}

export function newGame(adj: AdjacencyList): Game {
  return { adj, gameState: initGameState(adj), stoneStrings: initStoneStrings(), meta: initGameMeta() };
}

export function play(g: Game, nodeID: number, color: StoneColor): boolean {
  return validWrtRuleAndUpdate(g.adj, g.gameState, g.stoneStrings, g.meta, nodeID, color);
}

/** 依次落子，全部必须合法 */
export function setup(g: Game, black: number[], white: number[]): void {
  for (const id of black) if (!play(g, id, 1)) throw new Error(`black ${id} illegal`);
  for (const id of white) if (!play(g, id, 2)) throw new Error(`white ${id} illegal`);
}

export function colors(g: Game): StoneColor[] {
  return Object.keys(g.gameState).map((k) => g.gameState[Number(k)].s);
}
