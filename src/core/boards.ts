/**
 * 预设棋盘数据
 * 迁移自 legacy/script/boards.js
 */

import { AdjacencyList, PositionsMap, Board } from './types';
import { getSavedBoards } from './storage';

/* ------------------------------------------------------------------ */
/*  福                                                                 */
/* ------------------------------------------------------------------ */
const adj福: AdjacencyList = {
  0: [1, 3],
  1: [0, 2, 3, 4],
  2: [1, 4],
  3: [0, 1, 5, 6],
  4: [1, 2, 6, 7],
  5: [3, 6],
  6: [3, 4, 5, 7],
  7: [4, 6],
};

const positions福: PositionsMap = {
  0: { x: 250, y: 250 },
  1: { x: 500, y: 250 },
  2: { x: 750, y: 250 },
  3: { x: 250, y: 500 },
  4: { x: 750, y: 500 },
  5: { x: 250, y: 750 },
  6: { x: 500, y: 750 },
  7: { x: 750, y: 750 },
};

/* ------------------------------------------------------------------ */
/*  玫瑰                                                               */
/* ------------------------------------------------------------------ */
const adj玫瑰: AdjacencyList = {
  0: [1, 3],
  1: [0, 2, 8, 9],
  2: [1, 4],
  3: [0, 8, 10, 5],
  4: [2, 9, 11, 7],
  5: [3, 6],
  6: [10, 11, 5, 7],
  7: [4, 6],
  8: [1, 9, 10, 3],
  9: [1, 8, 11, 4],
  10: [3, 8, 11, 6],
  11: [9, 4, 10, 6],
};

const positions玫瑰: PositionsMap = {
  0: { x: 250, y: 250 },
  1: { x: 500, y: 250 },
  2: { x: 750, y: 250 },
  3: { x: 250, y: 500 },
  4: { x: 750, y: 500 },
  5: { x: 250, y: 750 },
  6: { x: 500, y: 750 },
  7: { x: 750, y: 750 },
  8: { x: 375, y: 375 },
  9: { x: 625, y: 375 },
  10: { x: 375, y: 625 },
  11: { x: 625, y: 625 },
};

/* ------------------------------------------------------------------ */
/*  囧                                                                 */
/* ------------------------------------------------------------------ */
const adj囧: AdjacencyList = {
  0: [1, 4],
  1: [0, 4, 2],
  2: [1, 3, 5],
  3: [2, 5],
  4: [0, 1, 8],
  5: [3, 2, 11],
  6: [7, 9],
  7: [6, 10],
  8: [4, 9],
  9: [8, 6, 10],
  10: [9, 7, 11],
  11: [5, 10],
};

function build囧Positions(padding: number): PositionsMap {
  padding = padding || 200;
  const l = 1000 - 2 * padding;
  const d5 = l / 5;
  const d3 = l / 3;

  const raw: Record<number, { x: number; y: number }> = {
    0: { x: 0, y: 0 },
    1: { x: 2 * d5, y: 0 },
    2: { x: 3 * d5, y: 0 },
    3: { x: 5 * d5, y: 0 },
    4: { x: 0, y: 2 * d5 },
    5: { x: 5 * d5, y: 2 * d5 },
    6: { x: d3, y: l - d3 },
    7: { x: 2 * d3, y: l - d3 },
    8: { x: 0, y: l },
    9: { x: d3, y: l },
    10: { x: 2 * d3, y: l },
    11: { x: l, y: l },
  };

  const result: PositionsMap = {};
  for (const key in raw) {
    result[parseInt(key)] = {
      x: raw[key].x + padding,
      y: raw[key].y + padding,
    };
  }
  return result;
}

/* ------------------------------------------------------------------ */
/*  N×N 矩形棋盘                                                      */
/* ------------------------------------------------------------------ */

function buildNxNAdj(n: number): AdjacencyList {
  const adj: AdjacencyList = {};
  // 角
  adj[0] = [1, n];
  adj[n - 1] = [n - 2, 2 * n - 1];
  adj[n * (n - 1)] = [n * (n - 1) - n, n * (n - 1) + 1];
  adj[n * n - 1] = [n * n - 2, n * n - 1 - n];
  // 边
  for (let ij = 1; ij <= n - 2; ij++) {
    const topI = ij;
    adj[topI] = [topI - 1, topI + 1, topI + n];
    const botI = n * (n - 1) + ij;
    adj[botI] = [botI - 1, botI + 1, botI - n];
    const lftI = ij * n;
    adj[lftI] = [lftI - n, lftI + n, lftI + 1];
    const rgtI = ij * n + n - 1;
    adj[rgtI] = [rgtI - n, rgtI + n, rgtI - 1];
  }
  // 肚皮
  for (let i = 1; i <= n - 2; i++) {
    for (let j = 1; j <= n - 2; j++) {
      const id = n * i + j;
      adj[id] = [id - 1, id + 1, id - n, id + n];
    }
  }
  return adj;
}

function buildNxNPositions(n: number, padding?: number, wh?: number): PositionsMap {
  wh = wh || 1000;
  const w = wh / (n + 1);
  padding = padding || w;

  const positions: PositionsMap = {};
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const id = n * i + j;
      positions[id] = { x: padding + w * j, y: padding + w * i };
    }
  }
  return positions;
}

/* ------------------------------------------------------------------ */
/*  导出                                                               */
/* ------------------------------------------------------------------ */

export const BOARDS: Board[] = [
  { name: '福', adj: adj福, p: positions福, cat: null },
  { name: '玫瑰', adj: adj玫瑰, p: positions玫瑰, cat: null },
  { name: '囧', adj: adj囧, p: build囧Positions(200), cat: null },
  { name: '2×2', adj: buildNxNAdj(2), p: buildNxNPositions(2), cat: 'rectangular', w: 2, h: 2 },
  { name: '4×4', adj: buildNxNAdj(4), p: buildNxNPositions(4), cat: 'rectangular', w: 4, h: 4 },
  { name: '9×9', adj: buildNxNAdj(9), p: buildNxNPositions(9), cat: 'rectangular', w: 9, h: 9 },
  { name: '13×13', adj: buildNxNAdj(13), p: buildNxNPositions(13), cat: 'rectangular', w: 13, h: 13 },
];

/** 默认棋盘索引 */
export const DEFAULT_BOARD_INDEX = 2;

/** 从 localStorage 加载自定义棋盘 */
export function loadCustomBoards(): Board[] {
  try {
    const saved = getSavedBoards();
    return Object.values(saved).map((json: string) => JSON.parse(json) as Board);
  } catch {
    return [];
  }
}

/** 获取所有棋盘（预设 + 自定义） */
export function getAllBoards(): Board[] {
  return [...BOARDS, ...loadCustomBoards()];
}
