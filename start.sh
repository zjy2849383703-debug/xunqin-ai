#!/usr/bin/env bash
# 寻亲 AI 本地服务启动脚本 (git-bash / WSL / Linux / macOS)
cd "$(dirname "$0")"

echo ""
echo "  寻亲 AI 本地服务启动中..."
echo ""

if [ ! -d "node_modules" ]; then
  echo "  首次运行，正在安装依赖..."
  npm install
fi

echo "  启动后请在浏览器打开: http://localhost:3000"
echo "  按 Ctrl+C 可停止服务"
echo ""

node server.js
