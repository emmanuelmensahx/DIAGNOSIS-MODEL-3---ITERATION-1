@echo off
title AfriDiag - Data Restore
echo.
echo ========================================
echo    AfriDiag Data Restore Utility
echo ========================================
echo.

REM Navigate to AfriDiag directory
cd /d "%~dp0.."

REM Check if backup directory exists
if not exist "data\backups" (
    echo ERROR: Backup directory not found!
    echo No backups are available to restore.
    echo.
    pause
    exit /b 1
)

REM List available backups
echo Available backup files:
echo.
set count=0
for %%f in (data\backups\afridiag_backup_*.db) do (
    set /a count+=1
    echo [!count!] %%~nxf (%%~tf)
)

if %count% equ 0 (
    echo No backup files found!
    echo Please create a backup first using backup-data.bat
    echo.
    pause
    exit /b 1
)

echo.
echo WARNING: Restoring a backup will replace all current data!
echo Make sure to create a backup of current data before proceeding.
echo.
set /p confirm="Do you want to continue? (y/N): "

if /i not "%confirm%"=="y" (
    echo Restore cancelled.
    echo.
    pause
    exit /b 0
)

echo.
echo Select a backup to restore:
set /p selection="Enter backup number (1-%count%): "

REM Validate selection
if "%selection%"=="" goto invalid_selection
if %selection% lss 1 goto invalid_selection
if %selection% gtr %count% goto invalid_selection

REM Get the selected backup file
set current=0
for %%f in (data\backups\afridiag_backup_*.db) do (
    set /a current+=1
    if !current! equ %selection% (
        set "backup_file=%%f"
        goto restore_backup
    )
)

:invalid_selection
echo Invalid selection! Please enter a number between 1 and %count%.
echo.
pause
exit /b 1

:restore_backup
echo.
echo Selected backup: %backup_file%
echo.

REM Check if AfriDiag is running
docker-compose ps | findstr "Up" >nul 2>&1
if %errorlevel% equ 0 (
    echo WARNING: AfriDiag appears to be running!
    echo Please stop AfriDiag before restoring data.
    echo Run: stop-afridiag.bat
    echo.
    pause
    exit /b 1
)

REM Create backup of current database before restore
if exist "data\afridiag.db" (
    echo Creating backup of current database before restore...
    
    REM Generate timestamp for current backup
    for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
    set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
    set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
    set "timestamp=%YYYY%-%MM%-%DD%_%HH%-%Min%-%Sec%"
    
    copy "data\afridiag.db" "data\backups\afridiag_backup_before_restore_%timestamp%.db" >nul
    
    if %errorlevel% equ 0 (
        echo Current database backed up as: afridiag_backup_before_restore_%timestamp%.db
    ) else (
        echo WARNING: Failed to backup current database!
        set /p continue="Continue with restore anyway? (y/N): "
        if /i not "!continue!"=="y" (
            echo Restore cancelled.
            pause
            exit /b 1
        )
    )
)

echo.
echo Restoring database from backup...
copy "%backup_file%" "data\afridiag.db" >nul

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo    Database Restored Successfully!
    echo ========================================
    echo.
    echo Database has been restored from: %backup_file%
    echo.
    echo You can now start AfriDiag to access the restored data.
    echo Run: start-afridiag.bat
    echo.
    echo NOTE: All users will need to log in again after restore.
    echo.
) else (
    echo.
    echo ERROR: Failed to restore database!
    echo Please check file permissions and try again.
    echo.
)

pause