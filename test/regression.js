#!/usr/bin/env node
/**
 * Goraph 自动化回归测试
 * 通过 CDP 连接浏览器验证核心功能
 * 
 * 运行: node regression-test.js
 * 前提: Chrome 已开启远程调试端口 9222，且 Goraph 页面已打开
 */

const WebSocket = require('ws');
const http = require('http');

const BASE_URL = 'http://localhost:10086';
const PAGE_URL = `${BASE_URL}/index.html#/pages/index/index`;

// CDP 工具函数
async function getPages() {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:9222/json', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function connectCDP(pageIndex = 0) {
  const pages = await getPages();
  const page = pages.find(p => p.url.includes('localhost'));
  if (!page) throw new Error('Page not found. Is the dev server running?');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(resolve => ws.on('open', resolve));
  return ws;
}

let msgId = 1;
function cdpSend(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = msgId++;
    const handler = (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.id === id) {
        ws.removeListener('message', handler);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    };
    ws.on('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
    setTimeout(() => reject(new Error(`CDP timeout: ${method}`)), 10000);
  });
}

async function evaluate(ws, expression) {
  const result = await cdpSend(ws, 'Runtime.evaluate', { expression, returnByValue: true });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text + ': ' + result.exceptionDetails.exception?.description);
  }
  return result.result.value;
}

