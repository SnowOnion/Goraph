import { useRef, useEffect, useCallback } from 'react';
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

export function BoardCanvas(props: BoardCanvasProps) {
  const { adj, positions, gameState, canvasWidth, canvasHeight, onPlay, moveNumbers, lastMove, showMoveNumbers = true } = props;

  const cRef = useRef<HTMLCanvasElement>(null);
  const dprRef = useRef(1);
  const scaleRef = useRef(1);
  const pressing = useRef(false);
  const preview = useRef<number | null>(null);

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

  const paint = () => {
    const gs = gsRef.current;
    const pos = posRef.current;
    const a = adjRef.current;
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

    ctx.fillStyle = '#e8d5b0';
    ctx.fillRect(0, 0, cw, ch);

    ctx.strokeStyle = '#999';
    ctx.lineWidth = Math.max(1, scale * 1.5);
    for (const k1 in pos) {
      const n1 = parseInt(k1);
      if (!a[n1]) continue;
      for (const n2 of a[n1]) {
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

    // 始终吸附到最近节点（无距离阈值），只要有节点且为空
    if (bestId >= 0 && gs[bestId]?.s === 0) {
      if (preview.current !== bestId) {
        preview.current = bestId;
        paint();
      }
    } else if (preview.current !== null) {
      preview.current = null;
      paint();
    }
  }, []);

  const doPlay = useCallback(() => {
    const gs = gsRef.current;
    const nid = preview.current;
    pressing.current = false;
    preview.current = null;
    paint();
    if (nid != null && gs[nid]?.s === 0) onPlay(nid);
  }, [onPlay]);

  // 用 callback ref 确保每次 canvas 创建/重新创建都绑定事件
  const canvasRef = useCallback((node: HTMLCanvasElement | null) => {
    if (!node) return;
    cRef.current = node;

    const dpr = window.devicePixelRatio || 1;
    dprRef.current = dpr;
    node.width = canvasWidth * dpr;
    node.height = canvasHeight * dpr;
    scaleRef.current = Math.min(canvasWidth, canvasHeight) / BOARD_COORDS_SIZE;
    paint();

    const onMd = (e: MouseEvent) => { pressing.current = true; doPreview(e.clientX, e.clientY); };
    const onMm = (e: MouseEvent) => { if (pressing.current) doPreview(e.clientX, e.clientY); };
    const onMu = () => { if (pressing.current) doPlay(); };
    const onMl = () => { pressing.current = false; preview.current = null; paint(); };
    const onTs = (e: TouchEvent) => { e.preventDefault(); pressing.current = true; const t = e.touches[0]; if (t) doPreview(t.clientX, t.clientY); };
    const onTm = (e: TouchEvent) => { e.preventDefault(); if (pressing.current) { const t = e.touches[0]; if (t) doPreview(t.clientX, t.clientY); } };
    const onTe = (e: TouchEvent) => { e.preventDefault(); if (pressing.current) doPlay(); };

    node.addEventListener('mousedown', onMd);
    node.addEventListener('mousemove', onMm);
    node.addEventListener('mouseup', onMu);
    node.addEventListener('mouseleave', onMl);
    node.addEventListener('touchstart', onTs, { passive: false });
    node.addEventListener('touchmove', onTm, { passive: false });
    node.addEventListener('touchend', onTe, { passive: false });
  }, [canvasWidth, canvasHeight, doPreview, doPlay]);

  // 状态变化时重绘
  useEffect(() => { paint(); }, [gameState, adj, positions, moveNumbers, lastMove, showMoveNumbers]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: `${canvasWidth}px`,
        height: `${canvasHeight}px`,
        touchAction: 'none',
        display: 'block',
        borderRadius: '8px',
      }}
    />
  );
}
