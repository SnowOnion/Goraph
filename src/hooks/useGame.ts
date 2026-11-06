/**
 * 游戏状态管理 Hook
 * 使用 useReducer 保证 gameState / stoneStrings / meta 的原子更新
 * 支持预设棋盘 + 自定义棋盘 + 悔棋 + 棋子序号 + 禁止全同再现
 */

import { useReducer, useCallback, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { BOARDS, DEFAULT_BOARD_INDEX, getAllBoards } from '@/core/boards';
import { Board } from '@/core/types';
import {
  GameMeta,
  MoveError,
  initGameState,
  initGameMeta,
  executePass,
  oppoColor,
  initStoneStrings,
  boardHash,
  tryPlay,
} from '@/core/game-engine';
import { checkFiveWinning } from '@/core/five';
import { pickAIMove, DEFAULT_AI_CONFIG } from '@/core/ai';
import { AdjacencyList, PositionsMap, GameState, StoneStringsMap, StoneColor } from '@/core/types';

/* ------------------------------------------------------------------ */
/*  Reducer                                                           */
/* ------------------------------------------------------------------ */

interface FullState {
  boardIndex: number;
  gameState: GameState;
  stoneStrings: StoneStringsMap;
  meta: GameMeta;
  info: string;
  /** info 是否为错误提示（落子被拒） */
  infoIsError: boolean;
  hasFiveRule: boolean;
  /** 所有可用棋盘（预设 + 自定义） */
  allBoards: Board[];
  /** 悔棋历史栈：每一手之前的局面 */
  history: HistoryEntry[];
  /** 节点ID -> 落子手数（用于显示序号） */
  moveNumbers: Record<number, number>;
  /** 最后一手位置 */
  lastMove: number | null;
  /** 总手数（含虚手） */
  moveCount: number;
  /** 是否启用禁止全同再现规则 */
  noRepeat: boolean;
  /** 是否启用 AI 对手 */
  aiEnabled: boolean;
}

interface HistoryEntry {
  gameState: GameState;
  stoneStrings: StoneStringsMap;
  meta: GameMeta;
  moveNumbers: Record<number, number>;
  lastMove: number | null;
  moveCount: number;
  info: string;
  /** 该局面的盘面哈希（用于禁止全同再现） */
  hash: string;
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

const MOVE_ERROR_TEXT: Record<MoveError, string> = {
  ended: '对局已结束。',
  occupied: '这里已经有子了。',
  suicide: '不能自杀：落子后无气，也提不掉对方的子。',
  superko: '禁止全同再现：这一手会让盘面重复出现。',
};

const colorName = (c: StoneColor) => (c === 1 ? '黑' : '白');

function snapshot(state: FullState): HistoryEntry {
  // 局面在 reducer 中从不原地修改，可以直接共享引用
  return {
    gameState: state.gameState,
    stoneStrings: state.stoneStrings,
    meta: state.meta,
    moveNumbers: state.moveNumbers,
    lastMove: state.lastMove,
    moveCount: state.moveCount,
    info: state.info,
    hash: boardHash(state.gameState),
  };
}

/** 本局到目前为止出现过的所有盘面（含当前） */
export function seenBoardHashes(state: Pick<FullState, 'history' | 'gameState'>): Set<string> {
  const seen = new Set(state.history.map((h) => h.hash));
  seen.add(boardHash(state.gameState));
  return seen;
}

function currentBoard(state: FullState): Board {
  return state.allBoards[state.boardIndex] || BOARDS[0];
}

function createInitialState(
  boardIndex: number,
  boards: Board[],
  prefs: Pick<FullState, 'hasFiveRule' | 'noRepeat' | 'aiEnabled'> = { hasFiveRule: false, noRepeat: true, aiEnabled: false },
): FullState {
  const board = boards[boardIndex] || BOARDS[0];
  return {
    boardIndex,
    gameState: initGameState(board.adj),
    stoneStrings: initStoneStrings(),
    meta: initGameMeta(),
    info: '请点击或触摸下棋。',
    infoIsError: false,
    allBoards: boards,
    history: [],
    moveNumbers: {},
    lastMove: null,
    moveCount: 0,
    ...prefs,
  };
}

const prefsOf = (s: FullState) => ({ hasFiveRule: s.hasFiveRule, noRepeat: s.noRepeat, aiEnabled: s.aiEnabled });

export function gameReducer(state: FullState, action: Action): FullState {
  switch (action.type) {
    case 'SELECT_BOARD': {
      if (!state.allBoards[action.index]) return state;
      return createInitialState(action.index, state.allBoards, prefsOf(state));
    }

    case 'RESTART':
      return createInitialState(state.boardIndex, state.allBoards, prefsOf(state));

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
        infoIsError: false,
        history: state.history.slice(0, -1),
      };
    }

    case 'PASS': {
      if (state.meta.ended) return state;
      const meta = { ...state.meta };
      executePass(meta);
      const info = meta.ended
        ? '双方连续虚手，对局结束。'
        : `${colorName(state.meta.next)}棋虚手。`;
      return {
        ...state,
        meta,
        info,
        infoIsError: false,
        history: [...state.history, snapshot(state)],
        moveCount: state.moveCount + 1,
        lastMove: null,
      };
    }

    case 'TOGGLE_FIVE':
      return { ...state, hasFiveRule: !state.hasFiveRule };

    case 'TOGGLE_NO_REPEAT':
      return { ...state, noRepeat: !state.noRepeat };

    case 'TOGGLE_AI':
      return { ...state, aiEnabled: !state.aiEnabled };

    case 'REFRESH_BOARDS': {
      const allBoards = getAllBoards();
      // 当前棋盘被删除或被改动时，回到默认棋盘重新开始
      const before = currentBoard(state);
      const after = allBoards[state.boardIndex];
      if (!after || after.name !== before.name || JSON.stringify(after.adj) !== JSON.stringify(before.adj)) {
        return createInitialState(DEFAULT_BOARD_INDEX, allBoards, prefsOf(state));
      }
      return { ...state, allBoards };
    }

    case 'PLAY': {
      const { nodeID } = action;
      const board = currentBoard(state);
      const color = state.meta.next;

      const result = tryPlay(
        board.adj,
        { gameState: state.gameState, stoneStrings: state.stoneStrings, meta: state.meta },
        nodeID,
        state.noRepeat ? seenBoardHashes(state) : null,
      );
      if ('error' in result) {
        if (result.error === 'ended') return state;
        return { ...state, info: MOVE_ERROR_TEXT[result.error], infoIsError: true };
      }
      const { gameState, stoneStrings, meta } = result.position;

      let info = '　';
      if (state.hasFiveRule && board.cat === 'rectangular' && board.w && board.h) {
        const fiveResult = checkFiveWinning(gameState, board.w, board.h, nodeID);
        if (fiveResult !== 0) {
          info = `按五子棋规则，${colorName(fiveResult as StoneColor)}胜。`;
          meta.ended = true;
        }
      }
      const captured = color === 1
        ? meta.capturedByBlack - state.meta.capturedByBlack
        : meta.capturedByWhite - state.meta.capturedByWhite;
      if (info === '　' && captured > 0) info = `${colorName(color)}提${captured}子。`;

      const moveCount = state.moveCount + 1;
      return {
        ...state,
        gameState,
        stoneStrings,
        meta,
        info,
        infoIsError: false,
        moveNumbers: { ...state.moveNumbers, [nodeID]: moveCount },
        lastMove: nodeID,
        moveCount,
        history: [...state.history, snapshot(state)],
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
  infoIsError: boolean;
  isRectangular: boolean;
  hasFiveRule: boolean;
  moveNumbers: Record<number, number>;
  lastMove: number | null;
  canUndo: boolean;
  moveCount: number;
  capturedBlack: number;
  capturedWhite: number;
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

const AI_COLOR: StoneColor = 2;

export function useGame(): UseGameReturn {
  const [state, dispatch] = useReducer(
    gameReducer,
    DEFAULT_BOARD_INDEX,
    (idx) => createInitialState(idx, getAllBoards()),
  );

  const board = currentBoard(state);
  const aiThinking = state.aiEnabled && !state.meta.ended && state.meta.next === AI_COLOR;

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
    if (!aiThinking) return;
    const timer = setTimeout(() => {
      const aiMove = pickAIMove(
        board.adj, state.gameState, state.stoneStrings, AI_COLOR, board.p, DEFAULT_AI_CONFIG,
      );
      dispatch(aiMove != null ? { type: 'PLAY', nodeID: aiMove } : { type: 'PASS' });
    }, DEFAULT_AI_CONFIG.thinkMs);
    return () => clearTimeout(timer);
  }, [aiThinking, board, state.gameState, state.stoneStrings]);

  return {
    gameState: state.gameState,
    meta: state.meta,
    adj: board.adj,
    positions: board.p,
    boardIndex: state.boardIndex,
    boardName: board.name,
    allBoards: state.allBoards,
    info: state.info,
    infoIsError: state.infoIsError,
    isRectangular: board.cat === 'rectangular',
    hasFiveRule: state.hasFiveRule,
    moveNumbers: state.moveNumbers,
    lastMove: state.lastMove,
    canUndo: state.history.length > 0,
    moveCount: state.moveCount,
    capturedBlack: state.meta.capturedByBlack,
    capturedWhite: state.meta.capturedByWhite,
    noRepeat: state.noRepeat,
    aiEnabled: state.aiEnabled,
    aiThinking,
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

export { createInitialState };
export type { FullState, Action };
