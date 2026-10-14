import { View } from '@tarojs/components';
import { Text } from './Text';
import { BOARDS } from '@/core/boards';
import { Board } from '@/core/types';

interface GameControlsProps {
  boardIndex: number;
  allBoards: Board[];
  isNextBlack: boolean;
  isRectangular: boolean;
  hasFiveRule: boolean;
  ended: boolean;
  canUndo: boolean;
  moveCount: number;
  showNumbers: boolean;
  noRepeat: boolean;
  aiEnabled: boolean;
  aiThinking: boolean;
  info: string;
  onSelectBoard: (index: number) => void;
  onRestart: () => void;
  onPass: () => void;
  onToggleFiveRule: () => void;
  onToggleShowNumbers: () => void;
  onToggleNoRepeat: () => void;
  onToggleAI: () => void;
  onUndo: () => void;
}

/**
 * 游戏控制面板
 * 移动端优化：大按钮、清晰视觉层次、触摸友好
 * 支持预设棋盘 + 自定义棋盘
 */
export function GameControls({
  boardIndex,
  allBoards,
  isNextBlack,
  isRectangular,
  hasFiveRule,
  ended,
  canUndo,
  moveCount,
  showNumbers,
  noRepeat,
  aiEnabled,
  aiThinking,
  info,
  onSelectBoard,
  onRestart,
  onPass,
  onToggleFiveRule,
  onToggleShowNumbers,
  onToggleNoRepeat,
  onToggleAI,
  onUndo,
}: GameControlsProps) {
  const boardOptions = allBoards.map((b, i) => ({ label: b.name, value: i }));

  return (
    <View style={{
      width: '100%',
      maxWidth: '500px',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      padding: '0 16px',
      boxSizing: 'border-box',
    }}>
      {/* 下一手指示 */}
      <View style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        padding: '12px 20px',
        backgroundColor: '#fff',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}>
        <View style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          backgroundColor: isNextBlack ? '#222' : '#f0f0f0',
          border: `2px solid ${isNextBlack ? '#000' : '#aaa'}`,
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        }} />
        <Text style={{ fontSize: '17px', fontWeight: '600', color: '#333' }}>
          下一手：{isNextBlack ? '黑棋' : '白棋'}
        </Text>
      </View>

      {/* 棋盘选择器 */}
      <View style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        justifyContent: 'center',
      }}>
        {boardOptions.map((opt) => (
          <View
            key={opt.value}
            onClick={() => onSelectBoard(opt.value)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: boardIndex === opt.value ? '600' : '400',
              backgroundColor: boardIndex === opt.value ? '#4CAF50' : '#eee',
              color: boardIndex === opt.value ? '#fff' : '#555',
              cursor: 'pointer',
              transition: 'all 0.2s',
              border: boardIndex === opt.value ? '2px solid #388E3C' : '2px solid transparent',
            }}
          >
            <Text style={{ fontSize: '14px' }}>
              {opt.label}
              {opt.value >= BOARDS.length ? ' ✏️' : ''}
            </Text>
          </View>
        ))}
      </View>

      {/* 操作按钮 */}
      <View style={{ display: 'flex', gap: '12px' }}>
        <View
          onClick={canUndo ? onUndo : undefined}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '14px 0',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: '500',
            backgroundColor: canUndo ? '#fff' : '#f5f5f5',
            color: canUndo ? '#666' : '#bbb',
            border: `2px solid ${canUndo ? '#bbb' : '#eee'}`,
            cursor: canUndo ? 'pointer' : 'not-allowed',
          }}
        >
          <Text>↩</Text>
          <Text>悔棋</Text>
        </View>
        <View
          onClick={onRestart}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '14px 0',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: '500',
            backgroundColor: '#fff',
            color: '#333',
            border: '2px solid #ddd',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
          }}
        >
          <Text>🔄</Text>
          <Text>重新开始</Text>
        </View>
        <View
          onClick={ended ? undefined : onPass}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '14px 0',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: '500',
            backgroundColor: ended ? '#f5f5f5' : '#fff',
            color: ended ? '#aaa' : '#FF9800',
            border: `2px solid ${ended ? '#eee' : '#FF9800'}`,
            cursor: ended ? 'not-allowed' : 'pointer',
            boxShadow: ended ? 'none' : '0 2px 6px rgba(255,152,0,0.15)',
            opacity: ended ? 0.5 : 1,
          }}
        >
          <Text>⏭️</Text>
          <Text>放弃一手</Text>
        </View>
      </View>

      {/* 序号显示 */}
      <View style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        padding: '8px 0',
      }}>
        <Text style={{ fontSize: '14px', color: '#777' }}>显示手数序号</Text>
        <View
          onClick={onToggleShowNumbers}
          style={{
            width: '48px',
            height: '26px',
            borderRadius: '13px',
            backgroundColor: showNumbers ? '#4CAF50' : '#ccc',
            position: 'relative',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
        >
          <View style={{
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            backgroundColor: '#fff',
            position: 'absolute',
            top: '2px',
            left: showNumbers ? '24px' : '2px',
            transition: 'left 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }} />
        </View>
        <Text style={{ fontSize: '13px', color: '#999' }}>第 {moveCount} 手</Text>
      </View>

      {/* 五子棋开关 */}
      {isRectangular && (
        <View style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          padding: '8px 0',
        }}>
          <Text style={{ fontSize: '14px', color: '#777' }}>附加五子棋规则</Text>
          <View
            onClick={onToggleFiveRule}
            style={{
              width: '48px',
              height: '26px',
              borderRadius: '13px',
              backgroundColor: hasFiveRule ? '#4CAF50' : '#ccc',
              position: 'relative',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
          >
            <View style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              backgroundColor: '#fff',
              position: 'absolute',
              top: '2px',
              left: hasFiveRule ? '24px' : '2px',
              transition: 'left 0.2s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }} />
          </View>
        </View>
      )}

      {/* 禁止全同再现 */}
      <View style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        padding: '8px 0',
      }}>
        <Text style={{ fontSize: '14px', color: '#777' }}>禁止全同再现</Text>
        <View
          onClick={onToggleNoRepeat}
          style={{
            width: '48px',
            height: '26px',
            borderRadius: '13px',
            backgroundColor: noRepeat ? '#4CAF50' : '#ccc',
            position: 'relative',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
        >
          <View style={{
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            backgroundColor: '#fff',
            position: 'absolute',
            top: '2px',
            left: noRepeat ? '24px' : '2px',
            transition: 'left 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }} />
        </View>
      </View>

      {/* AI 开关 */}
      <View style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        padding: '8px 0',
      }}>
        <Text style={{ fontSize: '14px', color: '#777' }}>
          {aiThinking ? '🤖 AI 思考中...' : 'AI 对手'}
        </Text>
        <View
          onClick={onToggleAI}
          style={{
            width: '48px',
            height: '26px',
            borderRadius: '13px',
            backgroundColor: aiEnabled ? '#9C27B0' : '#ccc',
            position: 'relative',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
        >
          <View style={{
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            backgroundColor: '#fff',
            position: 'absolute',
            top: '2px',
            left: aiEnabled ? '24px' : '2px',
            transition: 'left 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }} />
        </View>
      </View>

      {/* 信息提示 */}
      <View style={{
        minHeight: '24px',
        textAlign: 'center',
        fontSize: '14px',
        color: info.includes('不合规则') || info.includes('禁止全同') ? '#e53935' : '#888',
        padding: '4px 0',
      }}>
        {info}
      </View>
    </View>
  );
}
