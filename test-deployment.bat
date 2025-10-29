@echo off
title AfriDiag - Deployment Test Suite
echo.
echo ========================================
echo    AfriDiag Deployment Test Suite
echo ========================================
echo.
echo This script will test the complete deployment package
echo to ensure everything is working correctly.
echo.

REM Navigate to AfriDiag directory
cd /d "%~dp0.."

echo Starting comprehensive deployment tests...
echo.

set test_passed=0
set test_failed=0
set test_warnings=0

REM Test 1: Check required files
echo [TEST 1/10] Checking required files...
set files_missing=0

if not exist "Dockerfile" (
    echo   ✗ Dockerfile missing
    set /a files_missing+=1
    set /a test_failed+=1
) else (
    echo   ✓ Dockerfile found
)

if not exist "docker-compose.yml" (
    echo   ✗ docker-compose.yml missing
    set /a files_missing+=1
    set /a test_failed+=1
) else (
    echo   ✓ docker-compose.yml found
)

if not exist "install-afridiag.ps1" (
    echo   ✗ install-afridiag.ps1 missing
    set /a files_missing+=1
    set /a test_failed+=1
) else (
    echo   ✓ install-afridiag.ps1 found
)

if not exist "backend\main.py" (
    echo   ✗ Backend main.py missing
    set /a files_missing+=1
    set /a test_failed+=1
) else (
    echo   ✓ Backend main.py found
)

if not exist "frontend\index.html" (
    echo   ✗ Frontend index.html missing
    set /a files_missing+=1
    set /a test_failed+=1
) else (
    echo   ✓ Frontend index.html found
)

if %files_missing% equ 0 (
    echo   Result: ✓ All required files present
    set /a test_passed+=1
) else (
    echo   Result: ✗ %files_missing% files missing
)

echo.

REM Test 2: Check Docker availability
echo [TEST 2/10] Checking Docker availability...
docker --version >nul 2>&1
if %errorlevel% equ 0 (
    echo   ✓ Docker is installed
    docker info >nul 2>&1
    if %errorlevel% equ 0 (
        echo   ✓ Docker daemon is running
        set /a test_passed+=1
    ) else (
        echo   ✗ Docker daemon is not running
        echo     Please start Docker Desktop
        set /a test_failed+=1
    )
) else (
    echo   ✗ Docker is not installed
    echo     Please install Docker Desktop
    set /a test_failed+=1
)

echo.

REM Test 3: Check Docker Compose
echo [TEST 3/10] Checking Docker Compose...
docker-compose --version >nul 2>&1
if %errorlevel% equ 0 (
    echo   ✓ Docker Compose is available
    set /a test_passed+=1
) else (
    echo   ✗ Docker Compose is not available
    set /a test_failed+=1
)

echo.

REM Test 4: Validate Docker Compose file
echo [TEST 4/10] Validating Docker Compose configuration...
docker-compose config >nul 2>&1
if %errorlevel% equ 0 (
    echo   ✓ Docker Compose configuration is valid
    set /a test_passed+=1
) else (
    echo   ✗ Docker Compose configuration has errors
    echo     Run 'docker-compose config' for details
    set /a test_failed+=1
)

echo.

REM Test 5: Check script files
echo [TEST 5/10] Checking management scripts...
set scripts_missing=0

if not exist "scripts\start-afridiag.bat" (
    echo   ✗ start-afridiag.bat missing
    set /a scripts_missing+=1
) else (
    echo   ✓ start-afridiag.bat found
)

if not exist "scripts\stop-afridiag.bat" (
    echo   ✗ stop-afridiag.bat missing
    set /a scripts_missing+=1
) else (
    echo   ✓ stop-afridiag.bat found
)

if not exist "scripts\backup-data.bat" (
    echo   ✗ backup-data.bat missing
    set /a scripts_missing+=1
) else (
    echo   ✓ backup-data.bat found
)

if not exist "scripts\restore-data.bat" (
    echo   ✗ restore-data.bat missing
    set /a scripts_missing+=1
) else (
    echo   ✓ restore-data.bat found
)

if not exist "scripts\check-status.bat" (
    echo   ✗ check-status.bat missing
    set /a scripts_missing+=1
) else (
    echo   ✓ check-status.bat found
)

if %scripts_missing% equ 0 (
    echo   Result: ✓ All management scripts present
    set /a test_passed+=1
) else (
    echo   Result: ✗ %scripts_missing% scripts missing
    set /a test_failed+=1
)

echo.

REM Test 6: Check documentation
echo [TEST 6/10] Checking documentation...
set docs_missing=0

