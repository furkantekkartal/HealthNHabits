# Diet Tracker - Master Control Script
# Starts Master and Dev environments and sets up Cloudflare tunnels automatically

$ErrorActionPreference = "Stop"

# ========================================
# Helper Functions
# ========================================

function Stop-ProcessByPort {
    param([int]$Port)
    $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($connections) {
        foreach ($conn in $connections) {
            $processId = $conn.OwningProcess
            if ($processId) {
                try {
                    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                    Write-Host "  Killed process $processId on port $Port" -ForegroundColor Gray
                } catch {}
            }
        }
    }
}

function Test-PortFree {
    param([int]$Port)
    $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    return (-not $connections)
}

function Stop-AllProcesses {
    param($ProcessesDict)
    Write-Host ""
    Write-Host "Stopping all processes..." -ForegroundColor Yellow
    Write-Host "Killing processes by port..." -ForegroundColor Gray
    Stop-ProcessByPort -Port 5040
    Stop-ProcessByPort -Port 3040
    Stop-ProcessByPort -Port 5050
    Stop-ProcessByPort -Port 3050
    foreach ($key in $ProcessesDict.Keys) {
        if ($ProcessesDict[$key] -and -not $ProcessesDict[$key].HasExited) {
            try {
                Stop-Process -Id $ProcessesDict[$key].Id -Force -ErrorAction SilentlyContinue
                Write-Host "  Stopped: $key" -ForegroundColor Gray
            } catch {}
        }
    }
    Write-Host "All processes stopped" -ForegroundColor Green
}

function Start-TunnelAndGetURL {
    param([string]$Name, [int]$Port, [string]$Type)
    Write-Host "Starting $Name tunnel (port $Port)..." -ForegroundColor Cyan
    $outputFile = Join-Path $env:TEMP "cloudflare_${Type}_out.log"
    $errorFile = Join-Path $env:TEMP "cloudflare_${Type}_err.log"
    $process = Start-Process -FilePath "cloudflared" -ArgumentList "tunnel", "--url", "http://localhost:$Port" -NoNewWindow -PassThru -RedirectStandardOutput $outputFile -RedirectStandardError $errorFile
    $url = $null
    $maxWait = 20
    $elapsed = 0
    Write-Host "  Waiting for URL..." -ForegroundColor Gray
    while ($elapsed -lt $maxWait -and -not $url) {
        Start-Sleep -Seconds 1
        $elapsed++
        if (Test-Path $errorFile) {
            $content = Get-Content $errorFile -Raw -ErrorAction SilentlyContinue
            if ($content -match 'https://[a-zA-Z0-9\-]+\.trycloudflare\.com') {
                $url = $matches[0].Trim()
                break
            }
        }
        if (Test-Path $outputFile) {
            $content = Get-Content $outputFile -Raw -ErrorAction SilentlyContinue
            if ($content -match 'https://[a-zA-Z0-9\-]+\.trycloudflare\.com') {
                $url = $matches[0].Trim()
                break
            }
        }
        if ($process.HasExited) { break }
    }
    if ($url) {
        Write-Host "  Got URL: $url" -ForegroundColor Green
    } else {
        Write-Host "  Could not get URL" -ForegroundColor Yellow
    }
    return @{ Process = $process; URL = $url; OutputFile = $outputFile; ErrorFile = $errorFile }
}

function TryExtractURLFromFiles {
    param($OutputFile, $ErrorFile)
    if (Test-Path $ErrorFile) {
        $content = Get-Content $ErrorFile -Raw -ErrorAction SilentlyContinue
        if ($content -match 'https://[a-zA-Z0-9\-]+\.trycloudflare\.com') { return $matches[0].Trim() }
    }
    if (Test-Path $OutputFile) {
        $content = Get-Content $OutputFile -Raw -ErrorAction SilentlyContinue
        if ($content -match 'https://[a-zA-Z0-9\-]+\.trycloudflare\.com') { return $matches[0].Trim() }
    }
    return $null
}

# ========================================
# Main Script
# ========================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Diet Tracker - Master Control" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This script will:" -ForegroundColor Yellow
Write-Host "  1. Start Master & Dev environments" -ForegroundColor White
Write-Host "  2. Set up Cloudflare tunnels (frontend + backend)" -ForegroundColor White
Write-Host "  3. Show all access URLs" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to start..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$cloudflareFile = Join-Path $scriptDir ".env.cloudflare"

# Kill existing processes
Write-Host ""
Write-Host "Checking for existing processes..." -ForegroundColor Yellow
$portsToCheck = @(5040, 3040, 5050, 3050)
foreach ($port in $portsToCheck) {
    if (-not (Test-PortFree -Port $port)) {
        Stop-ProcessByPort -Port $port
    }
}
Start-Sleep -Seconds 2

# Track all processes
$processes = @{}

# Register cleanup
$null = Register-ObjectEvent -InputObject ([System.Console]) -EventName CancelKeyPress -Action {
    Stop-AllProcesses -ProcessesDict $processes
    exit
}

# ========================================
# Step 1: Start Backends
# ========================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 1: Starting Backend Servers" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "Starting Master Backend (port 5040)..." -ForegroundColor Green
$processes.MasterBackend = Start-Process powershell -ArgumentList "-NoProfile", "-NoExit", "-Command", "cd '$scriptDir\backend'; Write-Host 'Master Backend - Port 5040' -ForegroundColor Cyan; npm run start:master" -PassThru
Start-Sleep -Seconds 2

