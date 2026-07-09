# Auto-set EXPO_PUBLIC_API_URL + packager host for all mobile apps (current PC LAN IP)
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
  $_.InterfaceAlias -match 'Wi-Fi|Ethernet|WLAN' -and
  $_.IPAddress -notmatch '^127\.' -and
  $_.IPAddress -notmatch '^169\.'
} | Select-Object -First 1).IPAddress

if (-not $ip) {
  $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.InterfaceAlias -notmatch 'Loopback|vEthernet|WSL|Virtual' -and
    $_.IPAddress -notmatch '^127\.' -and
    $_.IPAddress -notmatch '^169\.'
  } | Select-Object -First 1).IPAddress
}

if (-not $ip) {
  Write-Host "Could not detect LAN IP. Run: ipconfig" -ForegroundColor Red
  exit 1
}

$apiUrl = "http://${ip}:5000/api"
Write-Host "Detected PC IP: $ip" -ForegroundColor Green
Write-Host "API URL: $apiUrl" -ForegroundColor Green
Write-Host "Packager host: $ip" -ForegroundColor Green

$apps = @("user-panel", "admin-app", "astro-app")
foreach ($app in $apps) {
  $appDir = Join-Path $PSScriptRoot "..\$app"
  # Expo 57: only EXPO_PUBLIC_* may live in .env
  Set-Content -Path (Join-Path $appDir ".env") -Value "EXPO_PUBLIC_API_URL=$apiUrl" -Encoding ascii
  # Personal vars (packager host) must be in .env.local
  Set-Content -Path (Join-Path $appDir ".env.local") -Value "REACT_NATIVE_PACKAGER_HOSTNAME=$ip" -Encoding ascii
  Write-Host "  Updated $app/.env + .env.local" -ForegroundColor Cyan
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