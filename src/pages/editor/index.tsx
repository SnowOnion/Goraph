import { useState } from 'react';
import { View } from '@tarojs/components';
import { Text } from '@/components/Text';
import Taro, { useReady } from '@tarojs/taro';
import { EditorCanvas, EditorTool } from '@/components/EditorCanvas';
import { useEditor } from '@/hooks/useEditor';
import './editor.scss';

const TOOLS: { key: EditorTool; label: string; icon: string }[] = [
  { key: 'addNode', label: '加点', icon: '⊕' },
  { key: 'addEdge', label: '连线', icon: '╱' },
  { key: 'select', label: '移动', icon: '✥' },
  { key: 'delete', label: '删除', icon: '✕' },
];

export default function EditorPage() {
  const [canvasSize, setCanvasSize] = useState({ width: 350, height: 350 });
  const [showJSON, setShowJSON] = useState(false);

  useReady(() => {
    const sysInfo = Taro.getSystemInfoSync();
    const maxSize = Math.min(sysInfo.windowWidth - 40, sysInfo.windowHeight * 0.42, 400);
    setCanvasSize({ width: Math.floor(maxSize), height: Math.floor(maxSize) });
  });

  const {
    state, tool, boardName, saveMessage, savedNames,
    canUndo, canRedo,
    setTool, setBoardName,
    handleAddNode, handleSelectNode, handleMoveNode,
    handleDeleteNode, handleAddEdge, handleDeleteEdge,
    handleClear, handleUndo, handleRedo,
    handleSave, handleExport, handleLoad, handleDeleteBoard,
  } = useEditor();

  const nodeCount = Object.keys(state.positions).length;
  const edgeCount = Object.values(state.adj).reduce((sum, arr) => sum + arr.length, 0) / 2;

  return (
    <View className="editor-page">
      {/* 顶栏 */}
      <View className="editor-header">
        <View className="editor-title">
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#e0e0e0' }}>棋盘编辑器</Text>
        </View>
        <View className="editor-top-actions">
          <View className="btn-sm" onClick={() => Taro.navigateBack()}>
            <Text>← 返回</Text>
          </View>
        </View>
      </View>

      {/* 工具栏 */}
      <View className="editor-toolbar">
        {TOOLS.map((t) => (
          <View
            key={t.key}
            className={`tool-btn ${tool === t.key ? 'active' : ''}`}
            onClick={() => setTool(t.key)}
          >
            <Text style={{ fontSize: 18 }}>{t.icon}</Text>
            <Text style={{ fontSize: 11 }}>{t.label}</Text>
          </View>
        ))}
      </View>

      {/* Canvas */}
      <View className="editor-canvas-wrap">
        <EditorCanvas
          editorState={state}
          tool={tool}
          onAddNode={handleAddNode}
          onSelectNode={handleSelectNode}
          onMoveNode={handleMoveNode}
          onDeleteNode={handleDeleteNode}
          onAddEdge={handleAddEdge}
          onDeleteEdge={handleDeleteEdge}
          width={canvasSize.width}
          height={canvasSize.height}
        />
      </View>

      {/* 统计 + 操作 */}
      <View className="editor-actions">
        <View className="editor-info">
          <Text className="info-text">节点: {nodeCount} · 边: {edgeCount}</Text>
        </View>
        <View className="editor-buttons">
          <View className={`btn ${!canUndo ? 'disabled' : ''}`} onClick={canUndo ? handleUndo : undefined}>
            <Text>↩</Text>
          </View>
          <View className={`btn ${!canRedo ? 'disabled' : ''}`} onClick={canRedo ? handleRedo : undefined}>
            <Text>↪</Text>
          </View>
          <View className="btn" onClick={handleClear}>
            <Text>🗑</Text>
          </View>
          <View className="btn primary" onClick={handleSave}>
            <Text>保存</Text>
          </View>
        </View>
      </View>

      {/* 消息提示 */}
      {saveMessage && (
        <View className="editor-message">
          <Text>{saveMessage}</Text>
        </View>
      )}

      {/* 已保存棋盘 */}
      {savedNames.length > 0 && (
        <View className="saved-boards">
          <Text className="saved-title">已保存的棋盘</Text>
          {savedNames.map((name) => (
            <View key={name} className="saved-item">
              <Text className="saved-name">{name}</Text>
              <View className="saved-actions">
                <View className="btn-xs" onClick={() => handleLoad(name)}>
                  <Text>加载</Text>
                </View>
                <View className="btn-xs danger" onClick={() => handleDeleteBoard(name)}>
                  <Text>删除</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