Write-Host "Starting Dev Backend (port 5050)..." -ForegroundColor Green
$processes.DevBackend = Start-Process powershell -ArgumentList "-NoProfile", "-NoExit", "-Command", "cd '$scriptDir\backend'; Write-Host 'Dev Backend - Port 5050' -ForegroundColor Cyan; npm run start:dev" -PassThru
Start-Sleep -Seconds 5

# ========================================
# Step 2: Start Backend Tunnels
# ========================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 2: Creating Backend Tunnels" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$masterBackend = Start-TunnelAndGetURL -Name "Master Backend" -Port 5040 -Type "master_backend"
$processes.MasterBackendTunnel = $masterBackend.Process
Start-Sleep -Seconds 1

$devBackend = Start-TunnelAndGetURL -Name "Dev Backend" -Port 5050 -Type "dev_backend"
$processes.DevBackendTunnel = $devBackend.Process
Start-Sleep -Seconds 2

# Retry URL extraction
if (-not $masterBackend.URL) { $masterBackend.URL = TryExtractURLFromFiles -OutputFile $masterBackend.OutputFile -ErrorFile $masterBackend.ErrorFile }
if (-not $devBackend.URL) { $devBackend.URL = TryExtractURLFromFiles -OutputFile $devBackend.OutputFile -ErrorFile $devBackend.ErrorFile }

# Prompt if missing
if (-not $masterBackend.URL) { $masterBackend.URL = Read-Host "Enter Master Backend URL" }
if (-not $devBackend.URL) { $devBackend.URL = Read-Host "Enter Dev Backend URL" }

$masterBackend.URL = $masterBackend.URL.TrimEnd('/')
$devBackend.URL = $devBackend.URL.TrimEnd('/')

# ========================================
# Step 3: Start Frontends with Cloudflare API URLs
# ========================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 3: Starting Frontends" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$masterApiUrl = "$($masterBackend.URL)/api"
$devApiUrl = "$($devBackend.URL)/api"

Write-Host "Starting Master Frontend (port 3040)..." -ForegroundColor Green
Write-Host "  API URL: $masterApiUrl" -ForegroundColor Gray
$processes.MasterFrontend = Start-Process powershell -ArgumentList "-NoProfile", "-NoExit", "-Command", "cd '$scriptDir\frontend'; Write-Host 'Master Frontend - Port 3040' -ForegroundColor Cyan; `$env:VITE_API_URL='$masterApiUrl'; npm run dev:master" -PassThru
Start-Sleep -Seconds 2

Write-Host "Starting Dev Frontend (port 3050)..." -ForegroundColor Green
Write-Host "  API URL: $devApiUrl" -ForegroundColor Gray
$processes.DevFrontend = Start-Process powershell -ArgumentList "-NoProfile", "-NoExit", "-Command", "cd '$scriptDir\frontend'; Write-Host 'Dev Frontend - Port 3050' -ForegroundColor Cyan; `$env:VITE_API_URL='$devApiUrl'; npm run dev:dev" -PassThru
Start-Sleep -Seconds 5

# ========================================
# Step 4: Create Frontend Tunnels
# ========================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 4: Creating Frontend Tunnels" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$masterFrontend = Start-TunnelAndGetURL -Name "Master Frontend" -Port 3040 -Type "master_frontend"
$processes.MasterFrontendTunnel = $masterFrontend.Process
Start-Sleep -Seconds 1

$devFrontend = Start-TunnelAndGetURL -Name "Dev Frontend" -Port 3050 -Type "dev_frontend"
$processes.DevFrontendTunnel = $devFrontend.Process
Start-Sleep -Seconds 2

# Retry URL extraction
if (-not $masterFrontend.URL) { $masterFrontend.URL = TryExtractURLFromFiles -OutputFile $masterFrontend.OutputFile -ErrorFile $masterFrontend.ErrorFile }
if (-not $devFrontend.URL) { $devFrontend.URL = TryExtractURLFromFiles -OutputFile $devFrontend.OutputFile -ErrorFile $devFrontend.ErrorFile }

# Prompt if missing
if (-not $masterFrontend.URL) { $masterFrontend.URL = Read-Host "Enter Master Frontend URL" }
if (-not $devFrontend.URL) { $devFrontend.URL = Read-Host "Enter Dev Frontend URL" }

$masterFrontend.URL = $masterFrontend.URL.TrimEnd('/')
$devFrontend.URL = $devFrontend.URL.TrimEnd('/')

# Update .env.cloudflare
$cloudflareContent = @"
# Cloudflare Tunnel URLs - $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

# Master
master_Backend=$($masterBackend.URL)
master_Frontend=$($masterFrontend.URL)

# Development
dev_Backend=$($devBackend.URL)
dev_Frontend=$($devFrontend.URL)
"@
$cloudflareContent | Out-File -FilePath $cloudflareFile -Encoding UTF8

# Get local IP
$localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -notlike "169.*" } | Select-Object -First 1).IPAddress

# ========================================
# Summary
# ========================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ALL ENVIRONMENTS RUNNING" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "EXTERNAL ACCESS (from anywhere):" -ForegroundColor Yellow
Write-Host "  MASTER: $($masterFrontend.URL)" -ForegroundColor Green
Write-Host "  DEV:    $($devFrontend.URL)" -ForegroundColor Cyan
Write-Host ""
Write-Host "LOCAL NETWORK (same WiFi):" -ForegroundColor Yellow
Write-Host "  MASTER: http://${localIP}:3040" -ForegroundColor Green
Write-Host "  DEV:    http://${localIP}:3050" -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop everything" -ForegroundColor Gray

# Keep running
try {
    while ($true) { Start-Sleep -Seconds 1 }
} finally {
    Stop-AllProcesses -ProcessesDict $processes
}
