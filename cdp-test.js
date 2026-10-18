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

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const pages = await getPages();
  const page = pages.find(p => p.url.includes('localhost'));
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(resolve => ws.on('open', resolve));

  await cdpSend(ws, 'Page.reload', { ignoreCache: true });
  await sleep(2000);

  // 检查 canvas 状态
  const info = await evaluate(ws, `(() => {
    const c = document.querySelector('canvas');
    if (!c) return { exists: false };
    const r = c.getBoundingClientRect();
    return {
      exists: true,
      x: Math.round(r.x),
      y: Math.round(r.y),
      w: Math.round(r.width),
      h: Math.round(r.height),
      visible: r.width > 0 && r.height > 0,
      parent: c.parentElement?.tagName,
    };
  })()`);

  console.log('Canvas info:', JSON.stringify(info));

  // 尝试用 CDP Input 点击
  if (info.exists && info.visible) {
    const scale = info.w / 1000;
    const x = info.x + 250 * scale;
    const y = info.y + 250 * scale;

    console.log(`Clicking at (${Math.round(x)}, ${Math.round(y)})`);

    await cdpSend(ws, 'Input.dispatchMouseEvent', { type: 'mousePressed', x: Math.round(x), y: Math.round(y), button: 'left', clickCount: 1 });
    await sleep(50);
    await cdpSend(ws, 'Input.dispatchMouseEvent', { type: 'mouseReleased', x: Math.round(x), y: Math.round(y), button: 'left', clickCount: 1 });
    await sleep(500);

    const after = await evaluate(ws, `Array.from(document.querySelectorAll('span')).map(s => s.textContent).filter(t => t.includes('落子'))[0] || 'not found'`);
    console.log('After click:', after);
  }

  ws.close();
}

main().catch(console.error);
