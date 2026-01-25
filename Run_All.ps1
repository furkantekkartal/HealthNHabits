# Diet Tracker - Master Control Script
# Starts Master and Dev environments and sets up Cloudflare tunnels automatically

$ErrorActionPreference = "Stop"

# ========================================
# Helper Functions (defined first)
# ========================================

# Function to kill processes by port
function Stop-ProcessByPort {
    param([int]$Port)
    
    $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($connections) {
        foreach ($conn in $connections) {
            $processId = $conn.OwningProcess
            if ($processId) {
                try {
                    $proc = Get-Process -Id $processId -ErrorAction SilentlyContinue
                    if ($proc) {
                        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                        Write-Host "  Killed process $processId on port $Port" -ForegroundColor Gray
                    }
                } catch {
                    # Ignore errors
                }
            }
        }
    }
}

# Function to check if port is free
function Test-PortFree {
    param([int]$Port)
    
    $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    return (-not $connections)
}

# Function to stop all processes
function Stop-AllProcesses {
    param($ProcessesDict)
    
    Write-Host ""
    Write-Host "Stopping all processes..." -ForegroundColor Yellow
    
    # Kill processes by port first
    Write-Host "Killing processes by port..." -ForegroundColor Gray
    Stop-ProcessByPort -Port 5040
    Stop-ProcessByPort -Port 3040
    Stop-ProcessByPort -Port 5050
    Stop-ProcessByPort -Port 3050
    
    # Kill tracked processes
    foreach ($key in $ProcessesDict.Keys) {
        if ($ProcessesDict[$key] -and -not $ProcessesDict[$key].HasExited) {
            try {
                # Kill the process and all its children
                Stop-Process -Id $ProcessesDict[$key].Id -Force -ErrorAction SilentlyContinue
                Write-Host "  Stopped: $key" -ForegroundColor Gray
            } catch {
                Write-Host "  Could not stop: $key" -ForegroundColor Red
            }
        }
    }
    
    Write-Host "✅ All processes stopped" -ForegroundColor Green
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
Write-Host "  1. Start Master environment (ports 5040, 3040)" -ForegroundColor White
Write-Host "  2. Start Development environment (ports 5050, 3050)" -ForegroundColor White
Write-Host "  3. Set up Cloudflare tunnels for both" -ForegroundColor White
Write-Host "  4. Restart environments with Cloudflare URLs" -ForegroundColor White
Write-Host "  5. Show summary of all URLs" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop all environments and tunnels" -ForegroundColor Gray
Write-Host ""
Write-Host "Press any key to start..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$cloudflareFile = Join-Path $scriptDir ".env.cloudflare"

Write-Host ""
Write-Host "Checking for existing processes on ports..." -ForegroundColor Yellow
$portsToCheck = @(5040, 3040, 5050, 3050)
$foundProcesses = $false
foreach ($port in $portsToCheck) {
    if (-not (Test-PortFree -Port $port)) {
        Write-Host "  Port $port is in use, killing processes..." -ForegroundColor Gray
        Stop-ProcessByPort -Port $port
        $foundProcesses = $true
    }
}
if ($foundProcesses) {
    Write-Host "Waiting 3 seconds for ports to be released..." -ForegroundColor Gray
    Start-Sleep -Seconds 3
} else {
    Write-Host "✅ All ports are free" -ForegroundColor Green
}
Write-Host ""

# Track all processes
$processes = @{
    MasterBackend = $null
    MasterFrontend = $null
    DevBackend = $null
    DevFrontend = $null
    MasterBackendTunnel = $null
    MasterFrontendTunnel = $null
    DevBackendTunnel = $null
    DevFrontendTunnel = $null
}

# Register cleanup on exit
Register-EngineEvent PowerShell.Exiting -Action { Stop-AllProcesses -ProcessesDict $processes } | Out-Null

# Trap Ctrl+C
$null = Register-ObjectEvent -InputObject ([System.Console]) -EventName CancelKeyPress -Action {
    Stop-AllProcesses -ProcessesDict $processes
    exit
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 1: Starting Master Environment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start Master Backend
Write-Host "Starting Master Backend (port 5040)..." -ForegroundColor Green
$processes.MasterBackend = Start-Process powershell -ArgumentList "-NoProfile", "-NoExit", "-Command", "cd '$scriptDir\backend'; Write-Host 'Master Backend - Port 5040' -ForegroundColor Cyan; npm run start:master" -PassThru
Start-Sleep -Seconds 3

# Start Master Frontend
Write-Host "Starting Master Frontend (port 3040)..." -ForegroundColor Green
$processes.MasterFrontend = Start-Process powershell -ArgumentList "-NoProfile", "-NoExit", "-Command", "cd '$scriptDir\frontend'; Write-Host 'Master Frontend - Port 3040' -ForegroundColor Cyan; npm run start:master" -PassThru
Start-Sleep -Seconds 3

Write-Host "✅ Master environment started" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 2: Starting Development Environment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start Dev Backend
Write-Host "Starting Development Backend (port 5050)..." -ForegroundColor Green
$processes.DevBackend = Start-Process powershell -ArgumentList "-NoProfile", "-NoExit", "-Command", "cd '$scriptDir\backend'; Write-Host 'Development Backend - Port 5050' -ForegroundColor Cyan; npm run start:dev" -PassThru
Start-Sleep -Seconds 3

# Start Dev Frontend
Write-Host "Starting Development Frontend (port 3050)..." -ForegroundColor Green
$processes.DevFrontend = Start-Process powershell -ArgumentList "-NoProfile", "-NoExit", "-Command", "cd '$scriptDir\frontend'; Write-Host 'Development Frontend - Port 3050' -ForegroundColor Cyan; npm run start:dev" -PassThru
Start-Sleep -Seconds 3

Write-Host "✅ Development environment started" -ForegroundColor Green
Write-Host ""

Write-Host "Waiting for servers to be ready (15 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 3: Setting up Cloudflare Tunnels" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to start tunnel and extract URL
function Start-TunnelAndGetURL {
    param(
        [string]$Name,
        [int]$Port,
        [string]$Type
    )
    
    Write-Host "Starting $Name tunnel (port $Port)..." -ForegroundColor Cyan
    
    # Create temp files for output
    $outputFile = Join-Path $env:TEMP "cloudflare_${Type}_out.log"
    $errorFile = Join-Path $env:TEMP "cloudflare_${Type}_err.log"
    
    # Start cloudflared process
    $process = Start-Process -FilePath "cloudflared" `
        -ArgumentList "tunnel", "--url", "http://localhost:$Port" `
        -NoNewWindow `
        -PassThru `
        -RedirectStandardOutput $outputFile `
        -RedirectStandardError $errorFile
    
    # Wait for tunnel to start and output URL
    $url = $null
    $maxWait = 20
    $elapsed = 0
    
    Write-Host "  Waiting for URL (up to $maxWait seconds)..." -ForegroundColor Gray
    
    while ($elapsed -lt $maxWait -and -not $url) {
        Start-Sleep -Seconds 1
        $elapsed++
        
        # Check error file first (cloudflared outputs URLs to stderr)
        if (Test-Path $errorFile) {
            $content = Get-Content $errorFile -Raw -ErrorAction SilentlyContinue
            if ($content) {
                if ($content -match 'https://[a-zA-Z0-9\-]+\.trycloudflare\.com') {
                    $url = $matches[0].Trim()
                    break
                }
            }
        }
        
        # Also check output file
        if (Test-Path $outputFile) {
            $content = Get-Content $outputFile -Raw -ErrorAction SilentlyContinue
            if ($content) {
                if ($content -match 'https://[a-zA-Z0-9\-]+\.trycloudflare\.com') {
                    $url = $matches[0].Trim()
                    break
                }
            }
        }
        
        # Check if process exited
        if ($process.HasExited) {
            Write-Host "  ⚠️  Process exited unexpectedly" -ForegroundColor Yellow
            break
        }
    }
    
    if ($url) {
        Write-Host "  ✅ Got URL: $url" -ForegroundColor Green
        return @{
            Process = $process
            URL = $url
            OutputFile = $outputFile
            ErrorFile = $errorFile
        }
    } else {
        Write-Host "  ⚠️  Could not extract URL automatically" -ForegroundColor Yellow
        return @{
            Process = $process
            URL = $null
            OutputFile = $outputFile
            ErrorFile = $errorFile
        }
    }
}

# Start all 4 tunnels
$masterBackend = Start-TunnelAndGetURL -Name "Master Backend" -Port 5040 -Type "master_backend"
$processes.MasterBackendTunnel = $masterBackend.Process
Start-Sleep -Seconds 2

$masterFrontend = Start-TunnelAndGetURL -Name "Master Frontend" -Port 3040 -Type "master_frontend"
$processes.MasterFrontendTunnel = $masterFrontend.Process
Start-Sleep -Seconds 2

$devBackend = Start-TunnelAndGetURL -Name "Development Backend" -Port 5050 -Type "dev_backend"
$processes.DevBackendTunnel = $devBackend.Process
Start-Sleep -Seconds 2

$devFrontend = Start-TunnelAndGetURL -Name "Development Frontend" -Port 3050 -Type "dev_frontend"
$processes.DevFrontendTunnel = $devFrontend.Process

Write-Host ""
Write-Host "Waiting a bit more for any remaining URLs..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Try extracting URLs one more time
function TryExtractURLFromFiles {
    param($OutputFile, $ErrorFile)
    if (Test-Path $ErrorFile) {
        $content = Get-Content $ErrorFile -Raw -ErrorAction SilentlyContinue
        if ($content -match 'https://[a-zA-Z0-9\-]+\.trycloudflare\.com') {
            return $matches[0].Trim()
        }
    }
    if (Test-Path $OutputFile) {
        $content = Get-Content $OutputFile -Raw -ErrorAction SilentlyContinue
        if ($content -match 'https://[a-zA-Z0-9\-]+\.trycloudflare\.com') {
            return $matches[0].Trim()
        }
    }
    return $null
}

# Retry URL extraction
if (-not $masterBackend.URL) {
    $masterBackend.URL = TryExtractURLFromFiles -OutputFile $masterBackend.OutputFile -ErrorFile $masterBackend.ErrorFile
}
if (-not $masterFrontend.URL) {
    $masterFrontend.URL = TryExtractURLFromFiles -OutputFile $masterFrontend.OutputFile -ErrorFile $masterFrontend.ErrorFile
}
if (-not $devBackend.URL) {
    $devBackend.URL = TryExtractURLFromFiles -OutputFile $devBackend.OutputFile -ErrorFile $devBackend.ErrorFile
}
if (-not $devFrontend.URL) {
    $devFrontend.URL = TryExtractURLFromFiles -OutputFile $devFrontend.OutputFile -ErrorFile $devFrontend.ErrorFile
}

# Prompt for missing URLs
if (-not $masterBackend.URL) {
    Write-Host "Master Backend URL not found automatically" -ForegroundColor Yellow
    $masterBackend.URL = Read-Host "Please enter Master Backend URL"
}
if (-not $masterFrontend.URL) {
    Write-Host "Master Frontend URL not found automatically" -ForegroundColor Yellow
    $masterFrontend.URL = Read-Host "Please enter Master Frontend URL"
}
if (-not $devBackend.URL) {
    Write-Host "Development Backend URL not found automatically" -ForegroundColor Yellow
    $devBackend.URL = Read-Host "Please enter Development Backend URL"
}
if (-not $devFrontend.URL) {
    Write-Host "Development Frontend URL not found automatically" -ForegroundColor Yellow
    $devFrontend.URL = Read-Host "Please enter Development Frontend URL"
}

# Remove trailing slashes
$masterBackend.URL = $masterBackend.URL.TrimEnd('/')
$masterFrontend.URL = $masterFrontend.URL.TrimEnd('/')
$devBackend.URL = $devBackend.URL.TrimEnd('/')
$devFrontend.URL = $devFrontend.URL.TrimEnd('/')

Write-Host ""
Write-Host "Updating .env.cloudflare file..." -ForegroundColor Yellow

# Update .env.cloudflare file
@"
# Cloudflare Tunnel URLs
# Updated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# Tunnels are running in background

# Master Environment
master_Backend=$($masterBackend.URL)
master_frontend=$($masterFrontend.URL)

# Development Environment
development_Backend=$($devBackend.URL)
development_frontend=$($devFrontend.URL)
"@ | Out-File -FilePath $cloudflareFile -Encoding UTF8

Write-Host "✅ Updated .env.cloudflare file!" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 4: Restarting Environments with Cloudflare URLs" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Stopping Master & Dev environments..." -ForegroundColor Yellow

# Kill processes by port (this catches Node.js processes running inside PowerShell windows)
Write-Host "Killing processes on ports 5040, 3040, 5050, 3050..." -ForegroundColor Gray
Stop-ProcessByPort -Port 5040
Stop-ProcessByPort -Port 3040
Stop-ProcessByPort -Port 5050
Stop-ProcessByPort -Port 3050

# Also kill the PowerShell processes
if ($processes.MasterBackend -and -not $processes.MasterBackend.HasExited) {
    try {
        Stop-Process -Id $processes.MasterBackend.Id -Force -ErrorAction SilentlyContinue
    } catch {}
}
if ($processes.MasterFrontend -and -not $processes.MasterFrontend.HasExited) {
    try {
        Stop-Process -Id $processes.MasterFrontend.Id -Force -ErrorAction SilentlyContinue
    } catch {}
}
if ($processes.DevBackend -and -not $processes.DevBackend.HasExited) {
    try {
        Stop-Process -Id $processes.DevBackend.Id -Force -ErrorAction SilentlyContinue
    } catch {}
}
if ($processes.DevFrontend -and -not $processes.DevFrontend.HasExited) {
    try {
        Stop-Process -Id $processes.DevFrontend.Id -Force -ErrorAction SilentlyContinue
    } catch {}
}

Write-Host "Waiting for ports to be free..." -ForegroundColor Gray
$maxWait = 10
$waited = 0
while ($waited -lt $maxWait) {
    $allFree = (Test-PortFree -Port 5040) -and (Test-PortFree -Port 3040) -and (Test-PortFree -Port 5050) -and (Test-PortFree -Port 3050)
    if ($allFree) {
        break
    }
    Start-Sleep -Seconds 1
    $waited++
}

if (-not $allFree) {
    Write-Host "⚠️  Some ports may still be in use, but continuing anyway..." -ForegroundColor Yellow
} else {
    Write-Host "✅ All ports are free" -ForegroundColor Green
}

Write-Host "Restarting Master environment with Cloudflare URLs..." -ForegroundColor Green
$processes.MasterBackend = Start-Process powershell -ArgumentList "-NoProfile", "-NoExit", "-Command", "cd '$scriptDir\backend'; Write-Host 'Master Backend - Port 5040' -ForegroundColor Cyan; npm run start:master" -PassThru
Start-Sleep -Seconds 2
$processes.MasterFrontend = Start-Process powershell -ArgumentList "-NoProfile", "-NoExit", "-Command", "cd '$scriptDir\frontend'; Write-Host 'Master Frontend - Port 3040' -ForegroundColor Cyan; npm run start:master" -PassThru
Start-Sleep -Seconds 2

Write-Host "Restarting Development environment with Cloudflare URLs..." -ForegroundColor Green
$processes.DevBackend = Start-Process powershell -ArgumentList "-NoProfile", "-NoExit", "-Command", "cd '$scriptDir\backend'; Write-Host 'Development Backend - Port 5050' -ForegroundColor Cyan; npm run start:dev" -PassThru
Start-Sleep -Seconds 2
$processes.DevFrontend = Start-Process powershell -ArgumentList "-NoProfile", "-NoExit", "-Command", "cd '$scriptDir\frontend'; Write-Host 'Development Frontend - Port 3050' -ForegroundColor Cyan; npm run start:dev" -PassThru
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SUMMARY - All Environments Running" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "MASTER ENVIRONMENT:" -ForegroundColor Yellow
Write-Host "  Backend:  $($masterBackend.URL)" -ForegroundColor White
Write-Host "  Frontend: $($masterFrontend.URL)" -ForegroundColor White
Write-Host ""
Write-Host "DEVELOPMENT ENVIRONMENT:" -ForegroundColor Yellow
Write-Host "  Backend:  $($devBackend.URL)" -ForegroundColor White
Write-Host "  Frontend: $($devFrontend.URL)" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ All environments are running!" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop all environments and tunnels" -ForegroundColor Gray
Write-Host ""

# Keep script running to maintain tunnels
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    Stop-AllProcesses -ProcessesDict $processes
}
