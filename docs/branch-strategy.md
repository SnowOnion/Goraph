# Git 分支规范
# Goraph 项目

## 分支模型

基于 GitHub Flow（轻量级，适合持续交付的个人/小项目）。

### 长期分支

| 分支 | 用途 | 保护 |
|------|------|------|
| `main` | 生产就绪代码，始终可部署 | ✅ 禁止直接 push，必须通过 PR |
| `develop`（可选） | 开发集成，不稳定 | ❌ |

### 短期分支

命名规范：`<类型>/<简短描述>`

| 类型 | 示例 | 用途 |
|------|------|------|
| `feature/` | `feature/undo-move` | 新功能 |
| `fix/` | `fix/touch-drag-error` | 修复 bug |
| `refactor/` | `refactor/canvas-component` | 重构，不改行为 |
| `chore/` | `chore/setup-playwright` | 工具/依赖/配置 |
| `docs/` | `docs/branch-strategy` | 文档 |
| `wip/` | `wip/multiplayer` | 未完成，不合并 |

### 工作流

```
main ────────────────────────────────────────────
  │
  └── feature/undo-move
        │  commit, commit, ...
        └── PR #12 → review → squash merge → main
```

### 提交规范

```
<type>: <简短描述>

type: feat|fix|refactor|chore|docs|test|style
```

示例：
```
feat: 添加悔棋功能

- 在 useReducer 中维护历史栈
- 每次落子前保存快照
- 控制面板添加悔棋按钮
```

### 规则

1. **main 永远可部署** — 任何时刻都应该是干净的
2. **短期分支用完即删** — 合并后删除本地和远程
3. **PR 必须描述变更内容** — 标题清晰，正文说明动机
4. **禁止 force push 到 main** — 只在自己的短期分支上 rebase
5. **commit 粒度** — 一个 commit 做一件事，方便 revert
