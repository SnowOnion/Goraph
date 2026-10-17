import { useRef, useEffect, useCallback } from 'react';
import { View, Canvas } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { isWeapp } from '@/core/env';
import { AdjacencyList, PositionsMap, GameState } from '@/core/types';

interface BoardCanvasProps {
  adj: AdjacencyList;
  positions: PositionsMap;
  gameState: GameState;
  canvasWidth: number;
  canvasHeight: number;
  onPlay: (nodeId: number) => void;
  moveNumbers?: Record<number, number>;
  lastMove?: number | null;
  showMoveNumbers?: boolean;
}

const BOARD_COORDS_SIZE = 1000;

/**
 * 棋盘渲染组件
 * H5 使用原生 Canvas 2D，小程序使用 Taro <Canvas type="2d">
 * 触摸交互：按下预览，拖动跟随，松手落子
 */
export function BoardCanvas({
  adj,
  positions,
  gameState,
  canvasWidth,
  canvasHeight,
  onPlay,
  moveNumbers,
  lastMove,
  showMoveNumbers = true,
}: BoardCanvasProps) {
  /* ---- H5 模式：原生 canvas ---- */
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dprRef = useRef(1);
  const scaleRef = useRef(1);
  const pressingRef = useRef(false);
  const previewRef = useRef<number | null>(null);

  const drawScene = useCallback(() => {
    let ctx: CanvasRenderingContext2D | null = null;
    let cw = 0;
    let ch = 0;
    let dpr = 1;
    let canvas: any = null;

    if (isWeapp) {
      const weappCtx = weappCtxRef.current;
      if (!weappCtx) return;
      ctx = weappCtx.ctx;
      canvas = weappCtx.canvas;
      dpr = weappCtx.dpr;
      cw = canvas.width / dpr;
      ch = canvas.height / dpr;
    } else {
      canvas = canvasRef.current;
      if (!canvas) return;
      ctx = canvas.getContext('2d');
      if (!ctx) return;
      dpr = dprRef.current;
      cw = canvas.width / dpr;
      ch = canvas.height / dpr;
    }

    const scale = scaleRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);

    // 背景
    ctx.fillStyle = '#f5f0e8';
    ctx.fillRect(0, 0, cw, ch);

    // 边
    ctx.strokeStyle = '#999';
    ctx.lineWidth = Math.max(1, scale * 1.5);
    for (const id1 in positions) {
      const n1 = parseInt(id1);
      if (!adj[n1]) continue;
      const p1 = positions[n1];
      for (const id2 of adj[n1]) {
        if (n1 <= id2) {
          const p2 = positions[id2];
          ctx.beginPath();
          ctx.moveTo(p1.x * scale, p1.y * scale);
          ctx.lineTo(p2.x * scale, p2.y * scale);
          ctx.stroke();
        }
      }
    }

    // 节点
    for (const id in positions) {
      const p = positions[parseInt(id)];
      const px = p.x * scale;
      const py = p.y * scale;
      const hasStone = gameState[parseInt(id)]?.s !== 0;
      ctx.fillStyle = hasStone ? 'transparent' : '#666';
      ctx.beginPath();
      ctx.arc(px, py, hasStone ? 0 : scale * 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 棋子
    const stoneRadius = scale * 32;
    for (const id in gameState) {
      const n = parseInt(id);
      if (gameState[n].s === 0) continue;
      const p = positions[n];
      const px = p.x * scale;
      const py = p.y * scale;

      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 2;

      const isBlack = gameState[n].s === 1;
      ctx.fillStyle = isBlack ? '#1a1a1a' : '#f5f5f5';
      ctx.beginPath();
      ctx.arc(px, py, stoneRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowColor = 'transparent';
      const grad = ctx.createRadialGradient(
        px - stoneRadius * 0.3, py - stoneRadius * 0.3, stoneRadius * 0.1,
        px, py, stoneRadius,
      );
      if (isBlack) {
        grad.addColorStop(0, 'rgba(80,80,80,0.4)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
      } else {
        grad.addColorStop(0, 'rgba(255,255,255,0.8)');
        grad.addColorStop(1, 'rgba(200,200,200,0)');
      }
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, stoneRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = isBlack ? '#000' : '#888';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(px, py, stoneRadius, 0, Math.PI * 2);
      ctx.stroke();

      // 最后一手高亮
      if (lastMove === n) {
        ctx.strokeStyle = '#ff5722';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(px, py, stoneRadius + 3, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 落子序号
      if (showMoveNumbers && moveNumbers && moveNumbers[n] != null) {
        const numStr = String(moveNumbers[n]);
        ctx.fillStyle = isBlack ? '#fff' : '#222';
        ctx.font = `bold ${Math.max(10, stoneRadius * 0.55)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(numStr, px, py + 1);
      }
    }

    // 预览
    const previewId = previewRef.current;
    if (previewId != null && gameState[previewId]?.s === 0) {
      const p = positions[previewId];
      ctx.fillStyle = 'rgba(76, 175, 80, 0.4)';
      ctx.beginPath();
      ctx.arc(p.x * scale, p.y * scale, stoneRadius + 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(76, 175, 80, 0.8)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.arc(p.x * scale, p.y * scale, stoneRadius + 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }, [adj, positions, gameState, moveNumbers, lastMove, showMoveNumbers]);

  const redraw = useCallback(() => drawScene(), [drawScene]);

  // H5 canvas 初始化
  useEffect(() => {
    if (isWeapp) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    dprRef.current = dpr;
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    scaleRef.current = Math.min(canvasWidth, canvasHeight) / BOARD_COORDS_SIZE;
    drawScene();
  }, [canvasWidth, canvasHeight]);

  // 游戏状态变化时重绘
  useEffect(() => {
    if (isWeapp) return;
    drawScene();
  }, [gameState, adj, positions, moveNumbers, lastMove, showMoveNumbers]);

  /* ---- 交互（H5 only） ---- */
  const handlePreview = useCallback((clientX: number, clientY: number) => {
    if (isWeapp) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const scale = scaleRef.current;

    let bestDist = Number.MAX_VALUE;
    let bestId = -1;
    for (const id in positions) {
      const p = positions[parseInt(id)];
      const dx = p.x * scale - x;
      const dy = p.y * scale - y;
      const d = dx * dx + dy * dy;
      if (d < bestDist) {
        bestDist = d;
        bestId = parseInt(id);
      }
    }

    const maxDist = (scale * 40) * (scale * 40);
    if (bestDist <= maxDist && bestId >= 0 && gameState[bestId]?.s === 0) {
      if (previewRef.current !== bestId) {
        previewRef.current = bestId;
        redraw();
      }
    } else {
      if (previewRef.current !== null) {
        previewRef.current = null;
        redraw();
      }
    }
  }, [positions, gameState, redraw]);

  const tryPlay = useCallback(() => {
    if (isWeapp) return;
    const nodeId = previewRef.current;
    pressingRef.current = false;
    previewRef.current = null;
    redraw();
    if (nodeId != null && gameState[nodeId]?.s === 0) {
      onPlay(nodeId);
    }
  }, [gameState, onPlay, redraw]);

  const onTouchStart = useCallback((e: any) => {
    e.preventDefault?.();
    pressingRef.current = true;
    const t = e.touches?.[0];
    if (t) handlePreview(t.clientX, t.clientY);
  }, [handlePreview]);

  const onTouchMove = useCallback((e: any) => {
    e.preventDefault?.();
    if (!pressingRef.current) return;
    const t = e.touches?.[0];
    if (t) handlePreview(t.clientX, t.clientY);
  }, [handlePreview]);

  const onTouchEnd = useCallback((e: any) => {
    e.preventDefault?.();
    if (pressingRef.current) tryPlay();
  }, [tryPlay]);

  const onMouseDown = useCallback((e: any) => {
    pressingRef.current = true;
    handlePreview(e.clientX, e.clientY);
  }, [handlePreview]);

  const onMouseMove = useCallback((e: any) => {
    if (!pressingRef.current) return;
    handlePreview(e.clientX, e.clientY);
  }, [handlePreview]);

  const onMouseUp = useCallback(() => {
    if (pressingRef.current) tryPlay();
  }, [tryPlay]);

  const onMouseLeave = useCallback(() => {
    if (pressingRef.current) {
      pressingRef.current = false;
      previewRef.current = null;
      redraw();
    }
  }, [redraw]);

  /* ---- 小程序模式：Taro Canvas ---- */
  const weappCtxRef = useRef<any>(null);

  const onCanvasReady = useCallback(() => {
    if (!isWeapp) return;
    Taro.createSelectorQuery()
      .select('#boardCanvas')
      .fields({ node: true, size: true })
      .exec((res: any) => {
        if (res && res[0] && res[0].node) {
          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          const dpr = Taro.getSystemInfoSync().pixelRatio || 1;
          canvas.width = canvasWidth * dpr;
          canvas.height = canvasHeight * dpr;
          ctx.scale(dpr, dpr);
          weappCtxRef.current = { canvas, ctx, dpr };
          // 小程序里 scale 直接用 canvasWidth/1000
          scaleRef.current = canvasWidth / BOARD_COORDS_SIZE;
          drawScene();
        }
      });
  }, [canvasWidth, canvasHeight]);

  if (isWeapp) {
    return (
      <View style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }}>
        <Canvas
          type="2d"
          id="boardCanvas"
          style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }}
          onReady={onCanvasReady}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        />
      </View>
    );
  }

  /* ---- H5 模式 ---- */
  return (
    <View style={{
      width: `${canvasWidth}px`,
      height: `${canvasHeight}px`,
      touchAction: 'none',
      WebkitTapHighlightColor: 'transparent',
      userSelect: 'none',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    }}>
      <canvas
        ref={canvasRef}
        style={{
          width: `${canvasWidth}px`,
          height: `${canvasHeight}px`,
          touchAction: 'none',
          display: 'block',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
      />
    </View>
  );
}
