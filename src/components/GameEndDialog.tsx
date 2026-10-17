import { View } from '@tarojs/components';
import { Text } from './Text';

interface GameEndDialogProps {
  ended: boolean;
  blackScore: number;
  whiteScore: number;
  onRestart: () => void;
  onContinue: () => void;
}

export function GameEndDialog({ ended, blackScore, whiteScore, onRestart, onContinue }: GameEndDialogProps) {
  if (!ended) return null;

  const diff = blackScore - whiteScore;
  const winner = diff > 0 ? '黑棋' : diff < 0 ? '白棋' : '和棋';

  return (
    <View style={{
      position: 'fixed', inset: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 200,
    }}>
      <View style={{
        backgroundColor: '#16213e',
        borderRadius: 20,
        padding: 28,
        minWidth: 280,
        maxWidth: '85vw',
        textAlign: 'center',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}>
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#e0e0e0', marginBottom: 16 }}>
          对局结束
        </Text>

        <View style={{ display: 'flex', justifyContent: 'center', gap: 28, marginBottom: 16 }}>
          <View style={{ textAlign: 'center' }}>
            <View style={{ width: 36, height: 36, borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #555, #111)', margin: '0 auto 6px', border: '2px solid #444' }} />
            <Text style={{ fontSize: 13, color: '#888' }}>黑棋</Text>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#e0e0e0' }}>{blackScore}</Text>
          </View>
          <Text style={{ fontSize: 24, color: '#555', alignSelf: 'center' }}>:</Text>
          <View style={{ textAlign: 'center' }}>
            <View style={{ width: 36, height: 36, borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #fff, #ccc)', margin: '0 auto 6px', border: '2px solid #aaa' }} />
            <Text style={{ fontSize: 13, color: '#888' }}>白棋</Text>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#e0e0e0' }}>{whiteScore}</Text>
          </View>
        </View>

        <Text style={{ fontSize: 18, fontWeight: '600', color: '#e94560', marginBottom: 20 }}>
          {winner === '和棋' ? '和棋' : `${winner} 胜 ${Math.abs(diff)} 目`}
        </Text>

        <View style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <View onClick={onRestart} style={{
            padding: '12px 24px', borderRadius: 12,
            backgroundColor: '#e94560', color: '#fff',
            cursor: 'pointer', fontSize: 15, fontWeight: 500,
          }}>
            <Text>再来一局</Text>
          </View>
          <View onClick={onContinue} style={{
            padding: '12px 24px', borderRadius: 12,
            backgroundColor: '#0f3460', color: '#ccc',
            cursor: 'pointer', fontSize: 15,
          }}>
            <Text>查看棋盘</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
