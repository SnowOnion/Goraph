# Goraph 渐进式重构计划

## 架构总览

```
Goraph/
├── src/                        # Taro 源码
│   ├── core/                   # 框架无关核心逻辑（纯 TS，无 DOM 依赖）
│   │   ├── types.ts            # 类型定义
│   │   ├── boards.ts           # 预设棋盘数据
│   │   ├── game-engine.ts      # 围棋引擎：落子验证、气数维护、提子
│   │   ├── five.ts             # 五子棋规则
│   │   └── editor.ts           # 棋盘编辑器逻辑
│   ├── components/             # React 组件
│   │   ├── BoardCanvas.tsx     # 棋盘渲染（抽象层，适配多端）
│   │   ├── GameControls.tsx    # 游戏控制面板
│   │   ├── EditorCanvas.tsx    # 编辑器画布
│   │   └── TouchLayer.tsx      # 触摸交互层
│   ├── pages/                  # Taro 页面
│   │   ├── index.tsx           # 对弈页
│   │   └── editor.tsx          # 编辑器页
│   ├── hooks/                  # 自定义 hooks
│   │   └── useGame.ts          # 游戏状态管理 hook
│   └── app.tsx                 # Taro 入口
├── config/                     # Taro 配置
├── dist/                       # 构建输出
├── docs/                       # 文档（迁移自 doc/）
├── legacy/                     # 原始静态文件（保留）
├── package.json
├── tsconfig.json
├── project.config.json         # Taro 项目配置
└── babel.config.js
```

## 阶段划分

### Phase 1: 工程化 + 核心逻辑提取
- [ ] 初始化 Taro 3.x + React + TypeScript 项目
- [ ] 提取围棋核心引擎为框架无关的 TypeScript 模块
- [ ] 提取棋盘数据
- [ ] 验证核心逻辑单元测试通过
- **交付**: `npm run dev:h5` 能跑起来一个基础页面

### Phase 2: 游戏 UI + 移动端优化
- [ ] BoardCanvas 组件（响应式 Canvas）
- [ ] 触摸交互：落子、预览、撤销
- [ ] 控制面板：棋盘选择、重新开始、弃子
- [ ] 移动端适配：viewport、禁止缩放、安全区域
- [ ] 落子位置触摸预览
- **交付**: H5 移动端可用的围棋游戏

### Phase 3: 棋盘编辑器
- [ ] 可视化节点/边编辑器
- [ ] 拖拽创建节点
- [ ] 点击创建/删除边
- [ ] 保存/加载自定义棋盘（localStorage）
- [ ] 预留 OGR（光学图识别）扩展接口
- **交付**: 可在移动端使用的棋盘编辑器

### Phase 4: 多端适配
- [ ] PWA 支持（manifest + service worker）
- [ ] 微信小程序适配
- [ ] Capacitor 打包原生 App
- **交付**: Web / PWA / 微信小程序 / 原生 App

## 关键技术决策

| 决策项 | 选择 | 理由 |
|--------|------|------|
| 框架 | Taro 3.x + React + TS | 用户选定，国内小程序生态最佳 |
| Canvas 抽象 | 统一接口，H5 用 DOM Canvas，小程序用 `type="2d"` | Taro 的 Canvas 组件差异 |
| 状态管理 | React hooks（useReducer） | 游戏状态不复杂，无需 Redux |
| 棋盘存储 | localStorage + 导出 JSON | 轻量，同步接口 |
| CSS | SCSS + CSS Modules | Taro 默认支持，组件隔离 |
