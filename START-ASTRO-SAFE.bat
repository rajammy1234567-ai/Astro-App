@echo off
title AstroTalk Partner - Safe Expo Start
color 0E
cd /d "%~dp0"

echo.
echo  ================================================
echo   Partner app - OneDrive-safe Expo start
echo  ================================================
echo.

echo [1] Kill old processes on 8083...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr :8083 ^| findstr LISTENING') do (
  taskkill /F /PID %%a >nul 2>&1
)

echo [2] Patch Metro (ENOENT watch crash fix)...
cd /d "%~dp0astro-app"
call node scripts/patch-metro-onedrive.js

echo [3] Clean Expo cache...
if exist .expo rmdir /s /q .expo >nul 2>&1

echo [4] Update WiFi IP...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\setup-mobile-env.ps1"

echo [5] API check...
powershell -NoProfile -Command "try { Invoke-RestMethod 'http://127.0.0.1:5000/api/health' -TimeoutSec 2 | Out-Null; Write-Host '  API OK' } catch { Write-Host '  Starting API...'; Start-Process cmd -ArgumentList '/k cd /d \"%~dp0server\" ^&^& npm run dev' }"

echo.
echo  Keep this window OPEN.
echo  Phone: exp://YOUR_IP:8083
echo.

call npx expo start -c --clear --host lan --port 8083
pause