if not exist "README-RURAL-DEPLOYMENT.md" (
    echo   ✗ README-RURAL-DEPLOYMENT.md missing
    set /a docs_missing+=1
) else (
    echo   ✓ README-RURAL-DEPLOYMENT.md found
)

if not exist "DEPLOYMENT-PACKAGE.md" (
    echo   ✗ DEPLOYMENT-PACKAGE.md missing
    set /a docs_missing+=1
) else (
    echo   ✓ DEPLOYMENT-PACKAGE.md found
)

if %docs_missing% equ 0 (
    echo   Result: ✓ All documentation present
    set /a test_passed+=1
) else (
    echo   Result: ⚠ %docs_missing% documentation files missing
    set /a test_warnings+=1
)

echo.

REM Test 7: Check offline configuration
echo [TEST 7/10] Checking offline configuration...
if exist "backend\app\core\config_offline.py" (
    echo   ✓ Offline configuration found
    
    REM Check for SQLite configuration
    findstr /i "sqlite" "backend\app\core\config_offline.py" >nul 2>&1
    if %errorlevel% equ 0 (
        echo   ✓ SQLite configuration detected
    ) else (
        echo   ⚠ SQLite configuration not found
        set /a test_warnings+=1
    )
    
    set /a test_passed+=1
) else (
    echo   ✗ Offline configuration missing
    set /a test_failed+=1
)

echo.

REM Test 8: Check database initialization
echo [TEST 8/10] Checking database initialization...
if exist "backend\init_offline_database.py" (
    echo   ✓ Database initialization script found
    set /a test_passed+=1
) else (
    echo   ✗ Database initialization script missing
    set /a test_failed+=1
)

echo.

REM Test 9: Check sync capabilities
echo [TEST 9/10] Checking synchronization capabilities...
if exist "backend\app\database\offline_sync.py" (
    echo   ✓ Offline sync module found
    set /a test_passed+=1
) else (
    echo   ✗ Offline sync module missing
    set /a test_failed+=1
)

if exist "backend\app\api\routes\sync.py" (
    echo   ✓ Sync API endpoints found
) else (
    echo   ⚠ Sync API endpoints not found
    set /a test_warnings+=1
)

echo.

REM Test 10: Test build process (if Docker is available)
echo [TEST 10/10] Testing build process...
docker info >nul 2>&1
if %errorlevel% equ 0 (
    echo   Testing Docker image build...
    docker-compose build --no-cache >build_test.log 2>&1
    if %errorlevel% equ 0 (
        echo   ✓ Docker image builds successfully
        set /a test_passed+=1
        
        REM Clean up test build
        docker-compose down >nul 2>&1
        docker image prune -f >nul 2>&1
    ) else (
        echo   ✗ Docker image build failed
        echo     Check build_test.log for details
        set /a test_failed+=1
    )
) else (
    echo   ⚠ Skipping build test (Docker not available)
    set /a test_warnings+=1
)

echo.

REM Test Summary
echo ========================================
echo Test Summary:
echo ========================================
echo.
echo   Tests Passed:  %test_passed%/10
echo   Tests Failed:  %test_failed%/10
echo   Warnings:      %test_warnings%/10
echo.

REM Overall result
if %test_failed% equ 0 (
    if %test_warnings% equ 0 (
        echo   Overall Result: ✓ EXCELLENT - Ready for deployment
        echo   All tests passed without issues.
    ) else (
        echo   Overall Result: ✓ GOOD - Ready for deployment
        echo   Minor warnings detected but deployment should work.
    )
) else if %test_failed% lss 3 (
    echo   Overall Result: ⚠ CAUTION - May have issues
    echo   Some tests failed. Review and fix before deployment.
) else (
    echo   Overall Result: ✗ FAILED - Not ready for deployment
    echo   Multiple critical issues detected. Fix before proceeding.
)

echo.

REM Recommendations
echo Recommendations:
echo.

if %test_failed% gtr 0 (
    echo   1. Fix all failed tests before deployment
    echo   2. Ensure Docker Desktop is installed and running
    echo   3. Verify all required files are present
    echo   4. Check configuration files for errors
)

if %test_warnings% gtr 0 (
    echo   1. Review warnings for potential issues
    echo   2. Consider adding missing documentation
    echo   3. Verify optional components are working
)

if %test_failed% equ 0 (
    echo   1. Deployment package appears ready
    echo   2. Test on target system before production use
    echo   3. Follow deployment documentation carefully
    echo   4. Create initial backup after deployment
)

echo.

REM Cleanup
if exist "build_test.log" (
    echo Build test log saved as: build_test.log
    echo.
)

echo Test completed. Press any key to exit...
pause >nul