# Goraph 交接文档（供其它 AI session 使用）

> 面向接手这个项目的 AI 编码助手。先读这份，再动代码。

---

## 1. 项目是什么

**Goraph** = Game of Go on any graph（任意图上的围棋）。

- 原始版本：2018 年的纯 vanilla JS 静态页（无构建、无框架），位于 `legacy/`
- 当前版本：Taro 3.6.35 + React 18 + TypeScript，跨端（H5 / PWA / 微信小程序 / 原生 App）
- 在线地址（旧版）：https://app.sonion.xyz/goraph/
- 仓库：https://github.com/SnowOnion/Goraph

核心玩法：棋盘不再是矩形网格，而是**任意图结构**（节点 + 边）。落子、吃子、气、打劫等规则与标准围棋一致，只是"相邻"由图的邻接关系定义。

---

## 2. 技术栈与关键依赖

| 项 | 值 |
|----|----|
| 框架 | Taro 3.6.35（React 模式） |
| UI | React 18 |
| 语言 | TypeScript |
| 构建 | webpack5（`@tarojs/webpack5-runner`） |
| 渲染 | Canvas 2D |
| 测试 | Playwright（冒烟）+ `test/regression.js`（CDP 回归） |
| 包管理 | npm |

配置文件：`config/index.ts`（Taro 配置）、`project.config.json`（小程序）、`babel.config.js`、`tsconfig.json`、`playwright.config.ts`

---

## 3. 目录结构

```
Goraph/
├── src/
│   ├── core/                  ★ 框架无关的核心逻辑（最重要）
│   │   ├── types.ts             类型定义（Board/GameState/StoneString…）
│   │   ├── boards.ts            预设棋盘 + 自定义棋盘加载
│   │   ├── game-engine.ts       围棋引擎：气/棋串/提子/打劫/计分
│   │   ├── five.ts              五子棋规则
│   │   ├── editor.ts            棋盘编辑器逻辑（含 OGR 扩展点）
│   │   ├── ai.ts                简单 AI 对手
│   │   ├── storage.ts           跨平台存储封装（localStorage / Taro）
│   │   └── env.ts               环境检测（isWeapp / isH5 / isIOS）
│   ├── hooks/
│   │   ├── useGame.ts           游戏状态（useReducer，含悔棋历史栈）
│   │   └── useEditor.ts         编辑器状态（含撤销/重做历史栈）
│   ├── components/
│   │   ├── BoardCanvas.tsx      棋盘渲染（Canvas 2D）
│   │   ├── EditorCanvas.tsx     编辑器画布
│   │   ├── GameEndDialog.tsx    终局弹窗
│   │   ├── Text.tsx             ★ 自定义 Text（绕开 Taro 的坑）
│   │   └── GameControls.tsx     ⚠ 死代码，无人引用，可删
│   ├── pages/
│   │   ├── index/               对弈页（+ index.scss）
│   │   └── editor/              编辑器页（+ editor.scss）
│   ├── app.tsx / app.config.ts / app.scss
│   └── index.html              HTML 模板（viewport 等）
├── config/                    Taro 构建配置
├── public/                    PWA 资源（manifest.json / sw.js / icons/）
├── scripts/deploy.sh          一键部署脚本
├── test/                      测试（measure.js / regression.js）
├── docs/                      文档（deploy.md / regression-tests.md / …）
├── legacy/                    旧版 vanilla JS 源码（备份）
└── doc/                       更早期的调研笔记
```

---

## 4. 命令

```bash
npm install

# 开发
npm run dev:h5            # H5，默认 http://localhost:10086
npm run dev:weapp         # 微信小程序

# 构建
npm run build:h5
npm run build:weapp
./scripts/deploy.sh h5    # 构建 + 复制 PWA 资源

# 测试
npm run test              # Playwright（headless）
npm run test:headed       # Playwright（有头）
node test/measure.js      # 打印 UI 元素实际像素尺寸
```

---

## 5. ⚠ 关键坑（务必遵守）

### 5.1 Taro 的 `<Text>` 组件在 React 18 H5 下会崩
报错：`TypeError: Text constructor: 'new' is required`

**解决**：所有文字用 `src/components/Text.tsx`（内部渲染 `<span>`）。
**禁止**从 `@tarojs/components` 导入 `Text`。同理，Taro 不允许 `<View>` 内直接放裸文本，必须包 `<Text>`。

### 5.2 Canvas 事件必须用原生 `addEventListener`
Taro 的合成事件系统不会把鼠标/触摸事件可靠地转发到 canvas。

**正确做法**（见 `BoardCanvas.tsx`）：
- 用 `useCallback` 的 **callback ref** 绑定 canvas 元素
- 在 ref 回调里 `addEventListener('mousedown' | 'mousemove' | 'mouseup' | 'mouseleave' | 'touchstart' | 'touchmove' | 'touchend')`
- 重绘用 `useEffect(() => paint(), [gameState, adj, positions, ...])`

