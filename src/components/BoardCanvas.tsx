import { useRef, useEffect, useCallback } from 'react';
import { View } from '@tarojs/components';
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
 * 棋盘渲染组件 - H5 Canvas 2D
 * 通过 ref 回调绑定事件，绕过 Taro 合成事件系统
 */
export function BoardCanvas(props: BoardCanvasProps) {
  const { adj, positions, gameState, canvasWidth, canvasHeight, onPlay, moveNumbers, lastMove, showMoveNumbers = true } = props;

  const cRef = useRef<HTMLCanvasElement>(null);
  const dprRef = useRef(1);
  const scaleRef = useRef(1);
  const pressing = useRef(false);
  const preview = useRef<number | null>(null);

  // 最新状态 refs
  const gsRef = useRef(gameState);
  const posRef = useRef(positions);
  const adjRef = useRef(adj);
  const mnsRef = useRef(moveNumbers);
  const lmRef = useRef(lastMove);
  const snRef = useRef(showMoveNumbers);
  gsRef.current = gameState;
  posRef.current = positions;
  adjRef.current = adj;
  mnsRef.current = moveNumbers;
  lmRef.current = lastMove;
  snRef.current = showMoveNumbers;

  // 绘制
  const paint = () => {
    const gs = gsRef.current;
    const pos = posRef.current;
    const adj = adjRef.current;
    const c = cRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const dpr = dprRef.current;
    const scale = scaleRef.current;
    const cw = c.width / dpr;
    const ch = c.height / dpr;

    ctx.clearRect(0, 0, c.width, c.height);
    ctx.save();
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#f5f0e8';
    ctx.fillRect(0, 0, cw, ch);

    ctx.strokeStyle = '#999';
    ctx.lineWidth = Math.max(1, scale * 1.5);
    for (const k1 in pos) {
      const n1 = parseInt(k1);
      if (!adj[n1]) continue;
      for (const n2 of adj[n1]) {
        if (n1 <= n2) {
          ctx.beginPath();
          ctx.moveTo(pos[n1].x * scale, pos[n1].y * scale);
          ctx.lineTo(pos[n2].x * scale, pos[n2].y * scale);
          ctx.stroke();
        }
      }
    }

    for (const k in pos) {
      const p = pos[parseInt(k)];
      const stone = gs[parseInt(k)]?.s ?? 0;
      ctx.fillStyle = stone ? 'transparent' : '#666';
      ctx.beginPath();
      ctx.arc(p.x * scale, p.y * scale, stone ? 0 : scale * 3, 0, Math.PI * 2);
      ctx.fill();
    }

    const r = scale * 32;
    for (const k in gs) {
      const n = parseInt(k);
      if (gs[n].s === 0) continue;
      const p = pos[n];
      const black = gs[n].s === 1;

      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 4;
      ctx.fillStyle = black ? '#1a1a1a' : '#eee';
      ctx.beginPath();
      ctx.arc(p.x * scale, p.y * scale, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowColor = 'transparent';

      ctx.strokeStyle = black ? '#000' : '#999';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(p.x * scale, p.y * scale, r, 0, Math.PI * 2);
      ctx.stroke();

      if (lmRef.current === n) {
        ctx.strokeStyle = '#ff5722';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(p.x * scale, p.y * scale, r + 3, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (snRef.current && mnsRef.current && mnsRef.current[n] != null) {
        ctx.fillStyle = black ? '#fff' : '#222';
        ctx.font = `bold ${Math.max(10, r * 0.55)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(mnsRef.current[n]), p.x * scale, p.y * scale + 1);
      }
    }

    const pid = preview.current;
    if (pid != null && gs[pid]?.s === 0) {
      const p = pos[pid];
      ctx.fillStyle = 'rgba(76,175,80,0.4)';
      ctx.beginPath();
      ctx.arc(p.x * scale, p.y * scale, r + 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  };

  // 预览处理
  const doPreview = useCallback((cx: number, cy: number) => {
    const pos = posRef.current;
    const gs = gsRef.current;
    const c = cRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    const x = cx - rect.left;
    const y = cy - rect.top;
    const scale = scaleRef.current;

    let bestD = Infinity;
    let bestId = -1;
    for (const k in pos) {
      const p = pos[parseInt(k)];
      const dx = p.x * scale - x;
      const dy = p.y * scale - y;
      const d = dx * dx + dy * dy;
      if (d < bestD) { bestD = d; bestId = parseInt(k); }
    }

    const maxD = (scale * 40) ** 2;
    if (bestD <= maxD && bestId >= 0 && gs[bestId]?.s === 0) {
      if (preview.current !== bestId) {
        preview.current = bestId;
        paint();
      }
    } else if (preview.current !== null) {
      preview.current = null;
      paint();
    }
  }, []);

  // 落子处理
  const doPlay = useCallback(() => {
    const gs = gsRef.current;
    const nid = preview.current;
    pressing.current = false;
    preview.current = null;
    paint();
    if (nid != null && gs[nid]?.s === 0) onPlay(nid);
  }, [onPlay]);

  // ref 回调：canvas 挂载时初始化并绑定事件
  const onCanvas = useCallback((node: HTMLCanvasElement | null) => {
    if (!node) return;
    cRef.current = node;

    const dpr = window.devicePixelRatio || 1;
    dprRef.current = dpr;
    node.width = canvasWidth * dpr;
    node.height = canvasHeight * dpr;
    scaleRef.current = Math.min(canvasWidth, canvasHeight) / BOARD_COORDS_SIZE;
    paint();

    node.addEventListener('mousedown', (e) => { pressing.current = true; doPreview(e.clientX, e.clientY); });
    node.addEventListener('mousemove', (e) => { if (pressing.current) doPreview(e.clientX, e.clientY); });
    node.addEventListener('mouseup', () => { if (pressing.current) doPlay(); });
    node.addEventListener('mouseleave', () => { pressing.current = false; preview.current = null; paint(); });
    node.addEventListener('touchstart', (e) => { e.preventDefault(); pressing.current = true; const t = e.touches[0]; if (t) doPreview(t.clientX, t.clientY); }, { passive: false });
    node.addEventListener('touchmove', (e) => { e.preventDefault(); if (pressing.current) { const t = e.touches[0]; if (t) doPreview(t.clientX, t.clientY); } }, { passive: false });
    node.addEventListener('touchend', (e) => { e.preventDefault(); if (pressing.current) doPlay(); }, { passive: false });
  }, [canvasWidth, canvasHeight, doPreview, doPlay]);

  // 状态变化时重绘
  useEffect(() => { paint(); }, [gameState, adj, positions, moveNumbers, lastMove, showMoveNumbers]);

  return (
    <View style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px`, touchAction: 'none', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
      <canvas ref={onCanvas} style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px`, touchAction: 'none', display: 'block' }} />
    </View>
  );
}
