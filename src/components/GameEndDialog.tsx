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
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 200,
      pointerEvents: 'none',
    }}>
      <View style={{
        backgroundColor: '#14142e',
        borderRadius: 28,
        padding: 36,
        minWidth: 320,
        maxWidth: '85vw',
        textAlign: 'center',
        boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
        pointerEvents: 'auto',
      }}>
        <Text style={{ fontSize: 30, fontWeight: '800', color: '#fff', marginBottom: 22 }}>
          对局结束
        </Text>

        <View style={{ display: 'flex', justifyContent: 'center', gap: 36, marginBottom: 20 }}>
          <View style={{ textAlign: 'center' }}>
            <View style={{
              width: 50, height: 50, borderRadius: '50%',
              background: 'radial-gradient(circle at 30% 30%, #666, #111)',
              margin: '0 auto 8px',
              border: '2px solid #444',
            }} />
            <Text style={{ fontSize: 16, color: '#999' }}>黑</Text>
            <Text style={{ fontSize: 42, fontWeight: '800', color: '#fff' }}>{blackScore}</Text>
          </View>
          <Text style={{ fontSize: 28, color: '#555', alignSelf: 'center' }}>:</Text>
          <View style={{ textAlign: 'center' }}>
            <View style={{
              width: 50, height: 50, borderRadius: '50%',
              background: 'radial-gradient(circle at 30% 30%, #fff, #ccc)',
              margin: '0 auto 8px',
              border: '2px solid #aaa',
            }} />
            <Text style={{ fontSize: 16, color: '#999' }}>白</Text>
            <Text style={{ fontSize: 42, fontWeight: '800', color: '#fff' }}>{whiteScore}</Text>
          </View>
        </View>

        <Text style={{ fontSize: 24, fontWeight: '700', color: '#ff6b6b', marginBottom: 26 }}>
          {winner === '和棋' ? '和棋' : `${winner} 胜 ${Math.abs(diff)} 目`}
        </Text>

        <View style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <View
            onClick={onRestart}
            onTouchEnd={(e: any) => { e.preventDefault(); onRestart(); }}
            style={{
              padding: '18px 36px', borderRadius: 18,
              background: 'linear-gradient(135deg, #ff6b6b 0%, #c0392b 100%)',
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(255, 107, 107, 0.4)',
              minWidth: 130,
              touchAction: 'manipulation',
            }}
          >
            <Text style={{ fontSize: 20, color: '#fff', fontWeight: '700' }}>再来一局</Text>
          </View>
          <View
            onClick={() => setDismissed(true)}
            style={{
              padding: '18px 36px', borderRadius: 18,
              backgroundColor: 'rgba(255,255,255,0.1)',
              cursor: 'pointer',
              minWidth: 130,
            }}
          >
            <Text style={{ fontSize: 20, color: '#ccc' }}>查看棋盘</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
