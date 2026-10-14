/**
 * 棋盘编辑器 Hook
 * 管理编辑器状态、工具选择、保存/加载
 */

import { useState, useCallback } from 'react';
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
  importBoard,
} from '@/core/editor';
import { getSavedBoardNames, getSavedBoards, saveBoard, deleteBoard } from '@/core/storage';

/** 加载已保存的棋盘 */
function loadSavedBoard(name: string): EditorState | null {
  try {
    const boards = getSavedBoards();
    if (boards[name]) {
      return editorStateFromBoard(JSON.parse(boards[name]));
    }
  } catch {}
  return null;
}

/** 删除已保存的棋盘 */
function deleteSavedBoard(name: string): void {
  deleteBoard(name);
  try { Taro.eventCenter?.trigger?.('boards-updated'); } catch {}
}

export function useEditor() {
  const [state, setState] = useState<EditorState>(createEmptyEditorState);
  const [tool, setTool] = useState<EditorTool>('addNode');
  const [boardName, setBoardName] = useState('自定义棋盘');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [savedNames, setSavedNames] = useState<string[]>(getSavedBoardNames);

  const handleAddNode = useCallback((x: number, y: number) => {
    setState((prev) => {
      const next = cloneState(prev);
      addNode(next, x, y);
      return next;
    });
  }, []);

  const handleSelectNode = useCallback((nodeId: number | null) => {
    setState((prev) => ({ ...prev, selectedNode: nodeId }));
  }, []);

  const handleMoveNode = useCallback((nodeId: number, x: number, y: number) => {
    setState((prev) => {
      const next = cloneState(prev);
      next.positions[nodeId] = { x, y };
      return next;
    });
  }, []);

  const handleDeleteNode = useCallback((nodeId: number) => {
    setState((prev) => {
      const next = cloneState(prev);
      removeNode(next, nodeId);
      return next;
    });
  }, []);

  const handleAddEdge = useCallback((id1: number, id2: number) => {
    setState((prev) => {
      const next = cloneState(prev);
      addEdge(next, id1, id2);
      return next;
    });
  }, []);

  const handleDeleteEdge = useCallback((id1: number, id2: number) => {
    setState((prev) => {
      const next = cloneState(prev);
      removeEdge(next, id1, id2);
      return next;
    });
  }, []);

  const handleClear = useCallback(() => {
    setState(createEmptyEditorState());
    setSaveMessage(null);
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

  /** 加载已保存的棋盘 */
  const handleLoad = useCallback((name: string) => {
    const loaded = loadSavedBoard(name);
    if (loaded) {
      setState(loaded);
      setBoardName(name);
      setSaveMessage(`已加载「${name}」`);
      setTimeout(() => setSaveMessage(null), 2000);
    }
  }, []);

  /** 删除已保存的棋盘 */
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
    setTool,
    setBoardName,
    handleAddNode,
    handleSelectNode,
    handleMoveNode,
    handleDeleteNode,
    handleAddEdge,
    handleDeleteEdge,
    handleClear,
    handleSave,
    handleExport,
    handleLoad,
    handleDeleteBoard,
  };
}

function cloneState(s: EditorState): EditorState {
  const adj: Record<number, number[]> = {};
  const positions: Record<number, { x: number; y: number }> = {};
  for (const id in s.adj) adj[parseInt(id)] = [...s.adj[parseInt(id)]];
  for (const id in s.positions) positions[parseInt(id)] = { ...s.positions[parseInt(id)] };
  return {
    adj,
    positions,
    selectedNode: s.selectedNode,
    nextNodeId: s.nextNodeId,
  };
}
