@echo off
title AstroTalk - Expo User App (Phone)
color 0A
cd /d "%~dp0"

echo.
echo  ================================================
echo   AstroTalk User App - Expo Go Start
echo  ================================================
echo.

echo [1/3] Updating PC WiFi IP in .env ...
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\setup-mobile-env.ps1"
if errorlevel 1 (
  echo Failed to detect WiFi IP. Connect WiFi and try again.
  pause
  exit /b 1
)

echo.
echo [2/3] Checking API server on port 5000 ...
powershell -NoProfile -Command "try { (Invoke-RestMethod 'http://127.0.0.1:5000/api/health' -TimeoutSec 3).status | Out-Host } catch { Write-Host 'API offline - starting server...'; Start-Process cmd -ArgumentList '/k cd /d \"%~dp0server\" && npm run dev' -WindowStyle Normal; Start-Sleep 5 }"

echo.
echo [3/3] Starting Expo on port 8081 (LAN) ...
echo   Phone + PC same WiFi pe hone chahiye.
echo   Expo Go app se QR scan karo.
echo.

cd /d "%~dp0user-panel"

REM Free port 8081 if stuck
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8081 ^| findstr LISTENING') do (
  echo Killing old process on 8081 PID %%a
  taskkill /F /PID %%a >nul 2>&1
)

for /f "usebackq tokens=1* delims==" %%A in ("%~dp0user-panel\.env") do (
  if /I "%%A"=="EXPO_PUBLIC_API_URL" set EXPO_PUBLIC_API_URL=%%B
)
if exist "%~dp0user-panel\.env.local" (
  for /f "usebackq tokens=1* delims==" %%A in ("%~dp0user-panel\.env.local") do (
    if /I "%%A"=="REACT_NATIVE_PACKAGER_HOSTNAME" set REACT_NATIVE_PACKAGER_HOSTNAME=%%B
  )
)

echo Packager host: %REACT_NATIVE_PACKAGER_HOSTNAME%
echo API URL: %EXPO_PUBLIC_API_URL%
echo.

call npx expo start -c --clear --host lan --port 8081
pause
