import { useState, useEffect } from 'react';
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
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => { if (!ended) setDismissed(false); }, [ended]);
  if (!ended || dismissed) return null;

  const diff = blackScore - whiteScore;
  const winner = diff > 0 ? '黑棋' : diff < 0 ? '白棋' : '和棋';

  return (
    <View style={{
      position: 'fixed', inset: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 200,
      pointerEvents: 'none',
    }}>
      <View style={{
        backgroundColor: '#16213e',
        borderRadius: 24,
        padding: 32,
        minWidth: 300,
        maxWidth: '85vw',
        textAlign: 'center',
        boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
        pointerEvents: 'auto',
      }}>
        {/* 关闭按钮 */}
        <View style={{
          position: 'absolute',
          top: 12,
          right: 12,
          width: 36,
          height: 36,
          borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }} onClick={() => setDismissed(true)}>
          <Text style={{ fontSize: 18, color: '#888' }}>✕</Text>
        </View>

        <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 20 }}>
          对局结束
        </Text>

        {/* 比分 */}
        <View style={{ display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 20 }}>
          <View style={{ textAlign: 'center' }}>
            <View style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 35%, #666, #111)',
              margin: '0 auto 8px',
              border: '2px solid #444',
            }} />
            <Text style={{ fontSize: 15, color: '#888' }}>黑</Text>
            <Text style={{ fontSize: 36, fontWeight: 'bold', color: '#fff' }}>{blackScore}</Text>
          </View>
          <Text style={{ fontSize: 28, color: '#555', alignSelf: 'center' }}>:</Text>
          <View style={{ textAlign: 'center' }}>
            <View style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 35%, #fff, #ccc)',
              margin: '0 auto 8px',
              border: '2px solid #aaa',
            }} />
            <Text style={{ fontSize: 15, color: '#888' }}>白</Text>
            <Text style={{ fontSize: 36, fontWeight: 'bold', color: '#fff' }}>{whiteScore}</Text>
          </View>
        </View>

        {/* 结果 */}
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#e94560', marginBottom: 24 }}>
          {winner === '和棋' ? '和棋' : `${winner} 胜 ${Math.abs(diff)} 目`}
        </Text>

        {/* 按钮 */}
        <View style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
          <View
            onClick={onRestart}
            onTouchEnd={(e: any) => { e.preventDefault(); onRestart(); }}
            style={{
              padding: '16px 32px', borderRadius: 16,
              background: 'linear-gradient(135deg, #e94560 0%, #c0392b 100%)',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(233, 69, 96, 0.4)',
              minWidth: 120,
            }}
          >
            <Text style={{ fontSize: 18, color: '#fff', fontWeight: '600' }}>再来一局</Text>
          </View>
          <View
            onClick={() => setDismissed(true)}
            style={{
              padding: '16px 32px', borderRadius: 16,
              backgroundColor: 'rgba(255,255,255,0.1)',
              cursor: 'pointer',
              minWidth: 120,
            }}
          >
            <Text style={{ fontSize: 18, color: '#ccc' }}>查看棋盘</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
