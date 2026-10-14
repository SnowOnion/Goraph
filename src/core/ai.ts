/**
 * 围棋 AI 对手
 * 简单启发式：优先提子 > 靠近中心 > 随机
 */

import { AdjacencyList, GameState, StoneColor, StoneStringsMap } from './types';
import { validWrtRuleAndUpdate } from './game-engine';

/** AI 难度 */
export interface AIConfig {
  /** 难度：0=随机, 1=基础启发式, 2=贪心 */
  level: number;
  /** 思考延迟 (ms) */
  thinkMs: number;
}

export const DEFAULT_AI_CONFIG: AIConfig = {
  level: 1,
  thinkMs: 500,
};

/**
 * 获取所有合法落子点
 */
export function getValidMoves(
  adj: AdjacencyList,
  gameState: GameState,
  stoneStrings: StoneStringsMap,
  color: StoneColor,
): number[] {
  const moves: number[] = [];
  for (const id in adj) {
    const nodeID = parseInt(id);
    if (gameState[nodeID].s !== 0) continue;

    // 模拟落子
    const testState = cloneGameState(gameState);
    const testStrings = cloneStoneStrings(stoneStrings);
    const testMeta = { next: color, passed: 0, ended: false, _nextStoneStringID: 0 };

    const valid = validWrtRuleAndUpdate(adj, testState, testStrings, testMeta, nodeID, color);
    if (valid) {
      moves.push(nodeID);
    }
  }
  return moves;
}

/**
 * 评估落子分数
 */
function evaluateMove(
  adj: AdjacencyList,
  gameState: GameState,
  nodeID: number,
  color: StoneColor,
  positions: Record<number, { x: number; y: number }>,
): number {
  let score = 0;

  // 模拟落子看能否提掉对方棋子
  const testState = cloneGameState(gameState);
  const testStrings: StoneStringsMap = {};
  const testMeta = { next: color, passed: 0, ended: false, _nextStoneStringID: 0 };
  const valid = validWrtRuleAndUpdate(adj, testState, testStrings, testMeta, nodeID, color);

  if (!valid) return -1;

  // 提子加分
  for (const id in testState) {
    if (gameState[parseInt(id)].s !== 0 && testState[parseInt(id)].s === 0) {
      score += 10; // 提一个子加10分
    }
  }

  // 靠近中心加分
  if (positions[nodeID]) {
    const px = positions[nodeID].x;
    const py = positions[nodeID].y;
    const centerDist = Math.abs(px - 500) + Math.abs(py - 500);
    score += Math.max(0, 100 - centerDist / 5);
  }

  // 自己有气的加分
  let hasEmptyNeighbor = false;
  for (const nid of adj[nodeID]) {
    if (gameState[nid]?.s === 0) {
      hasEmptyNeighbor = true;
      break;
    }
  }
  if (hasEmptyNeighbor) score += 5;

  return score;
}

/**
 * AI 选择最佳落子
 */
export function pickAIMove(
  adj: AdjacencyList,
  gameState: GameState,
  stoneStrings: StoneStringsMap,
  color: StoneColor,
  positions: Record<number, { x: number; y: number }>,
  config: AIConfig = DEFAULT_AI_CONFIG,
): number | null {
  const validMoves = getValidMoves(adj, gameState, stoneStrings, color);
  if (validMoves.length === 0) return null;

  if (config.level === 0) {
    // 完全随机
    return validMoves[Math.floor(Math.random() * validMoves.length)];
  }

  // 启发式评分
  let bestMove = validMoves[0];
  let bestScore = -Infinity;

  for (const move of validMoves) {
    let score = evaluateMove(adj, gameState, move, color, positions);

    // 加一点随机性避免重复
    score += Math.random() * 2;

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

// 辅助函数
function cloneGameState(gs: GameState): GameState {
  const result: GameState = {};
  for (const id in gs) {
    result[parseInt(id)] = { ...gs[parseInt(id)] };
  }
  return result;
}

function cloneStoneStrings(ss: StoneStringsMap): StoneStringsMap {
  const result: StoneStringsMap = {};
  for (const id in ss) {
    const s = ss[id];
    result[id] = {
      chiSet: new Set(s.chiSet),
      nodes: new Set(s.nodes),
    };
  }
  return result;
}
