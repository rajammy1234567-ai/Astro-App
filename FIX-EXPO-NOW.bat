@echo off
title FIX Expo Packager - AstroTalk User
color 0A
cd /d "%~dp0"

echo.
echo  ================================================
echo   FIX: Packager is not running
echo  ================================================
echo.

echo [1/5] Kill old Metro processes...
for %%P in (8081 8082 8083) do (
  for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr :%%P ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
  )
)
timeout /t 2 /nobreak >nul

echo [2/5] Update WiFi IP...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\setup-mobile-env.ps1"
if errorlevel 1 (
  echo WiFi IP nahi mila. WiFi ON karo.
  pause
  exit /b 1
)

set HOST=
for /f "usebackq tokens=1* delims==" %%A in ("user-panel\.env.local") do (
  if /I "%%A"=="REACT_NATIVE_PACKAGER_HOSTNAME" set HOST=%%B
)

echo.
echo [3/5] Start API server if needed...
powershell -NoProfile -Command "try { Invoke-RestMethod 'http://127.0.0.1:5000/api/health' -TimeoutSec 2 | Out-Null; Write-Host '  API already running' } catch { Write-Host '  Starting API...'; Start-Process cmd -ArgumentList '/k cd /d \"%~dp0server\" ^&^& npm run dev' ; Start-Sleep 6 }"

echo.
echo [4/5] Your connect info:
echo.
echo   PC IP     : %HOST%
echo   Expo URL  : exp://%HOST%:8081
echo   API URL   : http://%HOST%:5000/api
echo.
echo   *** PHONE CHECKLIST ***
echo   - Mobile DATA band karo
echo   - WiFi = PC wala same network
echo   - Expo Go app SDK 57
echo   - Pehle FIX-FIREWALL-ADMIN.bat chalao (right-click Run as admin)
echo   - Expo Go me "Enter URL manually" -^> exp://%HOST%:8081
echo.
echo   Browser test: http://%HOST%:8081  (PC pe "running" dikhe)
echo.

echo [5/5] Starting Metro packager (keep this window OPEN)...
echo   Packager band = phone pe "packager is not running" error
echo.
cd /d "%~dp0user-panel"
set REACT_NATIVE_PACKAGER_HOSTNAME=%HOST%
set EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0

call npx expo start -c --clear --host lan --port 8081
pause
