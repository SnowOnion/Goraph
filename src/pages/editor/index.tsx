import { useState, useCallback } from 'react';
import { View } from '@tarojs/components';
import { Text } from '@/components/Text';
import Taro, { useReady } from '@tarojs/taro';
import { EditorCanvas, EditorTool } from '@/components/EditorCanvas';
import { useEditor } from '@/hooks/useEditor';

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
    const maxSize = Math.min(sysInfo.windowWidth - 30, sysInfo.windowHeight * 0.45, 450);
    setCanvasSize({ width: Math.floor(maxSize), height: Math.floor(maxSize) });
  });

  const {
    state,
    tool,
    boardName,
    saveMessage,
    savedNames,
    canUndo,
    canRedo,
    setTool,
    setBoardName,
    handleAddNode,
    handleSelectNode,
    handleMoveNode,
    handleDeleteNode,
    handleAddEdge,
    handleDeleteEdge,
    handleClear,
    handleUndo,
    handleRedo,
    handleSave,
    handleExport,
    handleLoad,
    handleDeleteBoard,
  } = useEditor();

  const nodeCount = Object.keys(state.positions).length;
  const edgeCount = Object.values(state.adj).reduce((sum, arr) => sum + arr.length, 0) / 2;

  return (
    <View style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '12px',
      minHeight: '100vh',
      backgroundColor: '#f5f0e8',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* 标题 */}
      <View style={{
        fontSize: '20px',
        fontWeight: '700',
        color: '#2c2c2c',
        marginBottom: '10px',
      }}>
        棋盘编辑器
      </View>

      {/* 工具栏和操作 */}
      <View style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '12px',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <input
          value={boardName}
          onChange={(e) => setBoardName((e.target as any).value)}
          placeholder="棋盘名称"
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #ccc',
            fontSize: '13px',
            width: '120px',
            outline: 'none',
          }}
        />
      </View>

      {/* 工具栏 */}
      <View style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '12px',
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        {TOOLS.map((t) => (
          <View
            key={t.key}
            onClick={() => setTool(t.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '8px 14px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: tool === t.key ? '600' : '400',
              backgroundColor: tool === t.key ? '#2196F3' : '#fff',
              color: tool === t.key ? '#fff' : '#555',
              border: `2px solid ${tool === t.key ? '#1565C0' : '#ddd'}`,
              cursor: 'pointer',
              boxShadow: tool === t.key ? '0 2px 6px rgba(33,150,243,0.3)' : 'none',
            }}
          >
            <Text style={{ fontSize: '16px' }}>{t.icon}</Text>
            <Text>{t.label}</Text>
          </View>
        ))}
      </View>

      {/* Canvas */}
      <View style={{ marginBottom: '12px' }}>
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

      {/* 统计 */}
      <View style={{
        fontSize: '13px',
        color: '#888',
        marginBottom: '10px',
      }}>
        节点: {nodeCount} · 边: {edgeCount}
      </View>

      {/* 操作按钮 */}
      <View style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '10px',
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        <View onClick={canUndo ? handleUndo : undefined} style={{
          padding: '10px 18px', borderRadius: '10px', fontSize: '14px',
          backgroundColor: canUndo ? '#fff' : '#f5f5f5',
          color: canUndo ? '#2196F3' : '#bbb',
          border: `2px solid ${canUndo ? '#2196F3' : '#eee'}`,
          cursor: canUndo ? 'pointer' : 'not-allowed',
        }}>
          ↩ 撤销
        </View>
        <View onClick={canRedo ? handleRedo : undefined} style={{
          padding: '10px 18px', borderRadius: '10px', fontSize: '14px',
          backgroundColor: canRedo ? '#fff' : '#f5f5f5',
          color: canRedo ? '#2196F3' : '#bbb',
          border: `2px solid ${canRedo ? '#2196F3' : '#eee'}`,
          cursor: canRedo ? 'pointer' : 'not-allowed',
        }}>
          ↪ 重做
        </View>
        <View onClick={handleClear} style={{
          padding: '10px 18px', borderRadius: '10px', fontSize: '14px',
          backgroundColor: '#fff', color: '#666', border: '2px solid #ddd', cursor: 'pointer',
        }}>
          清空
        </View>
        <View onClick={handleSave} style={{
          padding: '10px 18px', borderRadius: '10px', fontSize: '14px',
          backgroundColor: '#4CAF50', color: '#fff', border: '2px solid #388E3C', cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(76,175,80,0.3)',
        }}>
          保存
        </View>
        <View onClick={handleExport} style={{
          padding: '10px 18px', borderRadius: '10px', fontSize: '14px',
          backgroundColor: '#fff', color: '#FF9800', border: '2px solid #FF9800', cursor: 'pointer',
        }}>
          导出JSON
        </View>
        <View onClick={() => setShowJSON(!showJSON)} style={{
          padding: '10px 18px', borderRadius: '10px', fontSize: '14px',
          backgroundColor: '#fff', color: '#9C27B0', border: '2px solid #9C27B0', cursor: 'pointer',
        }}>
          {showJSON ? '隐藏' : '查看'} JSON
        </View>
      </View>

      {/* 消息提示 */}
      {saveMessage && (
        <View style={{
          fontSize: '13px',
          color: '#4CAF50',
          marginBottom: '8px',
          padding: '6px 14px',
          backgroundColor: 'rgba(76,175,80,0.1)',
          borderRadius: '8px',
        }}>
          {saveMessage}
        </View>
      )}

      {/* JSON 预览 */}
      {showJSON && (
        <View style={{
          width: '100%',
          maxWidth: '500px',
          padding: '12px',
          backgroundColor: '#fff',
          borderRadius: '8px',
          fontSize: '11px',
          fontFamily: 'monospace',
          color: '#555',
          maxHeight: '200px',
          overflow: 'auto',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          border: '1px solid #e0e0e0',
        }}>
          {JSON.stringify(
            { name: boardName, adj: state.adj, p: state.positions, cat: null },
            null,
            2,
          )}
        </View>
      )}

      {/* 已保存棋盘 */}
      {savedNames.length > 0 && (
        <View style={{
          width: '100%',
          maxWidth: '400px',
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#fff',
          borderRadius: '10px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <Text style={{ fontSize: '13px', fontWeight: '600', color: '#555', marginBottom: '8px' }}>
            已保存的棋盘
          </Text>
          <View style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {savedNames.map((name) => (
              <View
                key={name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#f5f5f5',
                }}
              >
                <Text style={{ fontSize: '13px', color: '#333', flex: 1 }}>
                  {name}
                </Text>
                <View style={{ display: 'flex', gap: '8px' }}>
                  <View
                    onClick={() => handleLoad(name)}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      backgroundColor: '#2196F3',
                      color: '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    加载
                  </View>
                  <View
                    onClick={() => handleDeleteBoard(name)}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      backgroundColor: '#fff',
                      color: '#e53935',
                      border: '1px solid #e53935',
                      cursor: 'pointer',
                    }}
                  >
                    删除
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 返回按钮 */}
      <View
        onClick={() => Taro.navigateBack()}
        style={{
          marginTop: '16px',
          padding: '10px 24px',
          borderRadius: '10px',
          fontSize: '14px',
          backgroundColor: '#eee',
          color: '#555',
          cursor: 'pointer',
        }}
      >
        ← 返回对弈
      </View>
    </View>
  );
}
