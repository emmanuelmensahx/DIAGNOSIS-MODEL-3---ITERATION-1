@echo off
title AfriDiag - Starting Application
echo.
echo ========================================
echo    AfriDiag Rural Hospital Edition
echo ========================================
echo.
echo Starting AfriDiag application...
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not running!
    echo Please start Docker Desktop and try again.
    echo.
    pause
    exit /b 1
)

REM Navigate to AfriDiag directory
cd /d "%~dp0.."

REM Start the application using Docker Compose
echo Starting AfriDiag containers...
docker-compose up -d

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo    AfriDiag Started Successfully!
    echo ========================================
    echo.
    echo Application is now running at:
    echo   http://localhost:8080
    echo.
    echo Default login credentials:
    echo   Username: admin
    echo   Password: admin123
    echo.
    echo IMPORTANT: Change the default password after first login!
    echo.
    echo To stop AfriDiag, run: stop-afridiag.bat
    echo.
    
    REM Wait a moment for services to start
    timeout /t 3 /nobreak >nul
    
    REM Try to open the application in default browser
    start http://localhost:8080
    
    echo Opening AfriDiag in your default browser...
    echo.
) else (
    echo.
    echo ERROR: Failed to start AfriDiag!
    echo Please check the error messages above.
    echo.
)

pause