import { useRef, useEffect, useCallback } from 'react';
import { View } from '@tarojs/components';
import { AdjacencyList, PositionsMap } from '@/core/types';
import { EditorState } from '@/core/editor';

/** 编辑器工具类型 */
export type EditorTool = 'select' | 'addNode' | 'addEdge' | 'delete';

interface EditorCanvasProps {
  editorState: EditorState;
  tool: EditorTool;
  onAddNode: (x: number, y: number) => void;
  onSelectNode: (nodeId: number | null) => void;
  onMoveNode: (nodeId: number, x: number, y: number) => void;
  onDeleteNode: (nodeId: number) => void;
  onAddEdge: (id1: number, id2: number) => void;
  onDeleteEdge: (id1: number, id2: number) => void;
  width: number;
  height: number;
}

const CANVAS_COORDS = 1000;

export function EditorCanvas({
  editorState,
  tool,
  onAddNode,
  onSelectNode,
  onMoveNode,
  onDeleteNode,
  onAddEdge,
  onDeleteEdge,
  width,
  height,
}: EditorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dprRef = useRef(1);
  const dragRef = useRef<{ nodeId: number; offsetX: number; offsetY: number } | null>(null);

  const scale = Math.min(width, height) / CANVAS_COORDS;

  /* ---- 绘制 ---- */
  const drawScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = dprRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);

    // 背景
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, width, height);

    // 网格点（辅助对齐）
    ctx.fillStyle = '#e0e0e0';
    const gridStep = 100 * scale;
    for (let gx = gridStep; gx < width; gx += gridStep) {
      for (let gy = gridStep; gy < height; gy += gridStep) {
        ctx.beginPath();
        ctx.arc(gx, gy, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 边
    for (const id1 in editorState.adj) {
      const n1 = parseInt(id1);
      if (!editorState.positions[n1]) continue;
      for (const id2 of editorState.adj[n1]) {
        if (n1 <= id2 && editorState.positions[id2]) {
          const p1 = editorState.positions[n1];
          const p2 = editorState.positions[id2];
          ctx.strokeStyle = '#888';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(p1.x * scale, p1.y * scale);
          ctx.lineTo(p2.x * scale, p2.y * scale);
          ctx.stroke();
        }
      }
    }

    // 节点
    const nodeRadius = Math.max(8, 14 * scale);
    for (const id in editorState.positions) {
      const n = parseInt(id);
      const p = editorState.positions[n];
      const isSelected = editorState.selectedNode === n;

      // 选中高亮
      if (isSelected) {
        ctx.fillStyle = 'rgba(76, 175, 80, 0.3)';
        ctx.beginPath();
        ctx.arc(p.x * scale, p.y * scale, nodeRadius + 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // 节点圆
      ctx.fillStyle = isSelected ? '#4CAF50' : '#2196F3';
      ctx.beginPath();
      ctx.arc(p.x * scale, p.y * scale, nodeRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x * scale, p.y * scale, nodeRadius, 0, Math.PI * 2);
      ctx.stroke();

      // 节点 ID
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.max(10, 12 * scale)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(n), p.x * scale, p.y * scale);
    }

    // 工具提示
    const hints: Record<EditorTool, string> = {
      select: '点击节点可选中，可拖拽移动',
      addNode: '点击空白处添加节点',
      addEdge: '依次点击两个节点以连线',
      delete: '点击节点或边以删除',
    };
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(hints[tool], width / 2, height - 10);

    ctx.restore();
  }, [editorState, tool, width, height, scale]);

  /* ---- 初始化 ---- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    dprRef.current = dpr;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    drawScene();
  }, [width, height, drawScene]);

  useEffect(() => {
    drawScene();
  }, [drawScene]);

  /* ---- 交互 ---- */
  const getCanvasPos = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }, []);

  const findNodeAt = useCallback((x: number, y: number): number | null => {
    const nodeRadius = Math.max(8, 14 * scale);
    for (const id in editorState.positions) {
      const p = editorState.positions[parseInt(id)];
      const dx = p.x * scale - x;
      const dy = p.y * scale - y;
      if (dx * dx + dy * dy < (nodeRadius + 8) * (nodeRadius + 8)) {
        return parseInt(id);
      }
    }
    return null;
  }, [editorState.positions, scale]);

  const findEdgeAt = useCallback((x: number, y: number): [number, number] | null => {
    const threshold = 8;
    for (const id1 in editorState.adj) {
      const n1 = parseInt(id1);
      if (!editorState.positions[n1]) continue;
      for (const id2 of editorState.adj[n1]) {
        if (n1 >= id2) continue;
        if (!editorState.positions[id2]) continue;
        const p1 = editorState.positions[n1];
        const p2 = editorState.positions[id2];
        // 点到线段距离
        const ax = p1.x * scale, ay = p1.y * scale;
        const bx = p2.x * scale, by = p2.y * scale;
        const len2 = (bx - ax) * (bx - ax) + (by - ay) * (by - ay);
        if (len2 === 0) continue;
        let t = ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / len2;
        t = Math.max(0, Math.min(1, t));
        const projX = ax + t * (bx - ax);
        const projY = ay + t * (by - ay);
        const dist = Math.sqrt((x - projX) ** 2 + (y - projY) ** 2);
        if (dist < threshold) return [n1, id2];
      }
    }
    return null;
  }, [editorState.adj, editorState.positions, scale]);

  const handleStart = useCallback((clientX: number, clientY: number) => {
    const { x, y } = getCanvasPos(clientX, clientY);

    switch (tool) {
      case 'addNode': {
        const existing = findNodeAt(x, y);
        if (existing == null) {
          onAddNode(x / scale, y / scale);
        }
        break;
      }
      case 'select': {
        const node = findNodeAt(x, y);
        if (node != null) {
          onSelectNode(node);
          const p = editorState.positions[node];
          dragRef.current = { nodeId: node, offsetX: x - p.x * scale, offsetY: y - p.y * scale };
        } else {
          onSelectNode(null);
        }
        break;
      }
      case 'addEdge': {
        const node = findNodeAt(x, y);
        if (node != null) {
          if (editorState.selectedNode == null) {
            onSelectNode(node);
          } else if (editorState.selectedNode !== node) {
            onAddEdge(editorState.selectedNode, node);
            onSelectNode(null);
          }
        }
        break;
      }
      case 'delete': {
        const node = findNodeAt(x, y);
        if (node != null) {
          onDeleteNode(node);
        } else {
          const edge = findEdgeAt(x, y);
          if (edge) onDeleteEdge(edge[0], edge[1]);
        }
        break;
      }
    }
  }, [tool, getCanvasPos, findNodeAt, findEdgeAt, onAddNode, onSelectNode, onAddEdge, onDeleteNode, onDeleteEdge, editorState.positions, editorState.selectedNode, scale]);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (tool === 'select' && dragRef.current) {
      const { x, y } = getCanvasPos(clientX, clientY);
      const { nodeId, offsetX, offsetY } = dragRef.current;
      const newX = (x - offsetX) / scale;
      const newY = (y - offsetY) / scale;
      // 限制在范围内
      const clampedX = Math.max(10, Math.min(CANVAS_COORDS - 10, newX));
      const clampedY = Math.max(10, Math.min(CANVAS_COORDS - 10, newY));
      onMoveNode(nodeId, clampedX, clampedY);
    }
  }, [tool, getCanvasPos, onMoveNode, scale]);

  const handleEnd = useCallback(() => {
    dragRef.current = null;
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const t = e.touches[0];
    if (t) handleStart(t.clientX, t.clientY);
  }, [handleStart]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const t = e.touches[0];
    if (t) handleMove(t.clientX, t.clientY);
  }, [handleMove]);

  const onTouchEnd = useCallback(() => handleEnd(), [handleEnd]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    handleStart(e.clientX, e.clientY);
  }, [handleStart]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  }, [handleMove]);

  const onMouseUp = useCallback(() => handleEnd(), [handleEnd]);

  const cursorStyle = {
    select: 'default',
    addNode: 'crosshair',
    addEdge: 'pointer',
    delete: 'not-allowed',
  }[tool];

  return (
    <View style={{
      width: `${width}px`,
      height: `${height}px`,
      touchAction: 'none',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      border: '2px solid #e0e0e0',
    }}>
      <canvas
        ref={canvasRef}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          touchAction: 'none',
          cursor: cursorStyle,
          display: 'block',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
      />
    </View>
  );
}
