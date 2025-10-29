# AfriDiag Installation Script for Rural Hospitals
# This script installs Docker Desktop and AfriDiag application

param(
    [switch]$SkipDockerInstall,
    [string]$InstallPath = "C:\AfriDiag"
)

Write-Host "=== AfriDiag Installation for Rural Hospitals ===" -ForegroundColor Green
Write-Host "This will install the complete AfriDiag medical diagnosis system" -ForegroundColor Yellow

# Check if running as administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "This script requires administrator privileges. Please run as administrator." -ForegroundColor Red
    exit 1
}

# Function to check if Docker is installed
function Test-DockerInstalled {
    try {
        $dockerVersion = docker --version 2>$null
        return $dockerVersion -ne $null
    }
    catch {
        return $false
    }
}

# Function to install Docker Desktop
function Install-DockerDesktop {
    Write-Host "Installing Docker Desktop..." -ForegroundColor Yellow
    
    $dockerUrl = "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe"
    $dockerInstaller = "$env:TEMP\DockerDesktopInstaller.exe"
    
    try {
        Write-Host "Downloading Docker Desktop..."
        Invoke-WebRequest -Uri $dockerUrl -OutFile $dockerInstaller
        
        Write-Host "Installing Docker Desktop (this may take several minutes)..."
        Start-Process -FilePath $dockerInstaller -ArgumentList "install", "--quiet" -Wait
        
        Write-Host "Docker Desktop installed successfully!" -ForegroundColor Green
        Write-Host "Please restart your computer and run this script again." -ForegroundColor Yellow
        exit 0
    }
    catch {
        Write-Host "Failed to install Docker Desktop: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# Check Docker installation
if (-not $SkipDockerInstall) {
    if (-not (Test-DockerInstalled)) {
        Write-Host "Docker is not installed. Installing Docker Desktop..." -ForegroundColor Yellow
        Install-DockerDesktop
    } else {
        Write-Host "Docker is already installed." -ForegroundColor Green
    }
}

# Create installation directory
Write-Host "Creating installation directory: $InstallPath" -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $InstallPath | Out-Null

# Copy AfriDiag files
Write-Host "Copying AfriDiag application files..." -ForegroundColor Yellow
$sourceDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Copy-Item -Path "$sourceDir\*" -Destination $InstallPath -Recurse -Force

# Build Docker image
Write-Host "Building AfriDiag Docker image..." -ForegroundColor Yellow
Set-Location $InstallPath
docker build -t afridiag:latest .

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to build Docker image" -ForegroundColor Red
    exit 1
}

# Create desktop shortcuts
Write-Host "Creating desktop shortcuts..." -ForegroundColor Green
$WshShell = New-Object -comObject WScript.Shell

# AfriDiag Start shortcut
$Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\Start AfriDiag.lnk")
$Shortcut.TargetPath = "$InstallPath\scripts\start-afridiag.bat"
$Shortcut.WorkingDirectory = $InstallPath
$Shortcut.IconLocation = "shell32.dll,21"
$Shortcut.Description = "Start AfriDiag Rural Hospital Edition"
$Shortcut.Save()

# AfriDiag Stop shortcut
$Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\Stop AfriDiag.lnk")
$Shortcut.TargetPath = "$InstallPath\scripts\stop-afridiag.bat"
$Shortcut.WorkingDirectory = $InstallPath
$Shortcut.IconLocation = "shell32.dll,131"
$Shortcut.Description = "Stop AfriDiag Rural Hospital Edition"
$Shortcut.Save()

# AfriDiag Status Check shortcut
$Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\AfriDiag Status.lnk")
$Shortcut.TargetPath = "$InstallPath\scripts\check-status.bat"
$Shortcut.WorkingDirectory = $InstallPath
$Shortcut.IconLocation = "shell32.dll,23"
$Shortcut.Description = "Check AfriDiag System Status"
$Shortcut.Save()

Write-Host "✓ Desktop shortcuts created" -ForegroundColor Green

# Create start script
$startScript = @"
@echo off
cd /d "$InstallPath"
echo Starting AfriDiag...
docker-compose up -d
timeout /t 10 /nobreak >nul
start http://localhost:8080
echo AfriDiag is now running at http://localhost:8080
pause
"@

$startScript | Out-File -FilePath "$InstallPath\start-afridiag.bat" -Encoding ASCII

# Create stop script
$stopScript = @"
@echo off
cd /d "$InstallPath"
echo Stopping AfriDiag...
docker-compose down
echo AfriDiag has been stopped.
pause
"@

$stopScript | Out-File -FilePath "$InstallPath\stop-afridiag.bat" -Encoding ASCII

Write-Host ""
Write-Host "=== Installation Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "AfriDiag has been installed successfully!" -ForegroundColor Green
Write-Host "Installation location: $InstallPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "To start AfriDiag:" -ForegroundColor Yellow
Write-Host "1. Double-click the 'AfriDiag' shortcut on your desktop, OR" -ForegroundColor White
Write-Host "2. Run: $InstallPath\start-afridiag.bat" -ForegroundColor White
Write-Host ""
Write-Host "To stop AfriDiag:" -ForegroundColor Yellow
Write-Host "Run: $InstallPath\stop-afridiag.bat" -ForegroundColor White
Write-Host ""
Write-Host "The application will be available at: http://localhost:8080" -ForegroundColor Cyan
Write-Host ""
Write-Host "For support, contact your IT administrator or AfriDiag support team." -ForegroundColor Gray