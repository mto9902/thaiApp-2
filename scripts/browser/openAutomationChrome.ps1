$Port = if ($env:CHROME_CDP_PORT) { [int]$env:CHROME_CDP_PORT } else { 9333 }
$ProfilePath = Join-Path $env:USERPROFILE ".codex-browser\gmail-profile"

New-Item -ItemType Directory -Force -Path $ProfilePath | Out-Null

$existingListener = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
  Where-Object { $_.LocalPort -eq $Port } |
  Select-Object -First 1

if ($existingListener) {
  Write-Host "A browser is already listening on port $Port."
  Write-Host "CDP endpoint: http://127.0.0.1:$Port"
  Write-Host "Profile path: $ProfilePath"
  exit 0
}

$chromeCandidates = @(
  "C:\Program Files\Google\Chrome\Application\chrome.exe",
  "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
)

$chromePath = $chromeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $chromePath) {
  throw "Chrome executable not found."
}

Start-Process -FilePath $chromePath -ArgumentList @(
  "--remote-debugging-port=$Port",
  "--user-data-dir=$ProfilePath",
  "--new-window",
  "https://mail.google.com/mail/u/0/#inbox"
)

Start-Sleep -Seconds 3

try {
  $version = Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:$Port/json/version" -TimeoutSec 5
  Write-Host "Automation browser launched."
  Write-Host "CDP endpoint: http://127.0.0.1:$Port"
  Write-Host "Profile path: $ProfilePath"
  Write-Host $version.Content
} catch {
  Write-Host "Chrome launched, but the CDP endpoint is not reachable yet."
  Write-Host "Profile path: $ProfilePath"
}