### 5.3 H5 下 `px` 会被自动转成 `vw`（缩放坑）
Taro 默认 `designWidth: 750`，会把 CSS 里的 `px` 转成 `vw`，导致 440px 屏幕上一切缩水到 58.7%。

**已修复**：`config/index.ts` 的 `h5.postcss.pxtransform.enable: false`。
→ 现在 1px = 真实 1px。改 UI 尺寸时按真实像素想。

### 5.4 PWA 资源不会被自动复制
Taro **不会**把 `public/` 复制到 `dist/`。必须执行 `cp -r public/* dist/`（`scripts/deploy.sh` 已包含）。
否则 manifest / sw.js / 图标缺失，PWA 无法离线。

### 5.5 撤销/重做会丢 Canvas 事件监听
重开一局时若 canvas DOM 被重建，旧监听器失效。
**解决**：`BoardCanvas` 用 `key={gameId}` 强制 React 重建元素，从而触发 callback ref 重新绑定。

---

## 6. 架构要点

### 6.1 核心逻辑与 UI 解耦
`src/core/` 全部是纯 TypeScript，不依赖 DOM / Taro / React，可单独测试、可在小程序/Node 复用。
- `game-engine.ts`：气数维护、棋串合并、提子、打劫检测、计分
- `boards.ts`：7 个预设棋盘（福/玫瑰/囧/2×2/4×4/9×9/13×13）+ 自定义棋盘加载
- `storage.ts`：跨平台存储（H5 用 localStorage，小程序用 Taro API）

### 6.2 状态管理
- `useGame.ts`：`useReducer` + 历史栈（悔棋）
- `useEditor.ts`：`useReducer` + 历史栈（撤销/重做）

### 6.3 交互模型（对弈页）
1. **按下**（touchstart/mousedown）→ 显示预览环（吸附最近空节点）
2. **拖动**（touchmove/mousemove）→ 预览跟随
3. **移出棋盘** → 清除预览（= 取消落子的机会）
4. **松开**（touchend/mouseup）→ 在棋盘内则落子

### 6.4 术语
- **虚手**（pass）：放弃一手。连续两次虚手 → 终局
- 旧 UI 文案「放弃一手」已废弃，统一用「虚手」

---

## 7. 当前状态

### 已完成
- ✅ 围棋核心引擎（吃子/气/棋串/打劫/计分）
- ✅ 7 个预设棋盘 + 自定义棋盘（编辑器）
- ✅ 棋盘编辑器（加点/连线/移动/删除/撤销重做/保存加载）
- ✅ 悔棋
- ✅ 棋子序号显示（可开关）
- ✅ AI 对手（简单启发式）
- ✅ 五子棋规则（可选，仅矩形棋盘）
- ✅ 移动端适配（大按钮、全屏棋盘、拖动预览、取消）
- ✅ PWA（manifest + service worker）
- ✅ 微信小程序编译通过
- ✅ 部署文档 + 部署脚本
- ✅ 回归测试框架

### 待办 / 建议
1. **删除死代码** `src/components/GameControls.tsx`（无人引用）
2. **修复回归测试**（当前 10/11 通过；`test/regression.js` 的虚手用例受 Taro 事件时序影响）
3. **小程序端 Canvas 适配**：BoardCanvas 用的是原生 canvas，小程序端需改用 Taro `<Canvas type="2d">` 并单独验证
4. **原生 App**：Capacitor 打包（规划，未实施）
5. **OGR 光学图识别**：`editor.ts` 已预留接口，未实现
6. **多人对战**：未实现

---

## 8. 调试工具

本项目配置了 **Chrome DevTools MCP**（`opencode.json`），可直接操作浏览器：
- 需要 Chrome 以 `--remote-debugging-port=9222` 启动
- 可用 `take_snapshot` 看 DOM、`list_console_messages` 抓报错、`evaluate_script` 执行 JS

注意：CDP 的 `Input.dispatchMouseEvent` 模拟真实鼠标输入；而 `dispatchEvent` 合成事件不一定能触发 Taro 的合成事件系统。测试时优先用前者。

---

## 9. 文档索引

| 文档 | 内容 |
|------|------|
| `docs/deploy.md` | 部署指南（Web/PWA/小程序/原生App） |
| `docs/regression-tests.md` | 回归测试用例清单 |
| `docs/branch-strategy.md` | Git 分支规范 |
| `docs/refactor-plan.md` | 原始重构计划 |
| `docs/progress-2026-10-13.md` | 迭代进度记录 |
| `legacy/` | 旧版源码（参考/考古） |
| `doc/` | 早期调研笔记（chi.txt/mess.txt/log.md） |

---

## 10. 快速上手 checklist

1. 读这份文档（你正在做）
2. `npm install`
3. `npm run dev:h5` → 打开 http://localhost:10086
4. 读 `src/core/game-engine.ts` 理解规则
5. 读 `src/components/BoardCanvas.tsx` 理解渲染与交互
6. 改 UI 前先确认没踩 §5 的坑

---

*最后更新：2026-10-22*
