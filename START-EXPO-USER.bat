@echo off
title AstroTalk User - Expo Packager
color 0A
cd /d "%~dp0"

echo.
echo  ================================================
echo   AstroTalk User App - Expo Start
echo  ================================================
echo.

echo [1/5] Detecting current WiFi IP...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\setup-mobile-env.ps1"
if errorlevel 1 (
  echo WiFi IP nahi mila. WiFi connect karke dubara try karo.
  pause
  exit /b 1
)

echo.
echo [2/5] Freeing port 8081...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8081 ^| findstr LISTENING') do (
  echo   killing PID %%a
  taskkill /F /PID %%a >nul 2>&1
)

echo.
echo [3/5] Checking API server (5000)...
powershell -NoProfile -Command "try { $r=Invoke-RestMethod 'http://127.0.0.1:5000/api/health' -TimeoutSec 3; Write-Host 'API OK' } catch { Write-Host 'API offline - start server window...'; Start-Process cmd -ArgumentList '/k cd /d \"%~dp0server\" ^&^& npm run dev' }"

echo.
echo [4/5] OneDrive-safe path (no spaces) for Metro...
set "SRC=%~dp0user-panel"
set "DST=C:\astro-app-dev\user-panel"
if not exist "C:\astro-app-dev" mkdir "C:\astro-app-dev"
if not exist "%DST%\package.json" (
  if exist "%DST%" rmdir "%DST%" >nul 2>&1
  mklink /J "%DST%" "%SRC%"
)
if not exist "%DST%\package.json" (
  echo Junction fail - falling back to OneDrive path
  set "DST=%SRC%"
) else (
  echo   Using: %DST%
)

echo.
echo [5/5] Patch Metro + start Expo...
cd /d "%DST%"
if exist "scripts\patch-metro-onedrive.js" call node scripts\patch-metro-onedrive.js

set EXPO_PUBLIC_API_URL=
set REACT_NATIVE_PACKAGER_HOSTNAME=
for /f "usebackq tokens=1* delims==" %%A in ("%SRC%\.env") do (
  if /I "%%A"=="EXPO_PUBLIC_API_URL" set EXPO_PUBLIC_API_URL=%%B
)
if exist "%SRC%\.env.local" (
  for /f "usebackq tokens=1* delims==" %%A in ("%SRC%\.env.local") do (
    if /I "%%A"=="REACT_NATIVE_PACKAGER_HOSTNAME" set REACT_NATIVE_PACKAGER_HOSTNAME=%%B
  )
)

echo.
echo   Packager host: %REACT_NATIVE_PACKAGER_HOSTNAME%
echo   API URL:       %EXPO_PUBLIC_API_URL%
echo   Work dir:      %CD%
echo.
echo   Phone pe SAME WiFi, Expo Go:
echo   exp://%REACT_NATIVE_PACKAGER_HOSTNAME%:8081
echo.
echo   Web: is window me "w" dabao
echo.

call npx expo start -c --clear --host lan --port 8081
pause
