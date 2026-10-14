/**
 * Goraph 核心类型定义
 * 框架无关，可在任何环境（Web、小程序、Node.js）中使用
 */

/** 棋子颜色枚举：0=空, 1=黑, 2=白 */
export type StoneColor = 0 | 1 | 2;

/** 节点坐标 */
export interface Position {
  x: number;
  y: number;
}

/** 邻接表：节点ID -> 邻居节点ID列表 */
export type AdjacencyList = Record<number, number[]>;

/** 节点坐标映射：节点ID -> 坐标 */
export type PositionsMap = Record<number, Position>;

/** 棋盘定义 */
export interface Board {
  name: string;
  adj: AdjacencyList;
  p: PositionsMap;
  cat?: string | null;  // 分类，如 "rectangular" 表示矩形棋盘
  w?: number;           // 矩形棋盘宽度
  h?: number;           // 矩形棋盘高度
}

/** 单个节点状态 */
export interface NodeState {
  s: StoneColor;        // 棋子颜色
  stoneStringID: number | null;  // 所在棋串ID
}

/** 棋串映射 */
export type StoneStringsMap = Record<number, StoneString>;

/** 落子历史快照 */
export interface HistorySnapshot {
  gameState: GameState;
  stoneStrings: StoneStringsMap;
  meta: GameMeta;
  /** 节点ID -> 落子手数（用于在棋子上显示序号） */
  moveNumbers: Record<number, number>;
  /** 最后一手落子位置（高亮显示） */
  lastMove: number | null;
  moveCount: number;
}

/** 棋串映射 */
export type StoneStringsMap = Record<number, StoneString>;
