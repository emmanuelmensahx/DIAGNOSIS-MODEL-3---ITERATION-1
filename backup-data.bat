@echo off
title AfriDiag - Data Backup
echo.
echo ========================================
echo    AfriDiag Data Backup Utility
echo ========================================
echo.

REM Navigate to AfriDiag directory
cd /d "%~dp0.."

REM Create backup directory if it doesn't exist
if not exist "data\backups" (
    mkdir "data\backups"
)

REM Generate timestamp for backup filename
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "timestamp=%YYYY%-%MM%-%DD%_%HH%-%Min%-%Sec%"

set "backup_file=data\backups\afridiag_backup_%timestamp%.db"

echo Creating backup of AfriDiag database...
echo Backup file: %backup_file%
echo.

REM Check if database exists
if not exist "data\afridiag.db" (
    echo ERROR: Database file not found!
    echo Make sure AfriDiag has been initialized and data directory exists.
    echo.
    pause
    exit /b 1
)

REM Copy database file to backup location
copy "data\afridiag.db" "%backup_file%" >nul

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo    Backup Created Successfully!
    echo ========================================
    echo.
    echo Backup saved to: %backup_file%
    echo.
    echo Backup contains:
    echo   - Patient records
    echo   - Diagnosis data
    echo   - Treatment information
    echo   - User accounts
    echo   - System settings
    echo.
    
    REM Show backup file size
    for %%A in ("%backup_file%") do (
        echo Backup size: %%~zA bytes
    )
    echo.
    
    REM Clean up old backups (keep last 10)
    echo Cleaning up old backups (keeping last 10)...
    
    REM Count backup files
    set count=0
    for %%f in (data\backups\afridiag_backup_*.db) do (
        set /a count+=1
    )
    
    if %count% gtr 10 (
        echo Found %count% backup files, removing oldest...
        
        REM Get list of backup files sorted by date (oldest first)
        for /f "skip=10" %%f in ('dir /b /o:d data\backups\afridiag_backup_*.db') do (
            echo Removing old backup: %%f
            del "data\backups\%%f"
        )
    )
    
    echo.
    echo Backup completed successfully!
    echo.
) else (
    echo.
    echo ERROR: Failed to create backup!
    echo Please check disk space and file permissions.
    echo.
)

pause