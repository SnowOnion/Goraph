/**
 * Playwright 冒烟测试
 * 运行: npx playwright test --headed
 * headed 模式下你能看到浏览器窗口弹出，所有操作可视化
 */
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:10086/#/pages/index/index';

test.describe('Goraph 冒烟测试', () => {
  test('页面加载无控制台错误', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(BASE_URL);
    await page.waitForTimeout(1000);

    // 截图：初始状态
    await page.screenshot({ path: 'test-results/01-initial.png', fullPage: true });

    // 过滤掉 dev server 已知的无害警告
    const realErrors = errors.filter(e => 
      !e.includes('unsupported MIME type') &&  // sw.js dev server 问题
      !e.includes('preventDefault inside passive')  // passive event listener
    );
    expect(realErrors, `控制台错误: ${realErrors.join('\n')}`).toHaveLength(0);
  });

  test('棋盘渲染和基本元素', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(500);

    // 标题（只在页面内容区查找，排除导航栏）
    await expect(page.locator('#app').getByText('图上的围棋', { exact: true })).toBeVisible();

    // 棋盘选择器
    await expect(page.getByText('福')).toBeVisible();
    await expect(page.getByText('囧')).toBeVisible();

    // 操作按钮
    await expect(page.getByText('悔棋')).toBeVisible();
    await expect(page.getByText('重新开始')).toBeVisible();
    await expect(page.getByText('放弃一手')).toBeVisible();

    // 手数显示
    await expect(page.getByText('显示手数序号')).toBeVisible();

    await page.screenshot({ path: 'test-results/02-elements.png', fullPage: true });
  });

  test('切换棋盘', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(BASE_URL);
    await page.waitForTimeout(500);

    // 切换到囧棋盘
    await page.getByText('囧').click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/03-board-jiong.png', fullPage: true });

    expect(errors).toHaveLength(0);
  });

  test('拖动落子交互', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(BASE_URL);
    await page.waitForTimeout(500);

    // 切换到囧棋盘
    await page.getByText('囧').click();
    await page.waitForTimeout(300);

    // 获取 canvas 位置
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    const scale = box.width / 1000;

    // 在 (250, 250) 按下，拖动到 (500, 250)，松开
    const startX = box.x + 250 * scale;
    const startY = box.y + 250 * scale;
    const endX = box.x + 500 * scale;
    const endY = box.y + 500 * scale;

    // 按下
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.waitForTimeout(100);

    // 拖动（分步）
    for (let i = 1; i <= 4; i++) {
      const x = startX + (endX - startX) * (i / 4);
      const y = startY + (endY - startY) * (i / 4);
      await page.mouse.move(x, y);
      await page.waitForTimeout(50);
    }

    await page.waitForTimeout(100);
    await page.screenshot({ path: 'test-results/04-during-drag.png', fullPage: true });

    // 松开
    await page.mouse.up();
    await page.waitForTimeout(300);

    await page.screenshot({ path: 'test-results/05-after-place.png', fullPage: true });

    expect(errors).toHaveLength(0);
  });

  test('悔棋功能', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(BASE_URL);
    await page.waitForTimeout(500);

    // 落一子
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');
    const scale = box.width / 1000;

    await page.mouse.move(box.x + 500 * scale, box.y + 250 * scale);
    await page.mouse.down();
    await page.mouse.move(box.x + 600 * scale, box.y + 350 * scale);
    await page.mouse.up();
    await page.waitForTimeout(300);

    // 点击悔棋
    await page.getByText('悔棋').click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'test-results/06-after-undo.png', fullPage: true });

    expect(errors).toHaveLength(0);
  });

  test('编辑器页面', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('http://localhost:10086/#/pages/editor/index');
    await page.waitForTimeout(1000);

    await expect(page.locator('#app').getByText('棋盘编辑器', { exact: true })).toBeVisible();
    await expect(page.getByText('⊕')).toBeVisible();
    await expect(page.getByText('╱')).toBeVisible();
    await expect(page.getByText('保存')).toBeVisible();

    await page.screenshot({ path: 'test-results/07-editor.png', fullPage: true });

    expect(errors).toHaveLength(0);
  });
});
