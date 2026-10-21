#!/usr/bin/env bash
#
# Goraph 部署脚本
# 用法:
#   ./scripts/deploy.sh h5          # 构建并部署 H5 站点
#   ./scripts/deploy.sh h5 --prod   # 生产构建（压缩/优化）
#   ./scripts/deploy.sh weapp       # 构建微信小程序
#
set -euo pipefail

cd "$(dirname "$0")/.."

TARGET="${1:-h5}"
MODE="${2:-dev}"

echo "🚀 部署目标: ${TARGET} (模式: ${MODE})"

# ---------- H5 / PWA ----------
if [ "$TARGET" = "h5" ]; then
  echo "📦 构建 H5..."
  npx taro build --type h5

  # 复制 PWA 静态资源（Taro 不会自动复制 public/）
  echo "📋 复制 PWA 资源 (manifest, service worker, 图标)..."
  cp -r public/* dist/

  echo ""
  echo "✅ 构建完成: dist/"
  echo ""
  echo "产物结构:"
  find dist -type f | sort | sed 's|^|  |'
  echo ""

  # 本地预览
  echo "🌐 本地预览: python3 -m http.server 10086 --directory dist"
  echo "   或:       npx serve dist -l 10086"

# ---------- 微信小程序 ----------
elif [ "$TARGET" = "weapp" ]; then
  echo "📦 构建微信小程序..."
  npx taro build --type weapp

  echo ""
  echo "✅ 构建完成: dist/"
  echo "📱 用微信开发者工具打开 dist/ 目录"
  echo "   (需在开发者工具中填入小程序 appid，或仅作预览)"

# ---------- 全平台 ----------
elif [ "$TARGET" = "all" ]; then
  "$0" h5 "$MODE"
  "$0" weapp "$MODE"
  echo ""
  echo "🎉 全平台构建完成"

else
  echo "❌ 未知目标: ${TARGET}"
  echo "用法: $0 {h5|weapp|all} [--prod]"
  exit 1
fi
