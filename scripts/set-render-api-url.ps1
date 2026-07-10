# Sets Render API URL into all three Expo apps (eas.json + .env)
# Usage:
#   .\scripts\set-render-api-url.ps1 -ApiUrl "https://astro-app-ru1d.onrender.com/api"

param(
  [Parameter(Mandatory = $true)]
  [string]$ApiUrl
)

$ApiUrl = $ApiUrl.Trim().TrimEnd('/')
if ($ApiUrl -notmatch '^https?://') {
  Write-Error "ApiUrl must start with https://  Example: https://your-service.onrender.com/api"
  exit 1
}
if ($ApiUrl -notmatch '/api$') {
  $ApiUrl = "$ApiUrl/api"
  Write-Host "Appended /api -> $ApiUrl"
}

$root = Split-Path -Parent $PSScriptRoot
$apps = @('user-panel', 'admin-app', 'astro-app')

foreach ($app in $apps) {
  $easPath = Join-Path $root "$app\eas.json"
  $envPath = Join-Path $root "$app\.env"

  if (Test-Path $easPath) {
    $raw = Get-Content $easPath -Raw
    $raw = $raw -replace '"EXPO_PUBLIC_API_URL"\s*:\s*"[^"]*"', ("`"EXPO_PUBLIC_API_URL`": `"$ApiUrl`"")
    Set-Content -Path $easPath -Value $raw -Encoding utf8
    Write-Host "OK eas.json -> $app"
  }

  Set-Content -Path $envPath -Value "EXPO_PUBLIC_API_URL=$ApiUrl" -Encoding utf8
  Write-Host "OK .env -> $app"
}

Write-Host ""
Write-Host "Done. API URL: $ApiUrl"
Write-Host "1) Open: $ApiUrl/health"
Write-Host "2) Rebuild APK (old APK will still have old URL):"
Write-Host "   cd user-panel; eas build --platform android --profile preview"
