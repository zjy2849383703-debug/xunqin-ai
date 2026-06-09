@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo  寻亲 AI 本地服务启动中...
echo.
if not exist "node_modules\" (
  echo  首次运行，正在安装依赖...
  call npm install
)
echo  启动后请在浏览器打开: http://localhost:3000
echo  按 Ctrl+C 可停止服务
echo.
node server.js
pause
