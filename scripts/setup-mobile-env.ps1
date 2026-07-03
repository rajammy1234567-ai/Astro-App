# Auto-set EXPO_PUBLIC_API_URL for all 3 apps using PC LAN IP
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

$apps = @("client", "admin-app", "astro-app")
foreach ($app in $apps) {
  $envFile = Join-Path $PSScriptRoot "..\$app\.env"
  $content = "EXPO_PUBLIC_API_URL=$apiUrl`n"
  Set-Content -Path $envFile -Value $content -Encoding UTF8
  Write-Host "  Updated $app/.env" -ForegroundColor Cyan
}

Write-Host "`nDone! Ab server + expo start karo." -ForegroundColor Yellow
Write-Host "  npm run server" -ForegroundColor White
Write-Host "  npm run user:dev   (port 8081)" -ForegroundColor White
Write-Host "  npm run admin:dev  (port 8082)" -ForegroundColor White
Write-Host "  npm run astro:dev  (port 8083)" -ForegroundColor White