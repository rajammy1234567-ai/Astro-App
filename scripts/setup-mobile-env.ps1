# Auto-set EXPO_PUBLIC_API_URL for all mobile apps using PC LAN IP
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
  $_.InterfaceAlias -notmatch 'Loopback|vEthernet|WSL' -and $_.IPAddress -notmatch '^169\.'
} | Select-Object -First 1).IPAddress

if (-not $ip) {
  Write-Host "Could not detect LAN IP. Run: ipconfig" -ForegroundColor Red
  exit 1
}

$apiUrl = "http://${ip}:5000/api"
Write-Host "Detected PC IP: $ip" -ForegroundColor Green
Write-Host "API URL: $apiUrl" -ForegroundColor Green

$apps = @("user-panel", "admin-app", "astro-app")
foreach ($app in $apps) {
  $envFile = Join-Path $PSScriptRoot "..\$app\.env"
  $content = "EXPO_PUBLIC_API_URL=$apiUrl`n"
  Set-Content -Path $envFile -Value $content -Encoding UTF8
  Write-Host "  Updated $app/.env" -ForegroundColor Cyan
}

# Windows Firewall — allow phone to reach port 5000
$ruleName = "Astro App API Port 5000"
$existing = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
if (-not $existing) {
  New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Protocol TCP -LocalPort 5000 -Action Allow | Out-Null
  Write-Host "  Firewall rule added for port 5000" -ForegroundColor Cyan
}

Write-Host "`nDone! Ab ye chalao:" -ForegroundColor Yellow
Write-Host "  cd server && npm run dev" -ForegroundColor White
Write-Host "  cd user-panel && npx expo start -c" -ForegroundColor White
Write-Host "`nPhone aur PC same WiFi par hone chahiye." -ForegroundColor Yellow