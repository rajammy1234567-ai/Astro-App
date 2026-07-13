@echo off
title AstroTalk User Panel
color 0A
echo.
echo  ================================================
echo   AstroTalk User Panel - Expo Start
echo  ================================================
echo.
echo  NOTE: OneDrive path me spaces ("all app") Metro torte hain.
echo  Isliye C:\astro-app-dev\user-panel junction se start hota hai.
echo.

set "SRC=%~dp0"
set "DST=C:\astro-app-dev\user-panel"
if not exist "C:\astro-app-dev" mkdir "C:\astro-app-dev"
if not exist "%DST%\package.json" (
  if exist "%DST%" rmdir "%DST%" >nul 2>&1
  mklink /J "%DST%" "%SRC%"
)

if exist "%DST%\package.json" (
  cd /d "%DST%"
) else (
  cd /d "%SRC%"
)

if exist "scripts\patch-metro-onedrive.js" call node scripts\patch-metro-onedrive.js
call npm run phone
pause
