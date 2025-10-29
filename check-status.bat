@echo off
title AfriDiag - System Status Check
echo.
echo ========================================
echo    AfriDiag System Status Check
echo ========================================
echo.

REM Navigate to AfriDiag directory
cd /d "%~dp0.."

echo Checking system status...
echo.

REM Check Docker status
echo [1/5] Checking Docker...
docker info >nul 2>&1
if %errorlevel% equ 0 (
    echo   ✓ Docker is running
) else (
    echo   ✗ Docker is not running or not installed
    echo     Please install Docker Desktop and start it
)

echo.

REM Check Docker Compose
echo [2/5] Checking Docker Compose...
docker-compose --version >nul 2>&1
if %errorlevel% equ 0 (
    echo   ✓ Docker Compose is available
) else (
    echo   ✗ Docker Compose is not available
)

echo.

REM Check AfriDiag containers
echo [3/5] Checking AfriDiag containers...
docker-compose ps >nul 2>&1
if %errorlevel% equ 0 (
    echo   Container status:
    docker-compose ps
) else (
    echo   ✗ No AfriDiag containers found
    echo     Run start-afridiag.bat to start the application
)

echo.

REM Check database file
echo [4/5] Checking database...
if exist "data\afridiag.db" (
    echo   ✓ Database file exists
    
    REM Get database file size
    for %%A in ("data\afridiag.db") do (
        echo     Size: %%~zA bytes
        echo     Modified: %%~tA
    )
) else (
    echo   ✗ Database file not found
    echo     Database will be created on first startup
)

echo.

REM Check application accessibility
echo [5/5] Checking application accessibility...
curl -s -o nul -w "%%{http_code}" http://localhost:8080 >temp_status.txt 2>nul
set /p http_status=<temp_status.txt
del temp_status.txt >nul 2>&1

if "%http_status%"=="200" (
    echo   ✓ Application is accessible at http://localhost:8080
    echo     Status: Running
) else if "%http_status%"=="000" (
    echo   ✗ Application is not accessible
    echo     Status: Not running or connection refused
) else (
    echo   ⚠ Application responded with HTTP status: %http_status%
    echo     Status: May have issues
)

echo.

REM Check disk space
echo Additional Information:
echo.
echo Disk space in AfriDiag directory:
for /f "tokens=3" %%a in ('dir /-c ^| find "bytes free"') do (
    echo   Available: %%a bytes free
)

echo.

REM Check backup status
if exist "data\backups" (
    set backup_count=0
    for %%f in (data\backups\afridiag_backup_*.db) do (
        set /a backup_count+=1
    )
    echo Backup status:
    echo   Backup directory: Exists
    echo   Number of backups: !backup_count!
    
    if !backup_count! gtr 0 (
        echo   Latest backup:
        for /f %%f in ('dir /b /o:-d data\backups\afridiag_backup_*.db 2^>nul ^| head -1') do (
            echo     %%f
        )
    )
) else (
    echo Backup status:
    echo   ✗ No backup directory found
    echo     Run backup-data.bat to create your first backup
)

echo.

REM Summary
echo ========================================
echo Summary:
echo.

REM Overall status determination
set issues=0

docker info >nul 2>&1
if %errorlevel% neq 0 set /a issues+=1

if not exist "data\afridiag.db" set /a issues+=1

if not "%http_status%"=="200" set /a issues+=1

if %issues% equ 0 (
    echo   Status: ✓ All systems operational
    echo   AfriDiag is ready for use
) else if %issues% equ 1 (
    echo   Status: ⚠ Minor issues detected
    echo   AfriDiag may have limited functionality
) else (
    echo   Status: ✗ Multiple issues detected
    echo   AfriDiag requires attention
)

echo.
echo Available commands:
echo   start-afridiag.bat  - Start the application
echo   stop-afridiag.bat   - Stop the application
echo   backup-data.bat     - Create data backup
echo   restore-data.bat    - Restore from backup
echo   check-status.bat    - Run this status check
echo.

pause