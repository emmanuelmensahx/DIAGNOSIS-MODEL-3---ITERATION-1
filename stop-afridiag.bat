@echo off
title AfriDiag - Stopping Application
echo.
echo ========================================
echo    AfriDiag Rural Hospital Edition
echo ========================================
echo.
echo Stopping AfriDiag application...
echo.

REM Navigate to AfriDiag directory
cd /d "%~dp0.."

REM Stop the application using Docker Compose
echo Stopping AfriDiag containers...
docker-compose down

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo    AfriDiag Stopped Successfully!
    echo ========================================
    echo.
    echo All AfriDiag services have been stopped.
    echo Your data is safely stored and will be available when you restart.
    echo.
    echo To start AfriDiag again, run: start-afridiag.bat
    echo.
) else (
    echo.
    echo ERROR: Failed to stop AfriDiag!
    echo Please check the error messages above.
    echo.
)

pause