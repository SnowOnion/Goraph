import { View, Text } from '@tarojs/components';

interface GameEndDialogProps {
  ended: boolean;
  isNextBlack: boolean;
  blackScore: number;
  whiteScore: number;
  onRestart: () => void;
  onContinue: () => void;
}

/**
 * 终局对话框
 * 显示最终得分和胜负
 */
export function GameEndDialog({
  ended,
  blackScore,
  whiteScore,
  onRestart,
  onContinue,
}: GameEndDialogProps) {
  if (!ended) return null;

  const diff = blackScore - whiteScore;
  const winner = diff > 0 ? '黑棋' : diff < 0 ? '白棋' : '和棋';
  const winnerColor = diff > 0 ? '#1a1a1a' : diff < 0 ? '#666' : '#888';

  return (
    <View style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 100,
    }}>
      <View style={{
        backgroundColor: '#fff',
        borderRadius: '16px',
        padding: '24px',
        minWidth: '280px',
        maxWidth: '90vw',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        textAlign: 'center',
      }}>
        {/* 标题 */}
        <View style={{
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#333',
          marginBottom: '16px',
        }}>
          对局结束
        </View>

        {/* 比分 */}
        <View style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '24px',
          marginBottom: '16px',
        }}>
          <View style={{ textAlign: 'center' }}>
            <View style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: '#1a1a1a',
              margin: '0 auto 6px',
            }} />
            <View style={{ fontSize: '14px', color: '#666' }}>黑棋</View>
            <View style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a1a1a' }}>
              {blackScore}
            </View>
          </View>
          <View style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#ccc',
            alignSelf: 'center',
          }}>
            :
          </View>
          <View style={{ textAlign: 'center' }}>
            <View style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: '#f0f0f0',
              border: '2px solid #aaa',
              margin: '0 auto 6px',
            }} />
            <View style={{ fontSize: '14px', color: '#666' }}>白棋</View>
            <View style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
              {whiteScore}
            </View>
          </View>
        </View>

        {/* 胜负 */}
        <View style={{
          fontSize: '18px',
          fontWeight: 'bold',
          color: winnerColor,
          marginBottom: '20px',
        }}>
          {winner === '和棋' ? '和棋' : `${winner} 胜 ${Math.abs(diff)} 目`}
        </View>

        {/* 按钮 */}
        <View style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <View
            onClick={onRestart}
            style={{
              padding: '10px 24px',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: '500',
              backgroundColor: '#4CAF50',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            再来一局
          </View>
          <View
            onClick={onContinue}
            style={{
              padding: '10px 24px',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: '500',
              backgroundColor: '#eee',
              color: '#555',
              cursor: 'pointer',
            }}
          >
            查看棋盘
          </View>
        </View>
      </View>
    </View>
  );
}
