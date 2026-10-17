import { useState } from 'react';
import { View } from '@tarojs/components';
import { Text } from '@/components/Text';
import { BOARDS } from '@/core/boards';
import { GameEndDialog } from '@/components/GameEndDialog';
import { BoardCanvas } from '@/components/BoardCanvas';
import { useGame } from '@/hooks/useGame';
import { calculateScore } from '@/core/game-engine';
import Taro, { useReady, useDidShow } from '@tarojs/taro';
import './index.scss';

export default function Index() {
  const [canvasSize, setCanvasSize] = useState({ width: 350, height: 350 });
  const [showSettings, setShowSettings] = useState(false);
  const [showNumbers, setShowNumbers] = useState(true);

  const calcCanvasSize = () => {
    const sysInfo = Taro.getSystemInfoSync();
    const maxSize = Math.min(sysInfo.windowWidth - 32, sysInfo.windowHeight * 0.48, 480);
    setCanvasSize({ width: Math.floor(maxSize), height: Math.floor(maxSize) });
  };

  useReady(() => calcCanvasSize());
  useDidShow(() => calcCanvasSize());

  const {
    gameState, meta, adj, positions, boardIndex, allBoards, info,
    isRectangular, hasFiveRule, moveNumbers, lastMove, moveCount,
    noRepeat, aiEnabled, aiThinking, capturedBlack, capturedWhite,
    canUndo,
    selectBoard, handlePlay, pass, restart, toggleFiveRule,
    toggleNoRepeat, toggleAI, undo,
  } = useGame();

  return (
    <View className="game-page">
      {/* 顶栏 */}
      <View className="game-header">
        <View className="turn-indicator">
          <View className={`stone-icon ${meta.next === 1 ? 'black' : 'white'}`} />
          <Text className="turn-text">{meta.next === 1 ? '黑棋' : '白棋'}落子</Text>
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
        <View className={`action-btn ${(!canUndo || meta.ended) ? 'disabled' : ''}`} onClick={(!canUndo || meta.ended) ? undefined : undo}>
          <Text className="action-icon">↩</Text>
          <Text className="action-label">悔棋</Text>
        </View>
        <View className={`action-btn primary ${meta.ended ? 'disabled' : ''}`} onClick={meta.ended ? undefined : pass}>
          <Text className="action-icon">⏭</Text>
          <Text className="action-label">PASS</Text>
        </View>
        <View className="action-btn" onClick={restart}>
          <Text className="action-icon">🔄</Text>
          <Text className="action-label">重来</Text>
        </View>
        <View className="action-btn" onClick={() => setShowSettings(s => !s)}>
          <Text className="action-icon">⚙️</Text>
          <Text className="action-label">设置</Text>
        </View>
      </View>

      {/* 信息提示 */}
      {info && info.length > 1 && (
        <View className={`info-bar ${info.includes('不合') || info.includes('禁止') ? 'error' : ''}`}>
          <Text>{info}</Text>
        </View>
      )}

      {/* 设置面板 */}
      {showSettings && (
        <View className="settings-overlay" onClick={() => setShowSettings(false)}>
          <View className="settings-panel" onClick={(e) => e.stopPropagation()}>
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
        onRestart={restart}
        onContinue={() => {}}
      />
    </View>
  );
}
