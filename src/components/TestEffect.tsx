import { useEffect, useState } from 'react';
import { View } from '@tarojs/components';

export function TestEffect() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const marker = document.createElement('div');
    marker.id = 'test-effect-marker';
    marker.textContent = 'effect-ran-' + count;
    document.body.appendChild(marker);
  }, [count]);

  return (
    <View>
      <span>Count: {count}</span>
      <button onClick={() => setCount(c => c + 1)}>+</button>
    </View>
  );
}
