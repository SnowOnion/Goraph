import { useState, useEffect, useCallback } from 'react';
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
    gameState, meta, adj, positions, boardIndex, allBoards, info,
    isRectangular, hasFiveRule, moveNumbers, lastMove, moveCount,
    noRepeat, aiEnabled, aiThinking, capturedBlack, capturedWhite,
    canUndo,
    selectBoard, handlePlay, pass, restart, toggleFiveRule,
    toggleNoRepeat, toggleAI, undo,
  } = useGame();

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
          onPlay={handlePlay}
          moveNumbers={moveNumbers}
          lastMove={lastMove}
          showMoveNumbers={showNumbers}
        />
      </View>

      {/* 操作栏 */}
      <View className="action-bar">
        <View
          className={`action-btn ${(!canUndo || meta.ended) ? 'disabled' : ''}`}
          onClick={(!canUndo || meta.ended) ? undefined : undo}
          onTouchEnd={(!canUndo || meta.ended) ? undefined : (e) => { e.preventDefault(); undo(); }}
        >
          <Text className="action-icon">↩️</Text>
          <Text className="action-label">悔棋</Text>
        </View>
        <View
          className={`action-btn primary ${meta.ended ? 'disabled' : ''}`}
          onClick={meta.ended ? undefined : pass}
          onTouchEnd={meta.ended ? undefined : (e) => { e.preventDefault(); pass(); }}
        >
          <Text className="action-icon">⏭️</Text>
          <Text className="action-label">虚手</Text>
        </View>
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
        className={`info-bar ${info.includes('不合') || info.includes('禁止') ? 'error' : ''}`}
      >
        <Text>{info && info.length > 1 ? info : '　'}</Text>
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
        ended={meta.ended}
        blackScore={calculateScore(gameState, adj, meta).black}
        whiteScore={calculateScore(gameState, adj, meta).white}
        onRestart={triggerRestart}
        onContinue={() => {}}
      />
    </View>
  );
}
