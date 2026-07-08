@echo off
title AstroTalk - User Panel
color 0A
echo.
echo  ================================================
echo   AstroTalk User Panel Start
echo  ================================================
echo.
cd /d "%~dp0user-panel"
call npm run phone
pause