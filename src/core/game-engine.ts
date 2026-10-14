/**
 * 围棋游戏引擎
 * 框架无关，纯逻辑，可在任何环境运行
 * 迁移自 legacy/script/index.js 的核心算法部分
 */

import { AdjacencyList, PositionsMap, StoneColor, GameState, StoneStringsMap } from './types';

/** 对局元数据 */
export interface GameMeta {
  next: StoneColor;
  passed: number;
  ended: boolean;
  _nextStoneStringID: number;
}

export function oppoColor(color: StoneColor): StoneColor {
  return (3 - color) as StoneColor;
}

export function isEmpty(color: StoneColor): boolean {
  return color === 0;
}

/** 初始化游戏状态 */
export function initGameState(adj: AdjacencyList): GameState {
  const state: GameState = {};
  for (const id in adj) {
    state[parseInt(id)] = { s: 0, stoneStringID: null };
  }
  return state;
}

/** 初始化元数据 */
export function initGameMeta(): GameMeta {
  return { next: 1, passed: 0, ended: false, _nextStoneStringID: 0 };
}

/** 初始化棋串映射 */
export function initStoneStrings(): StoneStringsMap {
  return {};
}

/** 翻转下一手颜色 */
export function flip(meta: GameMeta): void {
  meta.next = oppoColor(meta.next);
}

/** 分配下一个棋串 ID */
function allocStoneStringID(meta: GameMeta): number {
  return meta._nextStoneStringID++;
}

/** 找到坐标最近的节点 */
export function findNearestNodeID(positions: PositionsMap, xn: number, yn: number): number {
  let dSquare = Number.MAX_VALUE;
  let result = 0;
  for (const id in positions) {
    const node = positions[parseInt(id)];
    const dx = node.x - xn;
    const dy = node.y - yn;
    const newDSquare = dx * dx + dy * dy;
    if (newDSquare < dSquare) {
      dSquare = newDSquare;
      result = parseInt(id);
    }
  }
  return result;
}

/**
 * 验证落子合法性并更新状态。
 * 若合法返回 true，否则返回 false（状态不变）。
 */
export function validWrtRuleAndUpdate(
  adj: AdjacencyList,
  gameState: GameState,
  stoneStrings: StoneStringsMap,
  meta: GameMeta,
  nodeID: number,
  color: StoneColor,
): boolean {
  // 1. 找出邻居棋串和直接气数
  const neighborMySSs = new Set<number>();
  const neighborOppoSSs = new Set<number>();
  let directChi = 0;

  for (const nid of adj[nodeID]) {
    const neighborColor = gameState[nid].s;
    const neighborSSID = gameState[nid].stoneStringID;
    if (color === neighborColor) {
      neighborMySSs.add(neighborSSID!);
    } else if (color === oppoColor(neighborColor)) {
      neighborOppoSSs.add(neighborSSID!);
    } else {
      directChi++;
    }
  }

  // 2. 检查能否提掉敌方棋子
  const existsEnemyToRemove = [...neighborOppoSSs].some(
    (ssid) => stoneStrings[ssid] && stoneStrings[ssid].chiSet.size === 1,
  );

  // 3. 检查是否有己方棋串气 ≥ 2
  const existsFriendChiMoreThanTwo = [...neighborMySSs].some(
    (ssid) => stoneStrings[ssid] && stoneStrings[ssid].chiSet.size >= 2,
  );

  const validMove = directChi > 0 || existsEnemyToRemove || existsFriendChiMoreThanTwo;
  if (!validMove) return false;

  // 4. 构建/合并己方棋串
  buildOrMergeSS(adj, gameState, stoneStrings, meta, nodeID, color, neighborMySSs);

  // 5. 给敌方紧气，可能提子
  affectOpponents(adj, gameState, stoneStrings, nodeID, color, neighborOppoSSs);

  return true;
}

/** 计算单个新落子的气集合 */
function calcNewStoneChiSet(adj: AdjacencyList, gameState: GameState, nodeID: number): Set<number> {
  return new Set(adj[nodeID].filter((nid) => isEmpty(gameState[nid].s)));
}

