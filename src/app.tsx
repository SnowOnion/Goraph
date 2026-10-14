import { Component, PropsWithChildren } from 'react';
import Taro from '@tarojs/taro';
import './app.scss';

class App extends Component<PropsWithChildren> {
  componentDidMount() {
    if (process.env.TARO_ENV === 'weapp') {
      Taro.cloud = undefined;
    }
    // 注册 Service Worker (仅 H5)
    if (process.env.TARO_ENV === 'h5' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .catch((err) => console.warn('SW registration failed:', err));
      });
    }
  }

  render() {
    return this.props.children;
  }
}

export default App;
