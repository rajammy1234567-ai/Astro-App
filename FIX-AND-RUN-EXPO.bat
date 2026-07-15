@echo off
:: Double-click this when Expo phone connect fails.
:: 1) Opens Admin firewall rules  2) Fixes WiFi IP  3) Starts Expo TUNNEL (works even if LAN blocked)

title AstroTalk - FIX AND RUN EXPO
color 0A
cd /d "%~dp0"

echo.
echo  ================================================
echo   AstroTalk Expo - FIX AND RUN
echo  ================================================
echo.

:: Elevate for firewall if not admin
net session >nul 2>&1
if errorlevel 1 (
  echo  [!] Admin rights mang raha hai firewall ke liye...
  echo      UAC pe YES dabao.
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

echo [1/5] Firewall open (5000, 8081-8083)...
for %%P in (5000 8081 8082 8083) do (
  netsh advfirewall firewall delete rule name="AstroTalk Port %%P" >nul 2>&1
  netsh advfirewall firewall add rule name="AstroTalk Port %%P" dir=in action=allow protocol=TCP localport=%%P >nul
  echo   port %%P allowed
)

echo [2/5] Kill old Metro...
for %%P in (8081 8082 8083) do (
  for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr :%%P ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
  )
)
timeout /t 2 /nobreak >nul

echo [3/5] Detect WiFi IP + update .env...
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

echo [4/5] Start API if needed...
powershell -NoProfile -Command "try { Invoke-RestMethod 'http://127.0.0.1:5000/api/health' -TimeoutSec 2 | Out-Null; Write-Host '  API OK' } catch { Write-Host '  Starting API...'; Start-Process cmd -ArgumentList '/k cd /d \"%~dp0server\" ^&^& npm run dev' ; Start-Sleep 6 }"

echo.
echo [5/5] Starting Expo TUNNEL...
echo.
echo  ------------------------------------------------
echo   PC IP (LAN backup): %HOST%
echo.
echo   Phone pe:
echo     1) Expo Go (SDK 57) kholo
echo     2) Is window ka QR SCAN karo  (tunnel)
echo     3) Ya "Enter URL manually" me exp:// URL paste
echo.
echo   Agar tunnel fail ho: is window me Ctrl+C, phir type:
echo     npx expo start -c --host lan --port 8081
echo     Phone: exp://%HOST%:8081
echo.
echo   Browser test (PC):  http://localhost:8081
echo  ------------------------------------------------
echo.
echo   YE WINDOW OPEN REHNE DO - band = packager band
echo.

cd /d "%~dp0user-panel"
set REACT_NATIVE_PACKAGER_HOSTNAME=%HOST%
set EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
set EXPO_NO_TELEMETRY=1

call npx expo start -c --clear --tunnel --port 8081
if errorlevel 1 (
  echo.
  echo  Tunnel fail - LAN mode try...
  call npx expo start -c --clear --host lan --port 8081
)

pause
