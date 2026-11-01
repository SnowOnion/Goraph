---
name: goraph-dev
description: Goraph（任意图上的围棋，Taro 3.6 + React 18 + TS）的开发/测试要点。改 Goraph 代码、跑测试、调试 H5 棋盘交互前先读。
---

# Goraph 开发要点

完整背景见 `docs/HANDOVER.md`，这里只列最常用的命令和最容易踩的坑。

## 命令

```bash
npm ci
npm run typecheck     # tsc --noEmit，CI 必过（babel 构建会剥类型，类型错不会让构建失败）
npm test              # Vitest：src/core/__tests__
npm run test:e2e      # Playwright 冒烟：自动起 `taro build --type h5 --watch`（:10086）
npm run build:h5      # 产物 dist/；部署还需 cp -r public/* dist/（scripts/deploy.sh 已包含）
```

首次跑 e2e 需 `npx playwright install --with-deps chromium`。

## 架构约定

- `src/core/` 是纯 TS，不得依赖 DOM / Taro / React；规则改动先在这里写单测。
- 棋盘坐标系固定 0..1000，渲染时按 `min(canvasW, canvasH) / 1000` 缩放。
- 状态在 `useGame` 的 reducer 里，每步都 clone 后再交给 `validWrtRuleAndUpdate`（它原地修改）。

## 坑

- 文字一律用 `src/components/Text.tsx`，不要从 `@tarojs/components` 导入 `Text`（React 18 H5 下崩）；`<View>` 里不能放裸文本。
- Canvas 事件必须原生 `addEventListener`（见 `BoardCanvas.tsx` 的 callback ref），Taro 合成事件不可靠。
- H5 关了 pxtransform：1px = 真实 1px。
- 自动化测试点棋盘：用 `page.mouse.move/down/up` 在 canvas 上按棋盘坐标 × 缩放点击；`dispatchEvent` 合成事件不会触发 Taro 的事件。
- 默认棋盘是「囧」（`DEFAULT_BOARD_INDEX = 2`），节点 0 在 (200, 200)。
