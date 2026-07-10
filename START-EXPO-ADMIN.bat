@echo off
title AstroTalk - Expo Admin App
color 0B
cd /d "%~dp0"

echo.
echo  ================================================
echo   AstroTalk Admin App - Expo Go Start
echo  ================================================
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0scripts\setup-mobile-env.ps1"

cd /d "%~dp0admin-app"
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8082 ^| findstr LISTENING') do (
  taskkill /F /PID %%a >nul 2>&1
)

for /f "usebackq tokens=1* delims==" %%A in ("%~dp0admin-app\.env") do (
  if /I "%%A"=="EXPO_PUBLIC_API_URL" set EXPO_PUBLIC_API_URL=%%B
)
if exist "%~dp0admin-app\.env.local" (
  for /f "usebackq tokens=1* delims==" %%A in ("%~dp0admin-app\.env.local") do (
    if /I "%%A"=="REACT_NATIVE_PACKAGER_HOSTNAME" set REACT_NATIVE_PACKAGER_HOSTNAME=%%B
  )
)

call npx expo start -c --clear --host lan --port 8082
pause
