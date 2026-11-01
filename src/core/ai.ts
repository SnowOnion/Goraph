/**
 * 围棋 AI 对手：单步启发式
 * 提子 > 救自己被叫吃的子 > 叫吃对方 > 靠近中心；不填自己的眼，避免自紧气；无好棋可下时虚手。
 */

import { AdjacencyList, PositionsMap, StoneColor } from './types';
import { calculateScore, GamePosition, oppoColor, tryPlay } from './game-engine';

export interface AIConfig {
  /** 难度：0=随机（仍不填眼）, 1=启发式 */
  level: number;
  /** 思考延迟 (ms) */
  thinkMs: number;
}

export const DEFAULT_AI_CONFIG: AIConfig = {
  level: 1,
  thinkMs: 500,
};

/** 低于此分数的着法（自紧气送吃等）不如虚手 */
const PASS_THRESHOLD = -10;

function libertiesAt(position: GamePosition, nodeID: number): number {
  const sid = position.gameState[nodeID].stoneStringID;
  return position.stoneStrings[sid]?.chiSet.size ?? 0;
}

/** nodeID 是 color 的眼：所有邻点都是己方棋子（且邻点不全是同一个单气棋串的气，避免把「假眼送吃」当真眼） */
export function isOwnEye(adj: AdjacencyList, position: GamePosition, nodeID: number, color: StoneColor): boolean {
  const nbrs = adj[nodeID];
  if (nbrs.length === 0) return false;
  for (const n of nbrs) {
    if (position.gameState[n].s !== color) return false;
  }
  return nbrs.every((n) => libertiesAt(position, n) > 1);
}

export interface ScoredMove {
  nodeID: number;
  score: number;
}

/** 列出当前行棋方所有合法（含禁止全同再现）且不填己眼的着法及其评分 */
export function scoreMoves(
  adj: AdjacencyList,
  position: GamePosition,
  positions: PositionsMap,
  seenHashes: Set<string> | null,
): ScoredMove[] {
  const color = position.meta.next;
  const oppo = oppoColor(color);
  const capturedKey = color === 1 ? 'capturedByBlack' : 'capturedByWhite';
  const result: ScoredMove[] = [];

  for (const key in adj) {
    const nodeID = Number(key);
    if (position.gameState[nodeID].s !== 0) continue;
    if (isOwnEye(adj, position, nodeID, color)) continue;

    const r = tryPlay(adj, position, nodeID, seenHashes);
    if ('error' in r) continue;
    const after = r.position;

    let score = 0;
    const captured = after.meta[capturedKey] - position.meta[capturedKey];
    score += captured * 10;

    const myLibs = libertiesAt(after, nodeID);
    if (captured === 0) {
      if (myLibs === 1) score -= 30;
      else if (myLibs === 2) score -= 2;
    }

    const seenOwn = new Set<number>();
    const seenOppo = new Set<number>();
    for (const n of adj[nodeID]) {
      const before = position.gameState[n];
      if (before.s === color && !seenOwn.has(before.stoneStringID)) {
        seenOwn.add(before.stoneStringID);
        const size = position.stoneStrings[before.stoneStringID].nodes.size;
        if (libertiesAt(position, n) === 1 && myLibs >= 2) score += 8 * size;
      }
      const now = after.gameState[n];
      if (now.s === oppo && !seenOppo.has(now.stoneStringID)) {
        seenOppo.add(now.stoneStringID);
        if (libertiesAt(after, n) === 1) score += 6;
      }
    }

    const p = positions[nodeID];
    if (p) {
      const centerDist = Math.abs(p.x - 500) + Math.abs(p.y - 500);
      score += Math.max(0, 3 - centerDist / 300);
    }

    result.push({ nodeID, score });
  }
  return result;
}

/**
 * 为 position.meta.next 一方选一手；返回 null 表示虚手。
 * 对方刚虚手且按数子法己方不落后时，也虚手以结束对局。
 */
export function pickAIMove(
  adj: AdjacencyList,
  position: GamePosition,
  positions: PositionsMap,
  seenHashes: Set<string> | null = null,
  config: AIConfig = DEFAULT_AI_CONFIG,
  random: () => number = Math.random,
): number | null {
  const color = position.meta.next;
  if (position.meta.passed > 0) {
    const s = calculateScore(position.gameState, adj);
    const lead = color === 1 ? s.black - s.white : s.white - s.black;
    if (lead >= 0) return null;
  }

  const moves = scoreMoves(adj, position, positions, seenHashes);
  if (moves.length === 0) return null;

  if (config.level === 0) {
    return moves[Math.floor(random() * moves.length)].nodeID;
  }

  let best: ScoredMove | null = null;
  for (const m of moves) {
    const s = m.score + random();
    if (!best || s > best.score) best = { nodeID: m.nodeID, score: s };
  }
  return best && best.score > PASS_THRESHOLD ? best.nodeID : null;
}
