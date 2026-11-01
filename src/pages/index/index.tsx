import { useState, useEffect, useCallback, useMemo } from 'react';
import { View } from '@tarojs/components';
import { Text } from '@/components/Text';
import { GameEndDialog } from '@/components/GameEndDialog';
import { BoardCanvas } from '@/components/BoardCanvas';
import { useGame } from '@/hooks/useGame';
import { calculateScore } from '@/core/game-engine';
import { BOARDS } from '@/core/boards';
import Taro, { useReady, useDidShow } from '@tarojs/taro';
import './index.scss';

export default function Index() {
  const [canvasSize, setCanvasSize] = useState({ width: 350, height: 350 });
  const [showSettings, setShowSettings] = useState(false);
  const [showNumbers, setShowNumbers] = useState(true);
  const [gameId, setGameId] = useState(0);

  const calcCanvasSize = useCallback(() => {
    const sysInfo = Taro.getSystemInfoSync();
    // 棋盘尽可能大：使用全屏宽度
    const size = Math.min(sysInfo.windowWidth, sysInfo.windowHeight * 0.5);
    setCanvasSize({ width: Math.floor(size), height: Math.floor(size) });
  }, []);

  useReady(() => calcCanvasSize());
  useDidShow(() => calcCanvasSize());

  useEffect(() => {
    const handler = () => calcCanvasSize();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [calcCanvasSize]);

  const {
    gameState, meta, adj, positions, boardIndex, allBoards, info, infoIsError,
    isRectangular, hasFiveRule, moveNumbers, lastMove,
    noRepeat, aiEnabled, capturedBlack, capturedWhite,
    canUndo,
    selectBoard, handlePlay, pass, restart, toggleFiveRule,
    toggleNoRepeat, toggleAI, undo, dead, toggleDead,
  } = useGame();

  const score = useMemo(
    () => (meta.ended ? calculateScore(gameState, adj, 0, new Set(dead)) : null),
    [meta.ended, gameState, adj, dead],
  );
  /** 终局后关闭结算弹窗、在棋盘上点死子 */
  const [reviewing, setReviewing] = useState(false);
  useEffect(() => { if (!meta.ended) setReviewing(false); }, [meta.ended]);
  const showResult = useCallback(() => setReviewing(false), []);

  const triggerRestart = useCallback(() => {
    setGameId(id => id + 1);
    restart();
  }, [restart]);

  return (
    <View className="game-page">
      {/* 顶栏 */}
      <View className="game-header">
        <View className="turn-indicator">
          <View className={`stone-icon ${meta.next === 1 ? 'black' : 'white'}`} />
          <Text className="turn-text">{meta.next === 1 ? '黑' : '白'}</Text>
        </View>
        <View className="capture-info">
          <View className="capture-item">
            <View className="stone-dot black" />
            <Text>{capturedBlack}</Text>
          </View>
          <View className="capture-item">
            <View className="stone-dot white" />
            <Text>{capturedWhite}</Text>
          </View>
        </View>
      </View>

      {/* 棋盘 */}
      <View className="board-container">
        <BoardCanvas
          key={gameId}
          adj={adj}
          positions={positions}
          gameState={gameState}
          canvasWidth={canvasSize.width}
          canvasHeight={canvasSize.height}
          onPlay={meta.ended ? toggleDead : handlePlay}
          selectStones={meta.ended}
          dead={dead}
          moveNumbers={moveNumbers}
          lastMove={lastMove}
          showMoveNumbers={showNumbers}
        />
      </View>

      {/* 操作栏 */}
      <View className="action-bar">
        <View
          className={`action-btn ${!canUndo ? 'disabled' : ''}`}
          onClick={!canUndo ? undefined : undo}
          onTouchEnd={!canUndo ? undefined : (e) => { e.preventDefault(); undo(); }}
        >
          <Text className="action-icon">↩️</Text>
          <Text className="action-label">悔棋</Text>
        </View>
        {meta.ended ? (
          <View
            className={`action-btn primary ${reviewing ? '' : 'disabled'}`}
            onClick={reviewing ? showResult : undefined}
            onTouchEnd={reviewing ? (e) => { e.preventDefault(); showResult(); } : undefined}
          >
            <Text className="action-icon">🏁</Text>
            <Text className="action-label">结算</Text>
          </View>
        ) : (
          <View
            className="action-btn primary"
            onClick={pass}
            onTouchEnd={(e) => { e.preventDefault(); pass(); }}
          >
            <Text className="action-icon">⏭️</Text>
            <Text className="action-label">虚手</Text>
          </View>
        )}
        <View
          className="action-btn"
          onClick={triggerRestart}
          onTouchEnd={(e) => { e.preventDefault(); triggerRestart(); }}
        >
          <Text className="action-icon">🔄</Text>
          <Text className="action-label">重来</Text>
        </View>
        <View
          className="action-btn"
          onClick={() => setShowSettings(s => !s)}
          onTouchEnd={(e) => { e.preventDefault(); setShowSettings(s => !s); }}
        >
          <Text className="action-icon">⚙️</Text>
          <Text className="action-label">设置</Text>
        </View>
      </View>

      {/* 信息提示 —— 始终占据固定高度，防止棋盘跳动 */}
      <View
        className={`info-bar ${infoIsError ? 'error' : ''}`}
      >
        <Text>
          {reviewing && score
            ? `点棋子标记/取消死子 · 黑 ${score.black} : 白 ${score.white}`
            : info && info.length > 1 ? info : '　'}
        </Text>
      </View>

      {/* 设置面板 */}
      {showSettings && (
        <View
          className="settings-overlay"
          onClick={() => setShowSettings(false)}
          onTouchEnd={(e: any) => { e.preventDefault(); setShowSettings(false); }}
        >
          <View
            className="settings-panel"
            onClick={(e: any) => e.stopPropagation?.()}
            onTouchEnd={(e: any) => e.stopPropagation?.()}
          >
            <View className="settings-header">
              <Text className="settings-title">设置</Text>
              <View className="settings-close" onClick={() => setShowSettings(false)}>
                <Text>✕</Text>
              </View>
            </View>

            <View className="setting-section">
              <Text className="setting-label">棋盘</Text>
              <View className="board-selector">
                {allBoards.map((b, i) => (
                  <View
                    key={i}
                    className={`board-chip ${boardIndex === i ? 'active' : ''}`}
                    onClick={() => selectBoard(i)}
                  >
                    <Text>{b.name}{i >= BOARDS.length ? ' ✏️' : ''}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View className="setting-section">
              <View className="toggle-row">
                <Text>手数序号</Text>
                <View className={`toggle ${showNumbers ? 'on' : ''}`} onClick={() => setShowNumbers(p => !p)}>
                  <View className="toggle-knob" />
                </View>
              </View>
              <View className="toggle-row">
                <Text>AI 对手</Text>
                <View className={`toggle ${aiEnabled ? 'on' : ''}`} onClick={toggleAI}>
                  <View className="toggle-knob" />
                </View>
              </View>
              <View className="toggle-row">
                <Text>禁止全同再现</Text>
                <View className={`toggle ${noRepeat ? 'on' : ''}`} onClick={toggleNoRepeat}>
                  <View className="toggle-knob" />
                </View>
              </View>
              {isRectangular && (
                <View className="toggle-row">
                  <Text>五子棋规则</Text>
                  <View className={`toggle ${hasFiveRule ? 'on' : ''}`} onClick={toggleFiveRule}>
                    <View className="toggle-knob" />
                  </View>
                </View>
              )}
            </View>

            <View
              className="editor-entry"
              onClick={() => Taro.navigateTo({ url: '/pages/editor/index' })}
            >
              <Text>✏️ 棋盘编辑器</Text>
            </View>
          </View>
        </View>
      )}

      {/* 终局弹窗 */}
      <GameEndDialog
        score={reviewing ? null : score}
        onRestart={triggerRestart}
        onReview={() => setReviewing(true)}
      />
    </View>
  );
}
