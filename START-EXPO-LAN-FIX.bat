@echo off
title AstroTalk User - Expo LAN Fix
color 0B
cd /d "%~dp0"

echo.
echo  ================================================
echo   Expo LAN mode - clean restart
echo  ================================================
echo.

echo [1] Kill ALL node/metro on 8081-8083...
for %%P in (8081 8082 8083) do (
  for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr :%%P ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
  )
)
timeout /t 2 /nobreak >nul

echo [2] Detect WiFi IP...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\setup-mobile-env.ps1"
if errorlevel 1 (
  echo WiFi IP fail. WiFi connect karke dubara try.
  pause
  exit /b 1
)

for /f "usebackq tokens=1* delims==" %%A in ("user-panel\.env.local") do (
  if /I "%%A"=="REACT_NATIVE_PACKAGER_HOSTNAME" set HOST=%%B
)

echo.
echo   Your PC IP: %HOST%
echo   Phone URL:  exp://%HOST%:8081
echo.

echo [3] Start API if needed...
powershell -NoProfile -Command "try { Invoke-RestMethod 'http://127.0.0.1:5000/api/health' -TimeoutSec 2 | Out-Null; Write-Host 'API OK' } catch { Start-Process cmd -ArgumentList '/k cd /d \"%~dp0server\" ^&^& npm run dev'; Start-Sleep 5 }"

echo [4] Start Metro (LAN, listen all interfaces)...
cd /d "%~dp0user-panel"
set REACT_NATIVE_PACKAGER_HOSTNAME=%HOST%
set EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0

echo.
echo  ------------------------------------------------
echo   PHONE:
echo   1. SAME WiFi as PC (mobile data OFF)
echo   2. Expo Go 57 open
echo   3. Manual: exp://%HOST%:8081
echo   4. Ya QR scan (fresh QR after start)
echo.
echo   Still fail? Close this and run START-EXPO-TUNNEL.bat
echo  ------------------------------------------------
echo.

call npx expo start -c --clear --host lan --port 8081
pause
