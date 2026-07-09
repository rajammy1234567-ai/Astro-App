@echo off
title AstroTalk User - Expo Packager
color 0A
cd /d "%~dp0"

echo.
echo  ================================================
echo   AstroTalk User App - Expo Go Fix Start
echo  ================================================
echo.

echo [1/4] Detecting current WiFi IP...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\setup-mobile-env.ps1"
if errorlevel 1 (
  echo WiFi IP nahi mila. WiFi connect karke dubara try karo.
  pause
  exit /b 1
)

echo.
echo [2/4] Freeing port 8081...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8081 ^| findstr LISTENING') do (
  echo   killing PID %%a
  taskkill /F /PID %%a >nul 2>&1
)

echo.
echo [3/4] Checking API server (5000)...
powershell -NoProfile -Command "try { $r=Invoke-RestMethod 'http://127.0.0.1:5000/api/health' -TimeoutSec 3; Write-Host 'API OK' } catch { Write-Host 'API offline - start server window...'; Start-Process cmd -ArgumentList '/k cd /d \"%~dp0server\" ^&^& npm run dev' }"

echo.
echo [4/4] Starting Metro packager (LAN)...
cd /d "%~dp0user-panel"

set EXPO_PUBLIC_API_URL=
set REACT_NATIVE_PACKAGER_HOSTNAME=
for /f "usebackq tokens=1* delims==" %%A in ("%~dp0user-panel\.env") do (
  if /I "%%A"=="EXPO_PUBLIC_API_URL" set EXPO_PUBLIC_API_URL=%%B
)
if exist "%~dp0user-panel\.env.local" (
  for /f "usebackq tokens=1* delims==" %%A in ("%~dp0user-panel\.env.local") do (
    if /I "%%A"=="REACT_NATIVE_PACKAGER_HOSTNAME" set REACT_NATIVE_PACKAGER_HOSTNAME=%%B
  )
)

echo.
echo   Packager host: %REACT_NATIVE_PACKAGER_HOSTNAME%
echo   API URL:       %EXPO_PUBLIC_API_URL%
echo   Expo version:  57.0.2
echo.
echo   Phone pe SAME WiFi, Expo Go me ye open karo:
echo   exp://%REACT_NATIVE_PACKAGER_HOSTNAME%:8081
echo.
echo   IMPORTANT: Ye window open rehni chahiye - packager yahin chalta hai.
echo.

call npx expo start -c --clear --host lan --port 8081
pause
