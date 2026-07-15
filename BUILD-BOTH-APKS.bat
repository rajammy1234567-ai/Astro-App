@echo off
setlocal EnableExtensions
cd /d "%~dp0"

echo ============================================
echo  AstroTalk — Build User + Partner APKs
echo  EAS account: viz_eas_001
echo  Profile: apk (crash-safe v1.0.4)
echo ============================================
echo.

where eas >nul 2>&1
if errorlevel 1 (
  echo [!] eas-cli not found. Installing globally...
  call npm install -g eas-cli
)

echo [1/5] Checking EAS login...
eas whoami
if errorlevel 1 (
  echo.
  echo *** NOT LOGGED IN ***
  echo Run:  eas login
  echo Username: viz_eas_001
  echo Then re-run this script.
  pause
  exit /b 1
)

echo.
echo [2/5] Init / link USER project under viz_eas_001...
cd /d "%~dp0user-panel"
call eas init --non-interactive --force 2>nul
if errorlevel 1 (
  echo eas init user may need interactive confirm — trying project:init
  call eas project:init --non-interactive 2>nul
)

echo.
echo [3/5] Building USER APK (this takes 10-20 min on Expo servers)...
call eas build --platform android --profile apk --clear-cache --non-interactive --no-wait
if errorlevel 1 (
  echo USER build submit FAILED
  pause
  exit /b 1
)

echo.
echo [4/5] Init / link ASTRO project under viz_eas_001...
cd /d "%~dp0astro-app"
call eas init --non-interactive --force 2>nul
if errorlevel 1 (
  call eas project:init --non-interactive 2>nul
)

echo.
echo [5/5] Building PARTNER/ASTRO APK...
call eas build --platform android --profile apk --clear-cache --non-interactive --no-wait
if errorlevel 1 (
  echo ASTRO build submit FAILED
  pause
  exit /b 1
)

echo.
echo ============================================
echo  Both builds QUEUED on Expo.
echo  Check status:
echo    cd user-panel ^&^& eas build:list
echo    cd astro-app  ^&^& eas build:list
echo  Or open: https://expo.dev/accounts/viz_eas_001/projects
echo ============================================
pause
