const WebSocket = require('ws');
const http = require('http');

async function getWebSocketUrl() {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:9222/json', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const pages = JSON.parse(data);
        const page = pages.find(p => p.url.includes('localhost:10086'));
        if (page) resolve(page.webSocketDebuggerUrl);
        else reject('Page not found');
      });
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
    setTimeout(() => reject('timeout'), 5000);
  });
}

async function main() {
  const wsUrl = await getWebSocketUrl();
  const ws = new WebSocket(wsUrl);
  await new Promise(resolve => ws.on('open', resolve));

  // 模拟真实鼠标点击
  const pos = await cdpSend(ws, 'Runtime.evaluate', {
    expression: `(() => { const c = document.querySelector('canvas'); const r = c.getBoundingClientRect(); return { x: r.x + r.width * 0.25, y: r.y + r.height * 0.25 }; })()`,
    returnByValue: true,
  });

  const { x, y } = pos.result.value;

  await cdpSend(ws, 'Input.dispatchMouseEvent', { type: 'mousePressed', x: Math.round(x), y: Math.round(y), button: 'left', clickCount: 1 });
  await new Promise(r => setTimeout(r, 50));
  await cdpSend(ws, 'Input.dispatchMouseEvent', { type: 'mouseReleased', x: Math.round(x), y: Math.round(y), button: 'left', clickCount: 1 });

  await new Promise(r => setTimeout(r, 500));

  const after = await cdpSend(ws, 'Runtime.evaluate', {
    expression: `Array.from(document.querySelectorAll('span')).map(s => s.textContent).filter(t => t.includes('下一手')).join(', ')`,
    returnByValue: true,
  });

  console.log('Next player:', after.result.value);

  ws.close();
}

main().catch(console.error);
