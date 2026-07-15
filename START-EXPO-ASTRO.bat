@echo off
title AstroTalk - Expo Astrologer App
color 0E
cd /d "%~dp0"

echo.
echo  ================================================
echo   AstroTalk Astrologer App - Expo Go Start
echo  ================================================
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0scripts\setup-mobile-env.ps1"

cd /d "%~dp0astro-app"
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8083 ^| findstr LISTENING') do (
  taskkill /F /PID %%a >nul 2>&1
)

echo Patching expo-router entry (fixes 500 entry-classic)...
call node scripts\patch-expo-router-entry.js


for /f "usebackq tokens=1* delims==" %%A in ("%~dp0astro-app\.env") do (
  if /I "%%A"=="EXPO_PUBLIC_API_URL" set EXPO_PUBLIC_API_URL=%%B
)
if exist "%~dp0astro-app\.env.local" (
  for /f "usebackq tokens=1* delims==" %%A in ("%~dp0astro-app\.env.local") do (
    if /I "%%A"=="REACT_NATIVE_PACKAGER_HOSTNAME" set REACT_NATIVE_PACKAGER_HOSTNAME=%%B
  )
)

call npx expo start -c --clear --host lan --port 8083
pause
