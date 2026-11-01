/**
 * Playwright 冒烟测试（H5）
 * 运行: npm run test:e2e        (headless)
 *       npm run test:e2e:headed (有头)
 */
import { test, expect, Page } from '@playwright/test';

const GAME_URL = '/#/pages/index/index';
const EDITOR_URL = '/#/pages/editor/index';

/** 收集页面错误（过滤 dev server 下已知无害的告警） */
function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const t = msg.text();
    if (t.includes('unsupported MIME type') || t.includes('preventDefault inside passive')) return;
    errors.push(t);
  });
  return errors;
}

/** 在棋盘坐标系（0..1000）的 (x, y) 处点一下 */
async function tapBoard(page: Page, x: number, y: number) {
  const box = await page.locator('canvas').boundingBox();
  if (!box) throw new Error('Canvas not found');
  const scale = Math.min(box.width, box.height) / 1000;
  await page.mouse.move(box.x + x * scale, box.y + y * scale);
  await page.mouse.down();
  await page.mouse.up();
}

const turn = (page: Page) => page.locator('.turn-text');

test.describe('Goraph 冒烟测试', () => {
  test('对弈页加载无错误，基本元素齐全', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(GAME_URL);
    await expect(page.locator('canvas')).toBeVisible();
    for (const label of ['悔棋', '虚手', '重来', '设置']) {
      await expect(page.getByText(label, { exact: true })).toBeVisible();
    }
    await expect(turn(page)).toHaveText('黑');
    expect(errors).toEqual([]);
  });

  test('落子后轮到白，悔棋后回到黑', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(GAME_URL);
    await expect(page.locator('canvas')).toBeVisible();
    // 默认棋盘「囧」，节点 0 位于 (200, 200)
    await tapBoard(page, 200, 200);
    await expect(turn(page)).toHaveText('白');
    await page.getByText('悔棋', { exact: true }).click();
    await expect(turn(page)).toHaveText('黑');
    expect(errors).toEqual([]);
  });

  test('双方连续虚手 → 终局弹窗', async ({ page }) => {
    await page.goto(GAME_URL);
    await page.getByText('虚手', { exact: true }).click();
    await expect(turn(page)).toHaveText('白');
    await page.getByText('虚手', { exact: true }).click();
    await expect(page.getByText('对局结束', { exact: true })).toBeVisible();
    await expect(page.getByText('和棋', { exact: true })).toBeVisible();
    await expect(page.getByText(/数子法/)).toBeVisible();
  });

  test('设置面板切换棋盘', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(GAME_URL);
    await page.getByText('设置', { exact: true }).click();
    await expect(page.locator('.settings-panel')).toBeVisible();
    await page.locator('.board-chip', { hasText: '9×9' }).click();
    await expect(page.locator('.board-chip.active')).toHaveText('9×9');
    expect(errors).toEqual([]);
  });

  test('AI 对手自动应手，悔棋一次退回玩家回合', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(GAME_URL);
    await page.getByText('设置', { exact: true }).click();
    await page.locator('.toggle-row', { hasText: 'AI 对手' }).locator('.toggle').click();
    await page.locator('.settings-close').click();
    await tapBoard(page, 200, 200);
    await expect(turn(page)).toHaveText('白');
    await expect(turn(page)).toHaveText('黑', { timeout: 5000 });
    await page.getByText('悔棋', { exact: true }).click();
    await expect(turn(page)).toHaveText('黑');
    // 玩家那一手也被撤销：同一点可以再下
    await tapBoard(page, 200, 200);
    await expect(turn(page)).toHaveText('白');
    expect(errors).toEqual([]);
  });

  test('编辑器页面', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(EDITOR_URL);
    await expect(page.locator('.editor-title')).toHaveText('棋盘编辑器');
    await expect(page.getByText('保存', { exact: true })).toBeVisible();
    await expect(page.getByText(/节点: 0 · 边: 0/)).toBeVisible();
    expect(errors).toEqual([]);
  });
});
