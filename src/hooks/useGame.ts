/**
 * 游戏状态管理 Hook
 * 使用 useReducer 保证 gameState / stoneStrings / meta 的原子更新
 * 支持预设棋盘 + 自定义棋盘 + 悔棋 + 棋子序号
 */

import { useReducer, useCallback, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { BOARDS, DEFAULT_BOARD_INDEX, getAllBoards } from '@/core/boards';
import { Board } from '@/core/types';
import {
  GameMeta,
  initGameState,
  initGameStrings,
  initGameMeta,
  validWrtRuleAndUpdate,
  flip as flipColor,
  executePass,
  oppoColor,
  initStoneStrings,
  boardHash,
} from '@/core/game-engine';
import { checkFiveWinning } from '@/core/five';
import { pickAIMove, AIConfig, DEFAULT_AI_CONFIG } from '@/core/ai';
import { AdjacencyList, PositionsMap, GameState, StoneStringsMap } from '@/core/types';

/* ------------------------------------------------------------------ */
/*  Reducer                                                           */
/* ------------------------------------------------------------------ */

interface FullState {
  boardIndex: number;
  gameState: GameState;
  stoneStrings: StoneStringsMap;
  meta: GameMeta;
  info: string;
  hasFiveRule: boolean;
  /** 所有可用棋盘（预设 + 自定义） */
  allBoards: Board[];
  /** 悔棋历史栈 */
  history: HistoryEntry[];
  /** 节点ID -> 落子手数（用于显示序号） */
  moveNumbers: Record<number, number>;
  /** 最后一手位置 */
  lastMove: number | null;
  /** 总手数 */
  moveCount: number;
  /** 已出现的棋盘哈希集合（禁止全同再现） */
  boardHashes: Set<string>;
  /** 是否启用禁止全同再现规则 */
  noRepeat: boolean;
  /** 是否启用 AI 对手 */
  aiEnabled: boolean;
  /** AI 思考中 */
  aiThinking: boolean;
}

interface HistoryEntry {
  gameState: GameState;
  stoneStrings: StoneStringsMap;
  meta: GameMeta;
  moveNumbers: Record<number, number>;
  lastMove: number | null;
  moveCount: number;
  info: string;
}

type Action =
  | { type: 'SELECT_BOARD'; index: number }
  | { type: 'PLAY'; nodeID: number }
  | { type: 'PASS' }
  | { type: 'RESTART' }
  | { type: 'TOGGLE_FIVE' }
  | { type: 'TOGGLE_NO_REPEAT' }
  | { type: 'TOGGLE_AI' }
  | { type: 'REFRESH_BOARDS' }
  | { type: 'UNDO' };

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
    const s = ss[parseInt(id)];
    result[parseInt(id)] = {
      chiSet: new Set(s.chiSet),
      nodes: new Set(s.nodes),
    };
  }
  return result;
}

function pushHistory(state: FullState): HistoryEntry {
  return {
    gameState: cloneGameState(state.gameState),
    stoneStrings: cloneStoneStrings(state.stoneStrings),
    meta: { ...state.meta },
    moveNumbers: { ...state.moveNumbers },
    lastMove: state.lastMove,
    moveCount: state.moveCount,
    info: state.info,
  };
}

function createInitialState(boardIndex: number, boards: Board[]): FullState {
  const board = boards[boardIndex] || BOARDS[0];
  const gameState = initGameState(board.adj);
  return {
    boardIndex,
    gameState,
    stoneStrings: initStoneStrings(),
    meta: initGameMeta(),
    info: '请点击或触摸下棋。',
    hasFiveRule: false,
    allBoards: boards,
    history: [],
    moveNumbers: {},
    lastMove: null,
    moveCount: 0,
    boardHashes: new Set([boardHash(gameState)]),
    noRepeat: false,
    aiEnabled: false,
    aiThinking: false,
  };
}

