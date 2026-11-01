# Goraph 部署指南

Goraph 是 Taro + React 跨端项目。本文档覆盖 **Web/PWA** 与 **微信小程序** 的构建与发布，以及原生 App（规划）。

## 前置条件

| 工具 | 版本 | 说明 |
|------|------|------|
| Node.js | ≥ 18 | 推荐 20+ |
| npm | ≥ 9 | |
| 微信开发者工具 | 最新 | 仅小程序需要 |

```bash
npm install   # 安装依赖
```

---

## 一、本地开发

```bash
# H5 开发（默认 http://localhost:10086）
npm run dev:h5

# 微信小程序开发（微信开发者工具打开 dist/）
npm run dev:weapp
```

**查看 UI 尺寸验证：**
```bash
node test/measure.js   # 打印按钮/棋盘/文字的实际像素尺寸
```

---

## 二、Web / PWA 部署

### 构建

```bash
# 方式一：npm 脚本
npm run build:h5

# 方式二：部署脚本（推荐，会给 Service Worker 缓存打版本号）
./scripts/deploy.sh h5
```

> `config/index.ts` 的 `copy.patterns` 会把 `public/`（`manifest.json`、`sw.js`、`icons/`）复制到产物根目录，两种方式都有 PWA 资源；
> 区别是 `deploy.sh` 还会给 `sw.js` 的缓存打上版本号。

### 产物结构

```
dist/
├── index.html          # SPA 入口
├── css/                # 样式
├── js/                 # 脚本（含运行时）
├── manifest.json       # ← PWA 清单
├── sw.js               # ← Service Worker
└── icons/icon.svg      # ← 图标
```

### 部署到静态托管

产物里的资源、manifest、Service Worker 都用相对路径，`dist/` 既可以作为站点根目录，也可以放在任意子路径下（如 `https://app.sonion.xyz/goraph/`），无需改配置。任选其一上传：

#### 1. GitHub Pages
```bash
npm run build:h5
npx gh-pages -d dist
```
> 注意：GitHub Pages 默认是 history 路由，需配置 404 回退到 index.html（或使用 hash 路由）。

#### 2. Vercel
```bash
npm i -g vercel
vercel --prod
```
在 Vercel 项目设置里把 Output Directory 指向 `dist`。

#### 3. Netlify
```bash
npm i -g netlify-cli
netlify deploy --dir=dist --prod
```

#### 4. Cloudflare Pages
连接 Git 仓库，Build command `npm run build:h5`，Output directory `dist`。

#### 5. Nginx
```nginx
server {
  listen 443 ssl;
  server_name example.com;
  root /var/www/goraph/dist;
  index index.html;

  # history 路由回退（本项目使用 hash 路由，通常无需此项）
  location / {
    try_files $uri $uri/ /index.html;
  }

  # Service Worker 不能长缓存，否则新版本迟迟不生效
  location = /sw.js {
    add_header Cache-Control "no-cache";
  }

  # 带 hash 的静态资源长缓存
  location ~* \.(js|css|svg|png)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }
}
```

### PWA 生效前提

| 要求 | 说明 |
|------|------|
| **HTTPS** | Service Worker 仅在 HTTPS（或 localhost）下注册 |
| **同目录** | `manifest.json`、`sw.js` 与 `index.html` 在同一目录（构建产物已如此）；SW 作用域即该目录 |
| **缓存版本** | `scripts/deploy.sh` 把 `sw.js` 里的 `__SW_VERSION__` 替换为 git 提交号，新版激活时自动清理旧缓存；只跑 `npm run build:h5` 不替换 |
| **独立模式** | `manifest.json` 中 `display: standalone` 已配置 |

安装 PWA 后可在 `chrome://settings/installedApps` 或系统「已安装的应用」中管理。

---

## 三、微信小程序部署

### 构建

```bash
npm run build:weapp
# 或
./scripts/deploy.sh weapp
```

产物在 `dist/`（对应 `project.config.json` 的 `miniprogramRoot`）。

### 发布流程

1. 打开 **微信开发者工具** → 导入项目 → 选择 `dist/` 目录
2. 填入小程序 `appid`（`project.config.json` 中当前为 `touristappid`，仅体验版可用）
3. 点击 **上传** → 填写版本号与备注
4. 登录 [微信公众平台](https://mp.weixin.qq.com/) → 版本管理 → 提交审核
5. 审核通过后 **发布**

> 小程序端当前仍使用 `canvas` 的原生绘制封装，与 H5 的 Canvas 2D 存在平台差异。
> 如需在小程序端完整体验对弈/编辑器，需单独验证 Canvas 组件的 2d 渲染。

### 其他小程序

抖音/支付宝/QQ 小程序：安装对应 Taro 插件后，用 `npx taro build --type <platform>` 构建。

---

## 四、原生 App（规划中）

使用 [Capacitor](https://capacitorjs.com/) 将 H5 产物打包为 iOS/Android 应用：

```bash
npm i @capacitor/core @capacitor/cli
npx cap init
npx cap add ios android
# 将 H5 构建产物复制到 capacitor webDir 后
npx cap sync
npx cap open ios   # 或 android
```

---

## 五、持续集成

示例 GitHub Actions（`.github/workflows/deploy.yml`）：

```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build:h5
      # 然后上传到你的托管平台
```

---

## 常见问题

**Q: 部署后 PWA 无法离线使用？**
A: 检查 `dist/` 根目录是否有 `manifest.json` 和 `sw.js`；确认站点是 HTTPS；查看 DevTools → Application → Service Workers 是否注册成功。

**Q: 微信小程序打开白屏？**
A: 确认 `project.config.json` 的 `miniprogramRoot` 指向正确；检查是否有平台不支持的 API。

**Q: 棋盘/按钮尺寸不对？**
A: 运行 `node test/measure.js` 核对实际像素尺寸。
