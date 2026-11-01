/**
 * 围棋游戏引擎
 * 框架无关，纯逻辑，可在任何环境运行
 * 迁移自 legacy/script/index.js 的核心算法部分
 */

import { AdjacencyList, PositionsMap, StoneColor, GameState, StoneStringsMap, GameMeta } from './types';

export type { GameMeta } from './types';

export function oppoColor(color: StoneColor): StoneColor {
  return (3 - color) as StoneColor;
}

export function isEmpty(color: StoneColor): boolean {
  return color === 0;
}

/** 计算棋盘状态哈希（用于禁止全同再现规则） */
export function boardHash(gameState: GameState): string {
  let hash = '';
  for (const id in gameState) {
    hash += gameState[parseInt(id)].s;
  }
  return hash;
}

/** 终局计分明细 */
export interface ScoreDetail {
  black: number;
  white: number;
  blackStones: number;
  whiteStones: number;
  blackTerritory: number;
  whiteTerritory: number;
  /** 不属于任何一方的空点（单官 / 公气） */
  neutral: number;
  komi: number;
}

/**
 * 数子法计分（中国规则 / Tromp-Taylor 面积计分）：
 * 得分 = 盘上己方棋子数 + 只与己方棋子相邻的空域大小（白方另加贴目）。
 * 空域按连通块整体判定，与双方都相邻或不与任何棋子相邻的空域算中立。
 * 提子数不计入：数子法下提子已体现在盘面上。
 */
export function calculateScore(gameState: GameState, adj: AdjacencyList, komi = 0): ScoreDetail {
  let blackStones = 0;
  let whiteStones = 0;
  let blackTerritory = 0;
  let whiteTerritory = 0;
  let neutral = 0;
  const visited = new Set<number>();

  for (const id in gameState) {
    const start = parseInt(id);
    const s = gameState[start].s;
    if (s === 1) { blackStones++; continue; }
    if (s === 2) { whiteStones++; continue; }
    if (visited.has(start)) continue;

    let size = 0;
    let touchesBlack = false;
    let touchesWhite = false;
    const stack = [start];
    visited.add(start);
    while (stack.length) {
      const n = stack.pop()!;
      size++;
      for (const m of adj[n] || []) {
        const ms = gameState[m].s;
        if (ms === 1) touchesBlack = true;
        else if (ms === 2) touchesWhite = true;
        else if (!visited.has(m)) {
          visited.add(m);
          stack.push(m);
        }
      }
    }
    if (touchesBlack && !touchesWhite) blackTerritory += size;
    else if (touchesWhite && !touchesBlack) whiteTerritory += size;
    else neutral += size;
  }

  return {
    black: blackStones + blackTerritory,
    white: whiteStones + whiteTerritory + komi,
    blackStones,
    whiteStones,
    blackTerritory,
    whiteTerritory,
    neutral,
    komi,
  };
}

export function cloneGameState(gs: GameState): GameState {
  const result: GameState = {};
  for (const id in gs) {
    result[parseInt(id)] = { ...gs[parseInt(id)] };
  }
  return result;
}

export function cloneStoneStrings(ss: StoneStringsMap): StoneStringsMap {
  const result: StoneStringsMap = {};
  for (const id in ss) {
    const s = ss[parseInt(id)];
    result[parseInt(id)] = { chiSet: new Set(s.chiSet), nodes: new Set(s.nodes) };
  }
  return result;
}

/** 一个完整局面：盘面 + 棋串 + 元数据 */
export interface GamePosition {
  gameState: GameState;
  stoneStrings: StoneStringsMap;
  meta: GameMeta;
}

export type MoveError = 'ended' | 'occupied' | 'suicide' | 'superko';

export type PlayResult =
  | { ok: true; position: GamePosition }
  | { ok: false; error: MoveError };

/**
 * 不修改入参地尝试让 meta.next 一方在 nodeID 落子。
 * seenHashes 非空时启用「禁止全同再现」（位置超级劫）：落子后的盘面不得与其中任何一个相同。
 * 成功时返回的新局面已轮到对方、passed 清零。
 */
export function tryPlay(
  adj: AdjacencyList,
  position: GamePosition,
  nodeID: number,
  seenHashes: Set<string> | null = null,
): PlayResult {
  const { gameState, stoneStrings, meta } = position;
  if (meta.ended) return { ok: false, error: 'ended' };
  if (gameState[nodeID]?.s !== 0) return { ok: false, error: 'occupied' };

  const next: GamePosition = {
    gameState: cloneGameState(gameState),
    stoneStrings: cloneStoneStrings(stoneStrings),
    meta: { ...meta },
  };
  if (!validWrtRuleAndUpdate(adj, next.gameState, next.stoneStrings, next.meta, nodeID, meta.next)) {
    return { ok: false, error: 'suicide' };
  }
  if (seenHashes && seenHashes.has(boardHash(next.gameState))) {
    return { ok: false, error: 'superko' };
  }
  flip(next.meta);
  next.meta.passed = 0;
  return { ok: true, position: next };
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
  return { next: 1, passed: 0, ended: false, _nextStoneStringID: 0, capturedByBlack: 0, capturedByWhite: 0 };
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
  affectOpponents(adj, gameState, stoneStrings, meta, nodeID, color, neighborOppoSSs);

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
  meta: GameMeta,
  nodeID: number,
  newStoneColor: StoneColor,
  neighborOppoSSs: Set<number>,
): void {
  for (const ssid of neighborOppoSSs) {
    if (!stoneStrings[ssid]) continue;
    stoneStrings[ssid].chiSet.delete(nodeID);
    if (stoneStrings[ssid].chiSet.size === 0) {
      const captured = stoneStrings[ssid].nodes.size;
      removeStoneString(adj, gameState, stoneStrings, ssid, oppoColor(newStoneColor));
      delete stoneStrings[ssid];
      // 统计提子
      if (newStoneColor === 1) {
        meta.capturedByBlack += captured;
      } else {
        meta.capturedByWhite += captured;
      }
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
