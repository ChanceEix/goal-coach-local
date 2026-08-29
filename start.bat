@echo off
rem Goal Coach - OKR Local Workbench
cd /d "%~dp0"
echo Starting Goal Coach local service...
"C:\Users\xieqiang\.workbuddy\binaries\node\versions\22.22.2\node.exe" server.js
pause
