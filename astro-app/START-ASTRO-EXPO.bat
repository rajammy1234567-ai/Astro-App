@echo off
title AstroTalk Partner - Expo (fixed)
color 0E
cd /d "%~dp0"

echo.
echo  ================================================
echo   AstroTalk Partner App - Expo Go
echo  ================================================
echo.

echo [1/3] Patch Metro SHA-1 (OneDrive fix)...
call node "%~dp0..\shared\patch-metro-sha1-fallback.js"
call node "%~dp0..\shared\patch-metro-treefs-sha1.js"
if errorlevel 1 echo   (patch warn - continuing)

echo [2/3] Free port 8083...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr :8083 ^| findstr LISTENING') do (
  taskkill /F /PID %%a >nul 2>&1
)
timeout /t 1 /nobreak >nul

echo [3/3] Start Expo on port 8083...
echo.
echo   Phone pe Expo Go me:
echo   exp://YOUR_PC_IP:8083
echo.
echo   YE WINDOW OPEN REHNE DO
echo.

set EXPO_NO_TELEMETRY=1
set EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
call npx expo start -c --clear --host lan --port 8083
pause