function gameReducer(state: FullState, action: Action): FullState {
  switch (action.type) {
    case 'SELECT_BOARD': {
      const board = state.allBoards[action.index];
      if (!board) return state;
      return createInitialState(action.index, state.allBoards);
    }

    case 'RESTART': {
      const board = state.allBoards[state.boardIndex] || BOARDS[0];
      return {
        ...createInitialState(state.boardIndex, state.allBoards),
      };
    }

    case 'UNDO': {
      if (state.history.length === 0) return state;
      const prev = state.history[state.history.length - 1];
      return {
        ...state,
        gameState: prev.gameState,
        stoneStrings: prev.stoneStrings,
        meta: prev.meta,
        moveNumbers: prev.moveNumbers,
        lastMove: prev.lastMove,
        moveCount: prev.moveCount,
        info: '已悔棋。',
        history: state.history.slice(0, -1),
      };
    }

    case 'PASS': {
      const meta = { ...state.meta };
      executePass(meta);
      const info = meta.ended
        ? '双方连续放弃，本局结束。'
        : `${oppoColor(meta.next) === 1 ? '黑' : '白'}棋放弃一手。`;
      return {
        ...state,
        meta,
        info,
        history: [...state.history, pushHistory(state)],
        moveCount: state.moveCount + 1,
      };
    }

    case 'TOGGLE_FIVE':
      return { ...state, hasFiveRule: !state.hasFiveRule };

    case 'TOGGLE_NO_REPEAT':
      return { ...state, noRepeat: !state.noRepeat };

    case 'TOGGLE_AI':
      return { ...state, aiEnabled: !state.aiEnabled };

    case 'REFRESH_BOARDS':
      return {
        ...state,
        allBoards: getAllBoards(),
      };

    case 'PLAY': {
      if (state.meta.ended) return state;

      const { nodeID } = action;
      const board = state.allBoards[state.boardIndex] || BOARDS[0];
      const color = state.meta.next;

      if (state.gameState[nodeID]?.s !== 0) {
        return { ...state, info: '这一手不合规则。' };
      }

      const gameState = cloneGameState(state.gameState);
      const stoneStrings = cloneStoneStrings(state.stoneStrings);
      const meta = { ...state.meta };

      const valid = validWrtRuleAndUpdate(
        board.adj, gameState, stoneStrings, meta, nodeID, color,
      );

      if (!valid) {
        return { ...state, info: '这一手不合规则。' };
      }

      // 禁止全同再现规则
      if (state.noRepeat) {
        const newHash = boardHash(gameState);
        if (state.boardHashes.has(newHash)) {
          return { ...state, info: '禁止全同再现（打劫规则）。' };
        }
      }

      flipColor(meta);
      meta.passed = 0;

      let info = '　';
      if (state.hasFiveRule && board.cat === 'rectangular' && board.w && board.h) {
        const fiveResult = checkFiveWinning(gameState, board.w, board.h, nodeID);
        if (fiveResult !== 0) {
          info = `按五子棋规则，${fiveResult === 1 ? '黑' : '白'}胜。`;
          meta.ended = true;
        }
      }

      const newMoveCount = state.moveCount + 1;
      const newMoveNumbers = { ...state.moveNumbers, [nodeID]: newMoveCount };

      // 被提掉的子移除序号
      for (const id in gameState) {
        if (gameState[parseInt(id)].s === 0 && newMoveNumbers[parseInt(id)]) {
          // 检查这个空点之前是否有棋子被提掉
        }
      }

      return {
        ...state,
        gameState,
        stoneStrings,
        meta,
        info,
        moveNumbers: newMoveNumbers,
        lastMove: nodeID,
        moveCount: newMoveCount,
        history: [...state.history, pushHistory(state)],
        boardHashes: state.noRepeat
          ? new Set([...state.boardHashes, boardHash(gameState)])
          : state.boardHashes,
      };
    }

    default:
      return state;
  }
}

/* ------------------------------------------------------------------ */
/*  Hook                                                              */
/* ------------------------------------------------------------------ */

