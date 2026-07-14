@echo off
title AstroTalk - Start Everything
color 0B
cd /d "%~dp0"

echo.
echo  ================================================
echo   AstroTalk - FULL START (Server + User App)
echo  ================================================
echo.
echo  SDK: Expo 57  ^|  Phone: Expo Go 57 + same WiFi
echo.

echo [1/4] WiFi IP + .env update...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\setup-mobile-env.ps1"
if errorlevel 1 (
  echo ERROR: WiFi IP nahi mila. WiFi on karke dubara try karo.
  pause
  exit /b 1
)

echo.
echo [2/4] Backend server (port 5000)...
start "AstroTalk SERVER" cmd /k "cd /d "%~dp0server" && echo Starting API server... && npm run dev"

echo   Waiting for API...
timeout /t 5 /nobreak >nul
powershell -NoProfile -Command "for($i=0;$i -lt 12;$i++){ try { Invoke-RestMethod 'http://127.0.0.1:5000/api/health' -TimeoutSec 2 | Out-Null; Write-Host '  API OK'; exit 0 } catch { Start-Sleep 2 } }; Write-Host '  API still starting - check SERVER window' -ForegroundColor Yellow"

echo.
echo [3/4] Free Expo port 8081 if busy...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr :8081 ^| findstr LISTENING') do (
  taskkill /F /PID %%a >nul 2>&1
)

echo.
echo [4/4] User app Expo packager...
echo.
echo  ------------------------------------------------
echo   PHONE STEPS:
echo   1. Install Expo Go (SDK 57) - Play Store
echo   2. PC aur phone SAME WiFi
echo   3. Expo Go me QR scan OR:
echo      exp://YOUR_IP:8081
echo   4. Login / app use karo
echo.
echo   WEB test: is window me "w" dabao
echo.
echo   Custom APK open-band ho rahi ho to PEHLE
echo   Expo Go se chalao - code theek hai.
echo  ------------------------------------------------
echo.

cd /d "%~dp0user-panel"
call npx expo start -c --clear --host lan --port 8081
pause
