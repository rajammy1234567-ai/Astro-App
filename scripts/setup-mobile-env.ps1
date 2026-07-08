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

# Windows Firewall — allow phone to reach API + Expo Metro ports
$ports = @(
  @{ Name = "Astro App API Port 5000"; Port = 5000 },
  @{ Name = "Astro User Expo Port 8081"; Port = 8081 },
  @{ Name = "Astro Admin Expo Port 8082"; Port = 8082 },
  @{ Name = "Astro Panel Expo Port 8083"; Port = 8083 }
)

foreach ($entry in $ports) {
  $existing = Get-NetFirewallRule -DisplayName $entry.Name -ErrorAction SilentlyContinue
  if (-not $existing) {
    try {
      New-NetFirewallRule -DisplayName $entry.Name -Direction Inbound -Protocol TCP -LocalPort $entry.Port -Action Allow | Out-Null
      Write-Host "  Firewall rule added for port $($entry.Port)" -ForegroundColor Cyan
    } catch {
      Write-Host "  Firewall rule skipped for port $($entry.Port) (run as Admin)" -ForegroundColor Yellow
    }
  }
}

Write-Host "`nDone! Ab ye chalao:" -ForegroundColor Yellow
Write-Host "  cd server && npm run dev" -ForegroundColor White
Write-Host "  cd user-panel && npx expo start -c" -ForegroundColor White
Write-Host "`nPhone aur PC same WiFi par hone chahiye." -ForegroundColor Yellow