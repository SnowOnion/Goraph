/**
 * 棋盘编辑器逻辑
 * 提供创建、编辑棋盘的核心操作
 */

import { AdjacencyList, PositionsMap, Board } from './types';

/** 编辑器状态 */
export interface EditorState {
  adj: AdjacencyList;
  positions: PositionsMap;
  selectedNode: number | null;
  nextNodeId: number;
}

/** 创建空编辑器状态 */
export function createEmptyEditorState(): EditorState {
  return {
    adj: {},
    positions: {},
    selectedNode: null,
    nextNodeId: 0,
  };
}

/** 从已有棋盘创建编辑器状态 */
export function editorStateFromBoard(board: Board): EditorState {
  const adj: AdjacencyList = {};
  const positions: PositionsMap = {};

  for (const id in board.adj) {
    adj[parseInt(id)] = [...board.adj[parseInt(id)]];
  }
  for (const id in board.p) {
    positions[parseInt(id)] = { ...board.p[parseInt(id)] };
  }

  const maxId = Math.max(0, ...Object.keys(positions).map(Number));

  return {
    adj,
    positions,
    selectedNode: null,
    nextNodeId: maxId + 1,
  };
}

/** 添加节点 */
export function addNode(state: EditorState, x: number, y: number): number {
  const id = state.nextNodeId++;
  state.positions[id] = { x, y };
  state.adj[id] = [];
  return id;
}

/** 删除节点及其关联的边 */
export function removeNode(state: EditorState, nodeId: number): void {
  if (!(nodeId in state.positions)) return;

  // 从邻接表中删除该节点
  delete state.adj[nodeId];

  // 从其他节点的邻接表中删除指向该节点的引用
  for (const id in state.adj) {
    const neighbors = state.adj[parseInt(id)];
    const idx = neighbors.indexOf(nodeId);
    if (idx !== -1) {
      neighbors.splice(idx, 1);
    }
  }

  delete state.positions[nodeId];

  if (state.selectedNode === nodeId) {
    state.selectedNode = null;
  }
}

/** 添加边（无向） */
export function addEdge(state: EditorState, id1: number, id2: number): void {
  if (id1 === id2) return;
  if (!state.adj[id1] || !state.adj[id2]) return;

  if (!state.adj[id1].includes(id2)) {
    state.adj[id1].push(id2);
  }
  if (!state.adj[id2].includes(id1)) {
    state.adj[id2].push(id1);
  }
}

/** 删除边（无向） */
export function removeEdge(state: EditorState, id1: number, id2: number): void {
  if (!state.adj[id1] || !state.adj[id2]) return;

  const idx1 = state.adj[id1].indexOf(id2);
  if (idx1 !== -1) state.adj[id1].splice(idx1, 1);

  const idx2 = state.adj[id2].indexOf(id1);
  if (idx2 !== -1) state.adj[id2].splice(idx2, 1);
}

/** 检查边是否存在 */
export function hasEdge(state: EditorState, id1: number, id2: number): boolean {
  return state.adj[id1]?.includes(id2) ?? false;
}

/** 找到最近的节点（用于选择） */
export function findNearestNode(state: EditorState, x: number, y: number, maxDist: number = 30): number | null {
  let bestId: number | null = null;
  let bestDist = maxDist * maxDist;

  for (const id in state.positions) {
    const p = state.positions[parseInt(id)];
    const dx = p.x - x;
    const dy = p.y - y;
    const d = dx * dx + dy * dy;
    if (d < bestDist) {
      bestDist = d;
      bestId = parseInt(id);
    }
  }
  return bestId;
}

/** 导出为 JSON */
export function exportBoard(state: EditorState, name: string): string {
  return JSON.stringify({
    name,
    adj: state.adj,
    p: state.positions,
    cat: null,
  }, null, 2);
}

/** 导入 JSON */
export function importBoard(json: string): EditorState {
  const data = JSON.parse(json);
  return editorStateFromBoard(data);
}

/* ------------------------------------------------------------------ */
/*  OGR 扩展接口（预留）                                               */
/* ------------------------------------------------------------------ */

/**
 * OGR (Optical Graph Recognition) 扩展点。
 * 未来实现：
 * 1. 接收图片数据
 * 2. 使用 CV 算法识别节点和边
 * 3. 返回 EditorState
 *
 * 当前抛出未实现错误，作为接口占位。
 */
export interface OGRConfig {
  /** 识别灵敏度 */
  sensitivity: number;
  /** 最小节点间距 */
  minNodeDistance: number;
}

export async function recognizeFromImage(
  imageData: Uint8Array,
  config: OGRConfig,
): Promise<EditorState> {
  // TODO: 实现光学图识别
  // 可能的方案：
  // 1. 使用 OpenCV.js 进行图像处理
  // 2. 圆检测找节点
  // 3. 线检测找边
  // 4. 拓扑重建
  throw new Error('OGR not yet implemented. Config: ' + JSON.stringify(config));
}
