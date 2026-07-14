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

$defaultAgora = "2c03c2d61d6f4fdcba986cadf6fa0023"
$apps = @("user-panel", "admin-app", "astro-app")
foreach ($app in $apps) {
  $appDir = Join-Path $PSScriptRoot "..\$app"
  if (-not (Test-Path $appDir)) { continue }

  # Preserve existing AGORA id if present
  $agora = $defaultAgora
  $envPath = Join-Path $appDir ".env"
  if (Test-Path $envPath) {
    $prev = Get-Content $envPath -Raw
    if ($prev -match 'EXPO_PUBLIC_AGORA_APP_ID=([^\r\n]+)') {
      $agora = $Matches[1].Trim()
    }
  }

  # Expo 57: only EXPO_PUBLIC_* may live in .env
  $envBody = @(
    "EXPO_PUBLIC_API_URL=$apiUrl"
    "EXPO_PUBLIC_AGORA_APP_ID=$agora"
  ) -join "`n"
  Set-Content -Path $envPath -Value $envBody -Encoding ascii

  # Personal vars (packager host) must be in .env.local
  Set-Content -Path (Join-Path $appDir ".env.local") -Value "REACT_NATIVE_PACKAGER_HOSTNAME=$ip" -Encoding ascii
  Write-Host "  Updated $app/.env + .env.local" -ForegroundColor Cyan
}

# Windows Firewall — allow phone to reach API + Expo Metro ports (needs Admin)
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
      New-NetFirewallRule -DisplayName $entry.Name -Direction Inbound -Protocol TCP -LocalPort $entry.Port -Action Allow -ErrorAction Stop | Out-Null
      Write-Host "  Firewall rule added for port $($entry.Port)" -ForegroundColor Cyan
    } catch {
      Write-Host "  Firewall port $($entry.Port): skip (Admin rights chahiye)" -ForegroundColor Yellow
    }
  }
}

Write-Host ""
Write-Host "Done! Next:" -ForegroundColor Yellow
Write-Host "  1) Double-click START-EVERYTHING.bat" -ForegroundColor White
Write-Host "  2) Phone pe Expo Go 57 install + SAME WiFi" -ForegroundColor White
Write-Host "  3) Scan QR ya open exp://$ip:8081" -ForegroundColor White
Write-Host ""
Write-Host "Note: Custom APK crash ho to Expo Go se chalao pehle." -ForegroundColor Yellow
