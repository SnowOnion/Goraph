/**
 * 棋盘编辑器 Hook
 * 管理编辑器状态、工具选择、保存/加载、撤销/重做
 */

import { useState, useReducer, useCallback } from 'react';
import Taro from '@tarojs/taro';
import {
  EditorState,
  EditorTool,
  createEmptyEditorState,
  editorStateFromBoard,
  addNode,
  removeNode,
  addEdge,
  removeEdge,
  exportBoard,
} from '@/core/editor';
import { getSavedBoardNames, getSavedBoards, saveBoard, deleteBoard } from '@/core/storage';

const MAX_HISTORY = 50;

/* ---- 历史栈 reducer ---- */

interface HistoryState {
  past: EditorState[];
  present: EditorState;
  future: EditorState[];
}

type HistoryAction =
  | { type: 'COMMIT'; updater: (prev: EditorState) => EditorState }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'RESET'; state: EditorState };

function historyReducer(hs: HistoryState, action: HistoryAction): HistoryState {
  switch (action.type) {
    case 'COMMIT': {
      const newPresent = action.updater(hs.present);
      if (newPresent === hs.present) return hs;
      const past = [...hs.past, hs.present];
      if (past.length > MAX_HISTORY) past.shift();
      return { past, present: newPresent, future: [] };
    }
    case 'UNDO': {
      if (hs.past.length === 0) return hs;
      const previous = hs.past[hs.past.length - 1];
      const past = hs.past.slice(0, -1);
      return { past, present: previous, future: [hs.present, ...hs.future] };
    }
    case 'REDO': {
      if (hs.future.length === 0) return hs;
      const next = hs.future[0];
      const future = hs.future.slice(1);
      return { past: [...hs.past, hs.present], present: next, future };
    }
    case 'RESET':
      return { past: [], present: action.state, future: [] };
    default:
      return hs;
  }
}

/* ---- 辅助函数 ---- */

function loadSavedBoard(name: string): EditorState | null {
  try {
    const boards = getSavedBoards();
    if (boards[name]) {
      return editorStateFromBoard(JSON.parse(boards[name]));
    }
  } catch {}
  return null;
}

function deleteSavedBoard(name: string): void {
  deleteBoard(name);
  try { Taro.eventCenter?.trigger?.('boards-updated'); } catch {}
}

function cloneState(s: EditorState): EditorState {
  const adj: Record<number, number[]> = {};
  const positions: Record<number, { x: number; y: number }> = {};
  for (const id in s.adj) adj[parseInt(id)] = [...s.adj[parseInt(id)]];
  for (const id in s.positions) positions[parseInt(id)] = { ...s.positions[parseInt(id)] };
  return { adj, positions, selectedNode: s.selectedNode, nextNodeId: s.nextNodeId };
}

/* ---- Hook ---- */

export function useEditor() {
  const [history, historyDispatch] = useReducer(historyReducer, {
    past: [],
    present: createEmptyEditorState(),
    future: [],
  });
  const { present: state } = history;

  const [tool, setTool] = useState<EditorTool>('addNode');
  const [boardName, setBoardName] = useState('自定义棋盘');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [savedNames, setSavedNames] = useState<string[]>(getSavedBoardNames);

  // 修改编辑器状态的辅助函数
  const commit = useCallback((updater: (prev: EditorState) => EditorState) => {
    historyDispatch({ type: 'COMMIT', updater });
  }, []);

  const handleAddNode = useCallback((x: number, y: number) => {
    commit((prev) => {
      const next = cloneState(prev);
      addNode(next, x, y);
      return next;
    });
  }, [commit]);

  const handleSelectNode = useCallback((nodeId: number | null) => {
    // 选择不进入历史栈（太频繁）
    historyDispatch({ type: 'COMMIT', updater: (prev) => ({ ...prev, selectedNode: nodeId }) });
  }, []);

  const handleMoveNode = useCallback((nodeId: number, x: number, y: number) => {
    commit((prev) => {
      const next = cloneState(prev);
      next.positions[nodeId] = { x, y };
      return next;
    });
  }, [commit]);

  const handleDeleteNode = useCallback((nodeId: number) => {
    commit((prev) => {
      const next = cloneState(prev);
      removeNode(next, nodeId);
      return next;
    });
  }, [commit]);

  const handleAddEdge = useCallback((id1: number, id2: number) => {
    commit((prev) => {
      const next = cloneState(prev);
      addEdge(next, id1, id2);
      return next;
    });
  }, [commit]);

  const handleDeleteEdge = useCallback((id1: number, id2: number) => {
    commit((prev) => {
      const next = cloneState(prev);
      removeEdge(next, id1, id2);
      return next;
    });
  }, [commit]);

  const handleClear = useCallback(() => {
    historyDispatch({ type: 'RESET', state: createEmptyEditorState() });
    setSaveMessage(null);
  }, []);

  const handleUndo = useCallback(() => {
    historyDispatch({ type: 'UNDO' });
  }, []);

  const handleRedo = useCallback(() => {
    historyDispatch({ type: 'REDO' });
  }, []);

  const handleSave = useCallback(() => {
    try {
      const json = exportBoard(state, boardName);
      saveBoard(boardName, json);
      try { Taro.eventCenter?.trigger?.('boards-updated'); } catch {}
      setSaveMessage(`已保存棋盘「${boardName}」`);
      setTimeout(() => setSaveMessage(null), 2000);
    } catch (e) {
      setSaveMessage('保存失败');
    }
  }, [state, boardName]);

  const handleExport = useCallback(() => {
    const json = exportBoard(state, boardName);
    try {
      Taro.setClipboardData({ data: json }).then(() => {
        setSaveMessage('JSON 已复制到剪贴板');
        setTimeout(() => setSaveMessage(null), 2000);
      });
    } catch {
      setSaveMessage('请手动复制 JSON');
    }
  }, [state, boardName]);

  const handleLoad = useCallback((name: string) => {
    const loaded = loadSavedBoard(name);
    if (loaded) {
      historyDispatch({ type: 'RESET', state: loaded });
      setBoardName(name);
      setSaveMessage(`已加载「${name}」`);
      setTimeout(() => setSaveMessage(null), 2000);
    }
  }, []);

  const handleDeleteBoard = useCallback((name: string) => {
    deleteSavedBoard(name);
    setSavedNames(getSavedBoardNames());
    setSaveMessage(`已删除「${name}」`);
    setTimeout(() => setSaveMessage(null), 2000);
  }, []);

  return {
    state,
    tool,
    boardName,
    saveMessage,
    savedNames,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    setTool,
    setBoardName,
    handleAddNode,
    handleSelectNode,
    handleMoveNode,
    handleDeleteNode,
    handleAddEdge,
    handleDeleteEdge,
    handleClear,
    handleUndo,
    handleRedo,
    handleSave,
    handleExport,
    handleLoad,
    handleDeleteBoard,
  };
}


