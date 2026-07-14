@echo off
title AstroTalk Admin Panel
color 0D
cd /d "%~dp0"

echo.
echo  ================================================
echo   AstroTalk ADMIN - Expo Start
echo  ================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\setup-mobile-env.ps1"

powershell -NoProfile -Command "try { Invoke-RestMethod 'http://127.0.0.1:5000/api/health' -TimeoutSec 3 | Out-Null; Write-Host 'API OK' } catch { Write-Host 'API OFF - pehle START-EVERYTHING.bat' -ForegroundColor Red }"

for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr :8082 ^| findstr LISTENING') do (
  taskkill /F /PID %%a >nul 2>&1
)

cd /d "%~dp0admin-app"
call npx expo start -c --clear --host lan --port 8082
pause
