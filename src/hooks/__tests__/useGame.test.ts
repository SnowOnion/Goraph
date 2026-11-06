import { describe, expect, it, vi } from 'vitest';

vi.mock('@tarojs/taro', () => ({ default: {} }));

import { BOARDS } from '@/core/boards';
import { gameReducer, createInitialState, FullState, Action } from '../useGame';

const N4 = BOARDS.findIndex((b) => b.name === '4×4');

function run(actions: Action[], state: FullState = createInitialState(N4, BOARDS)): FullState {
  return actions.reduce(gameReducer, state);
}
const play = (nodeID: number): Action => ({ type: 'PLAY', nodeID });

// 4×4 劫形：黑 1 4 9，白 2 5 7 10；之后黑 6 提劫
const KO_SETUP: Action[] = [play(1), play(2), play(4), play(5), play(9), play(7), { type: 'PASS' }, play(10)];

describe('gameReducer', () => {
  it('禁止全同再现默认开启：提劫后不能立即提回', () => {
    const s = run([...KO_SETUP, play(6), play(5)]);
    expect(s.infoIsError).toBe(true);
    expect(s.info).toContain('全同再现');
    expect(s.meta.next).toBe(2);
    expect(s.gameState[5].s).toBe(0);
  });

  it('悔棋后同一手可以重新下（悔棋会回退全同再现记录）', () => {
    let s = run([...KO_SETUP, play(6)]);
    expect(s.gameState[5].s).toBe(0);
    s = run([{ type: 'UNDO' }, play(6)], s);
    expect(s.infoIsError).toBe(false);
    expect(s.gameState[6].s).toBe(1);
    expect(s.gameState[5].s).toBe(0);
  });

  it('关闭规则后允许立即提回', () => {
    const s = run([{ type: 'TOGGLE_NO_REPEAT' }, ...KO_SETUP, play(6), play(5)]);
    expect(s.infoIsError).toBe(false);
    expect(s.gameState[5].s).toBe(2);
    expect(s.gameState[6].s).toBe(0);
  });

  it('终局后可以悔棋（撤销最后一次虚手）', () => {
    let s = run([play(0), { type: 'PASS' }, { type: 'PASS' }]);
    expect(s.meta.ended).toBe(true);
    s = run([{ type: 'UNDO' }], s);
    expect(s.meta.ended).toBe(false);
    expect(s.meta.next).toBe(1);
  });

  it('终局后落子被忽略', () => {
    const s = run([{ type: 'PASS' }, { type: 'PASS' }]);
    expect(run([play(0)], s)).toBe(s);
  });

  it('重来 / 换棋盘保留规则设置', () => {
    let s = run([{ type: 'TOGGLE_NO_REPEAT' }, { type: 'TOGGLE_FIVE' }, play(0)]);
    s = run([{ type: 'RESTART' }], s);
    expect(s.noRepeat).toBe(false);
    expect(s.hasFiveRule).toBe(true);
    expect(s.moveCount).toBe(0);
    s = run([{ type: 'SELECT_BOARD', index: 0 }], s);
    expect(s.noRepeat).toBe(false);
  });

  it('提子时提示提子数', () => {
    // 4×4：白 1 被黑 0 2 5 包围
    const s = run([play(0), play(1), play(2), { type: 'PASS' }, play(5)]);
    expect(s.gameState[1].s).toBe(0);
    expect(s.info).toBe('黑提1子。');
    expect(s.meta.capturedByBlack).toBe(1);
  });
});

describe('与 AI 对局时悔棋', () => {
  it('untilColor：一次悔到玩家回合（撤销 AI 和玩家各一手）', () => {
    let s = run([play(0), play(15), play(1), play(14)]);
    s = run([{ type: 'UNDO', untilColor: 1 }], s);
    expect(s.moveCount).toBe(2);
    expect(s.meta.next).toBe(1);
    expect(s.gameState[1].s).toBe(0);
  });

  it('untilColor：AI 还没下时只撤销玩家一手', () => {
    let s = run([play(0), play(15), play(1)]);
    s = run([{ type: 'UNDO', untilColor: 1 }], s);
    expect(s.moveCount).toBe(2);
    expect(s.meta.next).toBe(1);
  });
});
