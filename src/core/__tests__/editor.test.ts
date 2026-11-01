import { describe, expect, it } from 'vitest';
import {
  addEdge, addNode, createEmptyEditorState, editorStateFromBoard, exportBoard, hasEdge, importBoard, removeEdge, removeNode,
} from '../editor';

describe('editor', () => {
  it('加点、连线、删线', () => {
    const s = createEmptyEditorState();
    const a = addNode(s, 0, 0);
    const b = addNode(s, 100, 0);
    addEdge(s, a, b);
    addEdge(s, a, b);
    expect(s.adj[a]).toEqual([b]);
    expect(hasEdge(s, b, a)).toBe(true);
    removeEdge(s, a, b);
    expect(hasEdge(s, a, b)).toBe(false);
  });

  it('不允许自环', () => {
    const s = createEmptyEditorState();
    const a = addNode(s, 0, 0);
    addEdge(s, a, a);
    expect(s.adj[a]).toEqual([]);
  });

  it('删点同时删除关联边', () => {
    const s = createEmptyEditorState();
    const a = addNode(s, 0, 0);
    const b = addNode(s, 1, 0);
    const c = addNode(s, 2, 0);
    addEdge(s, a, b);
    addEdge(s, b, c);
    removeNode(s, b);
    expect(s.adj[a]).toEqual([]);
    expect(s.adj[c]).toEqual([]);
    expect(b in s.positions).toBe(false);
  });

  it('导出再导入保持结构，nextNodeId 不与已有节点冲突', () => {
    const s = createEmptyEditorState();
    const a = addNode(s, 10, 20);
    const b = addNode(s, 30, 40);
    addEdge(s, a, b);
    const back = importBoard(exportBoard(s, 'x'));
    expect(back.adj).toEqual(s.adj);
    expect(back.positions).toEqual(s.positions);
    expect(back.nextNodeId).toBeGreaterThan(Math.max(a, b));
  });

  it('editorStateFromBoard 深拷贝', () => {
    const board = { name: 't', adj: { 0: [1], 1: [0] }, p: { 0: { x: 0, y: 0 }, 1: { x: 1, y: 1 } } };
    const s = editorStateFromBoard(board);
    s.adj[0].push(9);
    s.positions[0].x = 99;
    expect(board.adj[0]).toEqual([1]);
    expect(board.p[0].x).toBe(0);
  });
});