/** 构建或合并己方棋串 */
function buildOrMergeSS(
  adj: AdjacencyList,
  gameState: GameState,
  stoneStrings: StoneStringsMap,
  meta: GameMeta,
  nodeID: number,
  color: StoneColor,
  neighborMySSs: Set<number>,
): void {
  const newStoneChiSet = calcNewStoneChiSet(adj, gameState, nodeID);
  const newSSID = allocStoneStringID(meta);
  gameState[nodeID].s = color;
  gameState[nodeID].stoneStringID = newSSID;

  if (neighborMySSs.size === 0) {
    stoneStrings[newSSID] = { chiSet: newStoneChiSet, nodes: new Set([nodeID]) };
  } else {
    const newNodeSet = new Set<number>([nodeID]);
    const newChiSet = new Set(newStoneChiSet);

    for (const ssid of neighborMySSs) {
      if (!stoneStrings[ssid]) continue;
      stoneStrings[ssid].nodes.forEach((nid) => {
        newNodeSet.add(nid);
        gameState[nid].stoneStringID = newSSID;
      });
      stoneStrings[ssid].chiSet.forEach((chiEle) => newChiSet.add(chiEle));
      delete stoneStrings[ssid];
    }

    newChiSet.delete(nodeID);
    stoneStrings[newSSID] = { chiSet: newChiSet, nodes: newNodeSet };
  }
}

/** 影响敌方：紧气并可能提子 */
function affectOpponents(
  adj: AdjacencyList,
  gameState: GameState,
  stoneStrings: StoneStringsMap,
  nodeID: number,
  newStoneColor: StoneColor,
  neighborOppoSSs: Set<number>,
): void {
  for (const ssid of neighborOppoSSs) {
    if (!stoneStrings[ssid]) continue;
    stoneStrings[ssid].chiSet.delete(nodeID);
    if (stoneStrings[ssid].chiSet.size === 0) {
      removeStoneString(adj, gameState, stoneStrings, ssid, oppoColor(newStoneColor));
      delete stoneStrings[ssid];
    }
  }
}

/** 提掉指定棋串的所有棋子 */
function removeStoneString(
  adj: AdjacencyList,
  gameState: GameState,
  stoneStrings: StoneStringsMap,
  ssidToRemove: number,
  colorToRemove: StoneColor,
): void {
  stoneStrings[ssidToRemove].nodes.forEach((nid) => {
    gameState[nid].s = 0;
    gameState[nid].stoneStringID = null;

    // 影响我方（敌的敌）邻居棋串的气
  const neighborMySSs = new Set<number>();
  for (const neighborId of adj[nid]) {
      const neighborColor = gameState[neighborId].s;
      if (colorToRemove === oppoColor(neighborColor)) {
        const neighborSSID = gameState[neighborId].stoneStringID;
        if (neighborSSID !== null) {
          neighborMySSs.add(neighborSSID);
        }
      }
    }

    neighborMySSs.forEach((ssid) => {
      if (stoneStrings[ssid]) {
        stoneStrings[ssid].chiSet.add(nid);
      }
    });
  });
}

/** 执行一手 pass */
export function executePass(meta: GameMeta): void {
  flip(meta);
  meta.passed++;
  if (meta.passed >= 2) {
    meta.ended = true;
  }
}

/** 重新开始游戏 */
export function resetGame(
  adj: AdjacencyList,
  gameState: GameState,
  stoneStrings: StoneStringsMap,
  meta: GameMeta,
): void {
  // 重置所有节点
  for (const id in gameState) {
    gameState[parseInt(id)] = { s: 0, stoneStringID: null };
  }
  // 清空棋串
  for (const key in stoneStrings) {
    delete stoneStrings[parseInt(key)];
  }
  // 重置元数据
  meta.next = 1;
  meta.passed = 0;
  meta.ended = false;
  meta._nextStoneStringID = 0;
}
