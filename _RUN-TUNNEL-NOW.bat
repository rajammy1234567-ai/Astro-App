@echo off
title AstroTalk User - Expo TUNNEL FIX
cd /d "C:\Users\hi\OneDrive\all app\Astro-App\user-panel"
set REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.3
set EXPO_NO_TELEMETRY=1
echo.
echo  Starting Expo TUNNEL on port 8081...
echo  Phone + PC both need internet.
echo  Wait for QR / exp.direct URL then scan in Expo Go.
echo.
call npx expo start -c --clear --tunnel --port 8081
pause