export interface UseGameReturn {
  gameState: GameState;
  meta: GameMeta;
  adj: AdjacencyList;
  positions: PositionsMap;
  boardIndex: number;
  boardName: string;
  allBoards: Board[];
  info: string;
  isRectangular: boolean;
  hasFiveRule: boolean;
  moveNumbers: Record<number, number>;
  lastMove: number | null;
  canUndo: boolean;
  noRepeat: boolean;
  aiEnabled: boolean;
  aiThinking: boolean;
  selectBoard: (index: number) => void;
  handlePlay: (nodeID: number) => void;
  pass: () => void;
  restart: () => void;
  toggleFiveRule: () => void;
  toggleNoRepeat: () => void;
  toggleAI: () => void;
  refreshBoards: () => void;
  undo: () => void;
}

export function useGame(): UseGameReturn {
  const [state, dispatch] = useReducer(
    gameReducer,
    DEFAULT_BOARD_INDEX,
    (idx) => createInitialState(idx, getAllBoards()),
  );

  const board = state.allBoards[state.boardIndex] || BOARDS[0];

  const selectBoard = useCallback((index: number) => dispatch({ type: 'SELECT_BOARD', index }), []);
  const handlePlay = useCallback((nodeID: number) => dispatch({ type: 'PLAY', nodeID }), []);
  const pass = useCallback(() => dispatch({ type: 'PASS' }), []);
  const restart = useCallback(() => dispatch({ type: 'RESTART' }), []);
  const toggleFiveRule = useCallback(() => dispatch({ type: 'TOGGLE_FIVE' }), []);
  const toggleNoRepeat = useCallback(() => dispatch({ type: 'TOGGLE_NO_REPEAT' }), []);
  const toggleAI = useCallback(() => dispatch({ type: 'TOGGLE_AI' }), []);
  const refreshBoards = useCallback(() => dispatch({ type: 'REFRESH_BOARDS' }), []);
  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);

  // 监听编辑器保存事件，自动刷新棋盘列表
  useEffect(() => {
    const handler = () => dispatch({ type: 'REFRESH_BOARDS' });
    try {
      Taro.eventCenter?.on?.('boards-updated', handler);
    } catch {}
    return () => {
      try { Taro.eventCenter?.off?.('boards-updated', handler); } catch {}
    };
  }, []);

  // AI 对手自动落子
  useEffect(() => {
    if (!state.aiEnabled || state.meta.ended || state.aiThinking) return;
    // AI 执白（后手）
    if (state.meta.next !== 2) return;

    const board = (state.allBoards[state.boardIndex] || BOARDS[0]);
    const timer = setTimeout(() => {
      const aiMove = pickAIMove(
        board.adj, state.gameState, state.stoneStrings, 2, board.p, DEFAULT_AI_CONFIG,
      );
      if (aiMove != null) {
        dispatch({ type: 'PLAY', nodeID: aiMove });
      } else {
        // AI 无子可下，pass
        dispatch({ type: 'PASS' });
      }
    }, DEFAULT_AI_CONFIG.thinkMs);

    return () => clearTimeout(timer);
  }, [state.aiEnabled, state.meta.next, state.meta.ended, state.aiThinking, state.boardIndex, state.gameState, state.stoneStrings, state.allBoards]);

  return {
    gameState: state.gameState,
    meta: state.meta,
    adj: board.adj,
    positions: board.p,
    boardIndex: state.boardIndex,
    boardName: board.name,
    allBoards: state.allBoards,
    info: state.info,
    isRectangular: board.cat === 'rectangular',
    hasFiveRule: state.hasFiveRule,
    moveNumbers: state.moveNumbers,
    lastMove: state.lastMove,
    canUndo: state.history.length > 0 && !state.meta.ended,
    noRepeat: state.noRepeat,
    aiEnabled: state.aiEnabled,
    aiThinking: state.aiThinking,
    selectBoard,
    handlePlay,
    pass,
    restart,
    toggleFiveRule,
    toggleNoRepeat,
    toggleAI,
    refreshBoards,
    undo,
  };
}
