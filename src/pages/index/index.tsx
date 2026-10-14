import { useState, useEffect, useCallback } from 'react';
import { View } from '@tarojs/components';
import { Text } from '@/components/Text';
import Taro, { useReady } from '@tarojs/taro';
import { BoardCanvas } from '@/components/BoardCanvas';
import { GameControls } from '@/components/GameControls';
import { useGame } from '@/hooks/useGame';

export default function Index() {
  const [canvasSize, setCanvasSize] = useState({ width: 350, height: 350 });

  // 响应式计算 canvas 函数
  const calcCanvasSize = useCallback(() => {
    const sysInfo = Taro.getSystemInfoSync();
    const pad = 40;
    const maxSize = Math.min(
      sysInfo.windowWidth - pad,
      sysInfo.windowHeight * 0.5,
      500,
    );
    setCanvasSize({ width: Math.floor(maxSize), height: Math.floor(maxSize) });
  }, []);

  useReady(() => {
    calcCanvasSize();
  });

  // 屏幕旋转/尺寸变化时重算
  useEffect(() => {
    const handler = () => calcCanvasSize();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [calcCanvasSize]);

  const {
    gameState,
    meta,
    adj,
    positions,
    boardIndex,
    boardName,
    allBoards,
    info,
    isRectangular,
    hasFiveRule,
    moveNumbers,
    lastMove,
    canUndo,
    moveCount,
    selectBoard,
    handlePlay,
    pass,
    restart,
    toggleFiveRule,
    refreshBoards,
    undo,
  } = useGame();

  const currentBoard = allBoards[boardIndex];
  const [showNumbers, setShowNumbers] = useState(true);

  return (
    <View style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: 'max(16px, env(safe-area-inset-top)) 16px max(16px, env(safe-area-inset-bottom))',
      minHeight: '100vh',
      minHeight: '100dvh',
      boxSizing: 'border-box',
      backgroundColor: '#f5f0e8',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
      // 禁止 iOS 弹性滚动
      overscrollBehavior: 'none',
      WebkitOverflowScrolling: 'touch',
    }}>
      {/* 标题 */}
      <View style={{
        fontSize: '22px',
        fontWeight: '700',
        color: '#2c2c2c',
        marginBottom: '6px',
        letterSpacing: '2px',
      }}>
        图上的围棋
      </View>

      {/* 棋盘 */}
      <View
        style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
          marginBottom: '16px',
          position: 'relative',
        }}
      >
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

      {/* 控制面板 */}
      <GameControls
        boardIndex={boardIndex}
        allBoards={allBoards}
        isNextBlack={meta.next === 1}
        isRectangular={isRectangular}
        hasFiveRule={hasFiveRule}
        ended={meta.ended}
        canUndo={canUndo}
        moveCount={moveCount}
        showNumbers={showNumbers}
        info={info}
        onSelectBoard={selectBoard}
        onRestart={restart}
        onPass={pass}
        onToggleFiveRule={toggleFiveRule}
        onToggleShowNumbers={() => setShowNumbers((p) => !p)}
        onUndo={undo}
      />

      {/* 编辑器入口 */}
      <View
        onClick={() => Taro.navigateTo({ url: '/pages/editor/index' })}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '10px 20px',
          borderRadius: '10px',
          fontSize: '14px',
          backgroundColor: '#fff',
          color: '#2196F3',
          border: '2px solid #2196F3',
          cursor: 'pointer',
          marginTop: '12px',
          boxShadow: '0 2px 6px rgba(33,150,243,0.15)',
        }}
      >
        <Text>✏️</Text>
        <Text>棋盘编辑器</Text>
      </View>

      {/* 底部 */}
      <View style={{
        fontSize: '12px',
        color: '#bbb',
        marginTop: 'auto',
        padding: '16px 0 24px',
        textAlign: 'center',
      }}>
        <View>Goraph v1.0 · 任意图上的围棋</View>
        <View style={{ marginTop: '4px', color: '#4CAF50' }}>
          github.com/SnowOnion/Goraph
        </View>
      </View>
    </View>
  );
}
