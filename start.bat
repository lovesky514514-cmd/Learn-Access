@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
set PORT=8765
set URL=http://127.0.0.1:%PORT%/

echo [算法冒险之旅] 正在启动本地学习站点...

where py >nul 2>nul
if not errorlevel 1 (
  start "AlgorithmAdventureServer" /min cmd /k "py -m http.server %PORT% --bind 127.0.0.1"
  goto :open
)

where python >nul 2>nul
if not errorlevel 1 (
  start "AlgorithmAdventureServer" /min cmd /k "python -m http.server %PORT% --bind 127.0.0.1"
  goto :open
)

echo [提示] 没检测到 Python，将直接打开 index.html。
start "" "%~dp0index.html"
goto :end

:open
timeout /t 1 /nobreak >nul
start "" "%URL%"
echo 已打开：%URL%
echo 关闭名为 AlgorithmAdventureServer 的窗口即可停止本地服务器。

:end
endlocal
