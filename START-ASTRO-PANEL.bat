@echo off
title AstroTalk Partner Panel
color 0E
cd /d "%~dp0"

echo.
echo  ================================================
echo   AstroTalk PARTNER (Astrologer) - Expo Start
echo  ================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\setup-mobile-env.ps1"

echo.
echo  Checking API on 5000...
powershell -NoProfile -Command "try { Invoke-RestMethod 'http://127.0.0.1:5000/api/health' -TimeoutSec 3 | Out-Null; Write-Host 'API OK' } catch { Write-Host 'API OFF - pehle START-EVERYTHING.bat chalao' -ForegroundColor Red }"

for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr :8083 ^| findstr LISTENING') do (
  taskkill /F /PID %%a >nul 2>&1
)

echo.
echo  Phone: Expo Go - scan QR  OR  exp://IP:8083
echo.

cd /d "%~dp0astro-app"
call npx expo start -c --clear --host lan --port 8083
pause
