const WebSocket = require('ws');
const http = require('http');

async function getPages() {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:9222/json', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function cdpSend(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 100000);
    const handler = (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.id === id) {
        ws.removeListener('message', handler);
        resolve(msg.result);
      }
    };
    ws.on('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
    setTimeout(() => reject(new Error('timeout')), 10000);
  });
}

async function evaluate(ws, expression) {
  const result = await cdpSend(ws, 'Runtime.evaluate', { expression, returnByValue: true });
  return result.result.value;
}

async function main() {
  const pages = await getPages();
  const page = pages.find(p => p.url.includes('localhost'));
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(resolve => ws.on('open', resolve));

  await cdpSend(ws, 'Page.reload', { ignoreCache: true });
  await new Promise(r => setTimeout(r, 2000));

  // 检查按钮尺寸
  const btnSizes = await evaluate(ws, `(() => {
    const btns = document.querySelectorAll('.action-btn');
    return Array.from(btns).map(b => {
      const r = b.getBoundingClientRect();
      return { text: b.textContent.trim().substring(0, 6), w: Math.round(r.width), h: Math.round(r.height) };
    });
  })()`);
  console.log('按钮尺寸:', JSON.stringify(btnSizes, null, 2));

  // 检查 turn-text 尺寸
  const turnText = await evaluate(ws, `(() => {
    const el = document.querySelector('.turn-text');
    if (!el) return 'not found';
    const style = window.getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return { fontSize: style.fontSize, w: Math.round(r.width), h: Math.round(r.height) };
  })()`);
  console.log('回合文字:', JSON.stringify(turnText, null, 2));

  // 检查棋盘尺寸
  const canvasSize = await evaluate(ws, `(() => {
    const c = document.querySelector('canvas');
    const r = c.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height) };
  })()`);
  console.log('棋盘尺寸:', JSON.stringify(canvasSize, null, 2));

  // 检查屏幕宽度
  const screen = await evaluate(ws, `({ w: window.innerWidth, h: window.innerHeight })`);
  console.log('屏幕:', JSON.stringify(screen));

  ws.close();
}

main().catch(console.error);
