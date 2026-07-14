@echo off
title Safe Git Commit (OneDrive-friendly)
color 0A
cd /d "%~dp0"

echo.
echo  ================================================
echo   SAFE GIT COMMIT - OneDrive lock fix
echo  ================================================
echo.
echo  Tip: Commit se pehle OneDrive tray icon pe
echo  right-click -^> Pause syncing -^> 2 hours
echo  (optional but best)
echo.

if "%~1"=="" (
  set /p MSG=Commit message: 
) else (
  set MSG=%*
)

if "%MSG%"=="" (
  echo Message empty. Cancelled.
  pause
  exit /b 1
)

echo.
echo [1] Applying OneDrive-safe git settings...
git config core.autocrlf true
git config core.longpaths true
git config gc.auto 0
git config gc.autoDetach false
git config pack.threads 1
git config core.fsync object-files false

echo [2] Staging all changes...
git add -A
if errorlevel 1 (
  echo git add failed. OneDrive sync pause karke dubara try.
  pause
  exit /b 1
)

echo [3] Commit...
git -c core.fsync=none commit -m "%MSG%"
if errorlevel 1 (
  echo.
  echo Commit fail / unlink warning?
  echo 1. OneDrive Pause syncing
  echo 2. Dubara yeh bat chalao
  echo 3. Unlink prompt aaye to "n" dabao - aksar commit pehle hi ho chuka hota hai
  echo.
  git status
  pause
  exit /b 1
)

echo.
echo [4] Done.
git status
git log -1 --oneline
echo.
echo Push: git push
echo.
pause
