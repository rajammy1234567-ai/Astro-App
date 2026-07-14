@echo off
:: Run as Administrator - opens ports so Expo Go can reach packager
net session >nul 2>&1
if %errorLevel% neq 0 (
  echo Requesting Administrator rights...
  powershell -Command "Start-Process '%~f0' -Verb RunAs"
  exit /b
)

echo Adding firewall rules for AstroTalk Expo...
netsh advfirewall firewall delete rule name="AstroTalk API 5000" >nul 2>&1
netsh advfirewall firewall delete rule name="AstroTalk Expo 8081" >nul 2>&1
netsh advfirewall firewall delete rule name="AstroTalk Expo 8082" >nul 2>&1
netsh advfirewall firewall delete rule name="AstroTalk Expo 8083" >nul 2>&1

netsh advfirewall firewall add rule name="AstroTalk API 5000" dir=in action=allow protocol=TCP localport=5000
netsh advfirewall firewall add rule name="AstroTalk Expo 8081" dir=in action=allow protocol=TCP localport=8081
netsh advfirewall firewall add rule name="AstroTalk Expo 8082" dir=in action=allow protocol=TCP localport=8082
netsh advfirewall firewall add rule name="AstroTalk Expo 8083" dir=in action=allow protocol=TCP localport=8083

echo.
echo DONE. Ab FIX-EXPO-NOW.bat chalao.
pause
