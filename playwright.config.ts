import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: 'smoke.spec.ts',
  timeout: 60000,
  use: {
    baseURL: 'http://localhost:10086',
    headless: true,   // headless 模式，后台运行（快，不闪眼）
    screenshot: 'on',
    video: 'retain-on-failure',
  },
  reporter: [['list']],
  // 自动启动 Taro dev server
  webServer: {
    command: 'npx taro build --type h5 --watch',
    url: 'http://localhost:10086',
    reuseExistingServer: true,
    timeout: 60000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
