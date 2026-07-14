@echo off
title AstroTalk User - Expo TUNNEL (fix for packager error)
color 0A
cd /d "%~dp0"

echo.
echo  ================================================
echo   Expo TUNNEL mode - packager not running FIX
echo  ================================================
echo.
echo  LAN WiFi block / firewall pe bhi kaam karega.
echo  Internet chahiye PC + phone dono pe.
echo.

echo [1] Kill old Expo/Metro on 8081...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr :8081 ^| findstr LISTENING') do (
  echo   killing PID %%a
  taskkill /F /PID %%a >nul 2>&1
)
timeout /t 2 /nobreak >nul

echo [2] Update local IP env (API still uses your PC/server)...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\setup-mobile-env.ps1"

echo [3] API server check...
powershell -NoProfile -Command "try { Invoke-RestMethod 'http://127.0.0.1:5000/api/health' -TimeoutSec 3 | Out-Null; Write-Host '  API OK' } catch { Write-Host '  API OFF - starting server...'; Start-Process cmd -ArgumentList '/k cd /d \"%~dp0server\" ^&^& npm run dev' }"
timeout /t 4 /nobreak >nul

echo.
echo [4] Starting Expo with TUNNEL...
echo.
echo  ------------------------------------------------
echo   1) Phone pe Expo Go (SDK 57) kholo
echo   2) QR scan karo (tunnel QR)
echo   3) "packager is not running" nahi aana chahiye
echo.
echo   Agar tunnel slow ho: 30-60 sec wait after start
echo  ------------------------------------------------
echo.

cd /d "%~dp0user-panel"

REM Tunnel needs @expo/ngrok - expo installs if missing
set EXPO_NO_TELEMETRY=1
call npx expo start -c --clear --tunnel --port 8081

pause
