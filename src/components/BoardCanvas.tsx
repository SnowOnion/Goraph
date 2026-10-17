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

  // 用 ref 保持最新值，避免 useCallback 闭包捕获旧状态
  const gameStateRef = useRef(gameState);
  const adjRef = useRef(adj);
  const positionsRef = useRef(positions);
  const moveNumbersRef = useRef(moveNumbers);
  const lastMoveRef = useRef(lastMove);
  const showNumbersRef = useRef(showMoveNumbers);
  gameStateRef.current = gameState;
  adjRef.current = adj;
  positionsRef.current = positions;
  moveNumbersRef.current = moveNumbers;
  lastMoveRef.current = lastMove;
  showNumbersRef.current = showMoveNumbers;

  // 绘制函数：从 ref 读取最新状态，不使用 useCallback 避免闭包捕获
  const drawScene = () => {
    const gs = gameStateRef.current;
    const adj = adjRef.current;
    const pos = positionsRef.current;
    const mns = moveNumbersRef.current;
    const lm = lastMoveRef.current;
    const sn = showNumbersRef.current;

    let canvas: any = null;
    let ctx: CanvasRenderingContext2D | null = null;
    let dpr = 1;

    if (isWeapp) {
      const weappCtx = weappCtxRef.current;
      if (!weappCtx) return;
      ctx = weappCtx.ctx;
      canvas = weappCtx.canvas;
      dpr = weappCtx.dpr;
    } else {
      canvas = canvasRef.current;
      if (!canvas) return;
      ctx = canvas.getContext('2d');
      if (!ctx) return;
      dpr = dprRef.current;
    }

    const scale = scaleRef.current;
    const cw = canvas.width / dpr;
    const ch = canvas.height / dpr;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);

    // 背景
    ctx.fillStyle = '#f5f0e8';
    ctx.fillRect(0, 0, cw, ch);

    // 边
    ctx.strokeStyle = '#999';
    ctx.lineWidth = Math.max(1, scale * 1.5);
    for (const id1 in pos) {
      const n1 = parseInt(id1);
      if (!adj[n1]) continue;
      const p1 = pos[n1];
      for (const id2 of adj[n1]) {
        if (n1 <= id2) {
          const p2 = pos[id2];
          ctx.beginPath();
          ctx.moveTo(p1.x * scale, p1.y * scale);
          ctx.lineTo(p2.x * scale, p2.y * scale);
          ctx.stroke();
        }
      }
    }

    // 节点
    for (const id in pos) {
      const p = pos[parseInt(id)];
      const px = p.x * scale;
      const py = p.y * scale;
      const hasStone = gs[parseInt(id)]?.s !== 0;
      ctx.fillStyle = hasStone ? 'transparent' : '#666';
      ctx.beginPath();
      ctx.arc(px, py, hasStone ? 0 : scale * 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 棋子
    const stoneRadius = scale * 32;
    for (const id in gs) {
      const n = parseInt(id);
      if (gs[n].s === 0) continue;
      const p = pos[n];
      const px = p.x * scale;
      const py = p.y * scale;

      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 2;

      const isBlack = gs[n].s === 1;
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
      if (lm === n) {
        ctx.strokeStyle = '#ff5722';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(px, py, stoneRadius + 3, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 落子序号
      if (sn && mns && mns[n] != null) {
        const numStr = String(mns[n]);
        ctx.fillStyle = isBlack ? '#fff' : '#222';
        ctx.font = `bold ${Math.max(10, stoneRadius * 0.55)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(numStr, px, py + 1);
      }
    }

    // 预览
    const previewId = previewRef.current;
    if (previewId != null && gs[previewId]?.s === 0) {
      const p = pos[previewId];
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
  };

  const redraw = () => drawScene();

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
  }, [canvasWidth, canvasHeight]);

  // 绘制：每次相关状态变化时重绘
  const drawVersion = useRef(0);
  useEffect(() => {
    if (isWeapp) return;
    drawVersion.current++;
    const myVersion = drawVersion.current;
    requestAnimationFrame(() => {
      if (drawVersion.current === myVersion) {
        drawScene();
      }
    });
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

  /* ---- 原生事件绑定（绕过 Taro 合成事件） ---- */
  useEffect(() => {
    if (isWeapp) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onMouseDown = (e: MouseEvent) => {
      pressingRef.current = true;
      handlePreview(e.clientX, e.clientY);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!pressingRef.current) return;
      handlePreview(e.clientX, e.clientY);
    };

    const onMouseUp = (e: MouseEvent) => {
      if (!pressingRef.current) return;
      tryPlay();
    };

    const onMouseLeave = () => {
      if (pressingRef.current) {
        pressingRef.current = false;
        previewRef.current = null;
        redraw();
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      pressingRef.current = true;
      const t = e.touches[0];
      if (t) handlePreview(t.clientX, t.clientY);
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (!pressingRef.current) return;
      const t = e.touches[0];
      if (t) handlePreview(t.clientX, t.clientY);
    };

    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      if (pressingRef.current) tryPlay();
    };

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mouseleave', onMouseLeave);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('mouseleave', onMouseLeave);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
    };
  }, [handlePreview, tryPlay, redraw]);

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
      />
    </View>
  );
}
