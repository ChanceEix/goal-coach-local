@echo off
rem Goal Coach - OKR Local Workbench
rem The managed Node folder name can change (22.22.2 / 22.22.2-2 / 23.x),
rem so detect it at runtime instead of hard-coding one version.
cd /d "%~dp0"

set "NODE_EXE="
set "NODE_BASE=%USERPROFILE%\.workbuddy\binaries\node\versions"

rem 1) Prefer WorkBuddy managed Node 22+ (last match wins = newest folder)
for /d %%d in ("%NODE_BASE%\22.*" "%NODE_BASE%\23.*" "%NODE_BASE%\24.*") do (
  if exist "%%d\node.exe" set "NODE_EXE=%%d\node.exe"
)

rem 2) Fallback: any node on PATH
if not defined NODE_EXE (
  where node >nul 2>nul
  if not errorlevel 1 (
    for /f "delims=" %%i in ('where node') do set "NODE_EXE=%%i"
  )
)

if not defined NODE_EXE (
  echo.
  echo [ERROR] Node.js not found.
  echo Please install Node.js 22 or above: https://nodejs.org/
  echo.
  pause
  exit /b 1
)

echo Starting Goal Coach local service...
echo Node: %NODE_EXE%
echo.
"%NODE_EXE%" server.js
pause
