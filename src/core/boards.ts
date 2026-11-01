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
/*  晶格棋盘：六边形（三角晶格）/ 三角形 / 蜂巢                             */
/* ------------------------------------------------------------------ */

interface RawPoint { x: number; y: number }

/** 把任意坐标等比缩放、居中到 [padding, 1000 - padding] 的正方形里 */
function fitPositions(points: RawPoint[], padding = 80): PositionsMap {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const span = Math.max(maxX - minX, maxY - minY) || 1;
  const k = (1000 - 2 * padding) / span;
  const offX = (1000 - (maxX - minX) * k) / 2;
  const offY = (1000 - (maxY - minY) * k) / 2;
  const result: PositionsMap = {};
  points.forEach((p, i) => {
    result[i] = { x: offX + (p.x - minX) * k, y: offY + (p.y - minY) * k };
  });
  return result;
}

/** 由「格点 key → 坐标」和邻居函数建图，节点按插入顺序编号 */
function buildLattice(
  cells: [number, number][],
  toPoint: (a: number, b: number) => RawPoint,
  neighbors: [number, number][],
): { adj: AdjacencyList; p: PositionsMap } {
  const id = new Map(cells.map(([a, b], i) => [`${a},${b}`, i]));
  const adj: AdjacencyList = {};
  cells.forEach(([a, b], i) => {
    adj[i] = [];
    for (const [da, db] of neighbors) {
      const j = id.get(`${a + da},${b + db}`);
      if (j !== undefined) adj[i].push(j);
    }
  });
  return { adj, p: fitPositions(cells.map(([a, b]) => toPoint(a, b))) };
}

const SQRT3 = Math.sqrt(3);
const TRI_NEIGHBORS: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]];

/** 六边形棋盘：边长 n 的正六边形区域内的三角晶格，内部每点 6 个邻居，共 3n(n-1)+1 点 */
export function buildHexagonBoard(n: number) {
  const cells: [number, number][] = [];
  for (let r = -(n - 1); r <= n - 1; r++) {
    for (let q = -(n - 1); q <= n - 1; q++) {
      if (Math.abs(q + r) <= n - 1) cells.push([q, r]);
    }
  }
  return buildLattice(cells, (q, r) => ({ x: q + r / 2, y: (r * SQRT3) / 2 }), TRI_NEIGHBORS);
}

/** 三角形棋盘：边长 n 的正三角形区域内的三角晶格，共 n(n+1)/2 点 */
export function buildTriangleBoard(n: number) {
  const cells: [number, number][] = [];
  for (let i = 0; i < n; i++) for (let j = 0; j <= i; j++) cells.push([i, j]);
  return buildLattice(
    cells,
    (i, j) => ({ x: j - i / 2, y: (i * SQRT3) / 2 }),
    [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, -1]],
  );
}

/** 蜂巢棋盘：半径 R 的六边形拼块（3R(R+1)+1 个六边形）的顶点与边，每点至多 3 个邻居 */
export function buildHoneycombBoard(R: number) {
  const index = new Map<string, number>();
  const points: RawPoint[] = [];
  const adj: AdjacencyList = {};
  const vertex = (x: number, y: number) => {
    // 取整到 1e-4 去浮点误差；`|| 0` 把 -0 归一成 0
    const key = `${Math.round(x * 1e4) || 0},${Math.round(y * 1e4) || 0}`;
    let i = index.get(key);
    if (i === undefined) {
      i = points.length;
      index.set(key, i);
      points.push({ x, y });
      adj[i] = [];
    }
    return i;
  };
  const link = (a: number, b: number) => {
    if (!adj[a].includes(b)) { adj[a].push(b); adj[b].push(a); }
  };
  for (let r = -R; r <= R; r++) {
    for (let q = -R; q <= R; q++) {
      if (Math.abs(q + r) > R) continue;
      const cx = SQRT3 * (q + r / 2);
      const cy = 1.5 * r;
      const corners = [0, 1, 2, 3, 4, 5].map((k) => {
        const t = (Math.PI / 3) * k + Math.PI / 6;
        return vertex(cx + Math.cos(t), cy + Math.sin(t));
      });
      for (let k = 0; k < 6; k++) link(corners[k], corners[(k + 1) % 6]);
    }
  }
  return { adj, p: fitPositions(points) };
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
  { name: '六边形', ...buildHexagonBoard(5), cat: 'hexagon' },
  { name: '三角形', ...buildTriangleBoard(8), cat: 'triangle' },
  { name: '蜂巢', ...buildHoneycombBoard(2), cat: 'honeycomb' },
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