async function click(ws, selector) {
  return await evaluate(ws, `(() => {
    const el = document.querySelector('${selector}');
    if (!el) return 'not found';
    el.click();
    return 'clicked';
  })()`);
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// 测试结果
const results = [];
function test(name, passed, detail = '') {
  results.push({ name, passed, detail });
  console.log(`${passed ? '✅' : '❌'} ${name}${detail ? ' — ' + detail : ''}`);
}

// 主测试流程
async function main() {
  console.log('🧪 Goraph 回归测试\n');

  const ws = await awaitCDP();
  await cdpSend(ws, 'Runtime.enable', {});

  // === 1. 基础渲染 ===
  console.log('\n--- 基础渲染 ---');

  const hasCanvas = await evaluate(ws, "!!document.querySelector('canvas')");
  test('Canvas 渲染', hasCanvas);

  const hasTitle = await evaluate(ws, "document.title === '图上的围棋'");
  test('页面标题正确', hasTitle);

  const nextPlayer = await evaluate(ws, `Array.from(document.querySelectorAll('span')).map(s => s.textContent).filter(t => t.includes('黑') || t.includes('白'))[0] || 'not found'`);
  test('回合指示显示', nextPlayer.includes('黑') || nextPlayer.includes('白'), nextPlayer);

  const buttons = await evaluate(ws, `Array.from(document.querySelectorAll('.action-btn')).map(b => b.textContent.trim().substring(0, 10))`);
  test('操作栏按钮可见', buttons.length >= 4 && buttons.some(b => b.includes('虚手')), JSON.stringify(buttons));

  // === 2. 落子交互 ===
  console.log('\n--- 落子交互 ---');
  // 注意：Canvas 落子通过 CDP 事件不可靠，这里验证 canvas 存在即可
  const canvasExists = await evaluate(ws, `(() => {
    const c = document.querySelector('canvas');
    return c && c.width > 0 && c.height > 0;
  })()`);
  test('Canvas 尺寸正确', canvasExists);

  // === 3. 虚手 ===
  console.log('\n--- 虚手 PASS ---');

  // 先切换到福棋盘并重置
  await click(ws, '.action-btn:last-child'); // 打开设置
  await sleep(400);
  await evaluate(ws, `(() => {
    const chips = document.querySelectorAll('.board-chip');
    if (chips[0]) chips[0].click();
    return 'switched';
  })()`);
  await sleep(400);
  // 关闭设置面板（点击遮罩或按钮）
  await evaluate(ws, `(() => {
    const overlay = document.querySelector('.settings-overlay');
    if (overlay) overlay.click();
    return 'closed';
  })()`);
  await sleep(400);

  // 点击重来确保游戏重置
  await evaluate(ws, `(() => {
    const btns = document.querySelectorAll('.action-btn');
    for (const b of btns) {
      if (b.textContent.includes('重来')) { b.click(); return 'restarted'; }
    }
    return 'not found';
  })()`);
  await sleep(400);

  await click(ws, '.action-btn.primary');
  await sleep(300);
  const afterPass1 = await evaluate(ws, `Array.from(document.querySelectorAll('span')).map(s => s.textContent).filter(t => t.includes('黑') || t.includes('白') || t.includes('放弃')).join(', ')`);
  test('第一次虚手', afterPass1.includes('白') || afterPass1.includes('放弃'), afterPass1);

  await click(ws, '.action-btn.primary');
  await sleep(300);
  const afterPass2 = await evaluate(ws, `document.body.innerText.includes('对局结束')`);
  test('双虚手终局', afterPass2);

  // === 4. 重启 ===
  console.log('\n--- 重启游戏 ---');

  // 点击终局弹窗的「再来一局」
  const restarted = await evaluate(ws, `(() => {
    const spans = document.querySelectorAll('span');
    for (const s of spans) {
      if (s.textContent.trim() === '再来一局') {
        s.click();
        return 'clicked';
      }
    }
    return 'not found';
  })()`);

  await sleep(500);
  const afterRestart = await evaluate(ws, `Array.from(document.querySelectorAll('span')).map(s => s.textContent).filter(t => t.includes('黑') || t.includes('白'))[0] || 'not found'`);
  test('重启后状态重置', afterRestart.includes('黑'), afterRestart);

  const passBtnEnabled = await evaluate(ws, `(() => {
    const btns = document.querySelectorAll('.action-btn');
    for (const b of btns) {
      if (b.textContent.includes('虚手')) return !b.classList.contains('disabled');
    }
    return false;
  })()`);
  test('重启后虚手可用', passBtnEnabled);

  // === 5. 棋盘切换 ===
  console.log('\n--- 棋盘切换 ---');

  // 打开设置面板
  await evaluate(ws, `(() => {
    const btns = document.querySelectorAll('.action-btn');
    for (const b of btns) {
      if (b.textContent.includes('设置')) { b.click(); return 'opened'; }
    }
    return 'not found';
  })()`);
  await sleep(500);
  // 切换到 2×2
  await evaluate(ws, `(() => {
    const chips = document.querySelectorAll('.board-chip');
    for (const ch of chips) {
      if (ch.textContent.includes('2×2')) { ch.click(); return 'switched'; }
    }
    return 'not found';
  })()`);
  await sleep(500);
  // 关闭设置
  await evaluate(ws, `(() => {
    const overlay = document.querySelector('.settings-overlay');
    if (overlay) overlay.click();
    return 'closed';
  })()`);
  await sleep(300);
  const boardSwitched = await evaluate(ws, `document.body.innerText.includes('2×2')`);
  test('棋盘切换', boardSwitched);

  // === 6. 设置面板 ===
  console.log('\n--- 设置面板 ---');

  // 先关闭可能已打开的设置面板
  await evaluate(ws, `(() => {
    const overlay = document.querySelector('.settings-overlay');
    if (overlay) {
      // 点击遮罩关闭
      overlay.click();
      return 'closed';
    }
    return 'no panel';
  })()`);
  await sleep(300);

  // 点击设置按钮打开面板
  const settingsClicked = await evaluate(ws, `(() => {
    const btns = document.querySelectorAll('.action-btn');
    for (const b of btns) {
      if (b.textContent.includes('设置')) {
        b.click();
        return 'clicked';
      }
    }
    return 'not found';
  })()`);
  await sleep(500);
  const settingsOpen = await evaluate(ws, `!!document.querySelector('.settings-panel')`);
  test('设置面板打开', settingsOpen, `click: ${settingsClicked}`);

  // === 总结 ===
  console.log('\n--- 测试结果 ---');
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  console.log(`\n${passed}/${total} 通过`);

  if (passed < total) {
    console.log('\n失败的测试:');
    results.filter(r => !r.passed).forEach(r => console.log(`  ❌ ${r.name}: ${r.detail}`));
  }

  process.exit(passed === total ? 0 : 1);
}

async function awaitCDP() {
  for (let i = 0; i < 5; i++) {
    try {
      return await connectCDP();
    } catch (e) {
      if (i < 4) await sleep(1000);
      else throw e;
    }
  }
}

main().catch(err => {
  console.error('测试运行失败:', err.message);
  process.exit(1);
});
