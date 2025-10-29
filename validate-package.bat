@echo off
title AfriDiag - Package Validation
echo.
echo ========================================
echo    AfriDiag Package Validation
echo ========================================
echo.
echo This script validates the deployment package
echo without requiring Docker to be installed.
echo.

REM Navigate to AfriDiag directory
cd /d "%~dp0"

echo Starting package validation...
echo.

set validation_passed=0
set validation_failed=0
set validation_warnings=0

REM Validation 1: Core application files
echo [VALIDATION 1/8] Core application files...
set core_missing=0

if not exist "Dockerfile" (
    echo   ✗ Dockerfile missing
    set /a core_missing+=1
) else (
    echo   ✓ Dockerfile present
)

if not exist "docker-compose.yml" (
    echo   ✗ docker-compose.yml missing
    set /a core_missing+=1
) else (
    echo   ✓ docker-compose.yml present
)

if not exist "backend\main.py" (
    echo   ✗ Backend main.py missing
    set /a core_missing+=1
) else (
    echo   ✓ Backend main.py present
)

if not exist "frontend\index.html" (
    echo   ✗ Frontend index.html missing
    set /a core_missing+=1
) else (
    echo   ✓ Frontend index.html present
)

if %core_missing% equ 0 (
    echo   Result: ✓ PASS - All core files present
    set /a validation_passed+=1
) else (
    echo   Result: ✗ FAIL - %core_missing% core files missing
    set /a validation_failed+=1
)

echo.

REM Validation 2: Installation scripts
echo [VALIDATION 2/8] Installation scripts...
set install_missing=0

if not exist "install-afridiag.ps1" (
    echo   ✗ install-afridiag.ps1 missing
    set /a install_missing+=1
) else (
    echo   ✓ install-afridiag.ps1 present
    
    REM Check if installer has Docker installation logic
    findstr /i "docker" "install-afridiag.ps1" >nul 2>&1
    if %errorlevel% equ 0 (
        echo   ✓ Docker installation logic found
    ) else (
        echo   ⚠ Docker installation logic not found
        set /a validation_warnings+=1
    )
)

if %install_missing% equ 0 (
    echo   Result: ✓ PASS - Installation script present
    set /a validation_passed+=1
) else (
    echo   Result: ✗ FAIL - Installation script missing
    set /a validation_failed+=1
)

echo.

REM Validation 3: Management scripts
echo [VALIDATION 3/8] Management scripts...
set mgmt_missing=0

if not exist "scripts\start-afridiag.bat" (
    echo   ✗ start-afridiag.bat missing
    set /a mgmt_missing+=1
) else (
    echo   ✓ start-afridiag.bat present
)

if not exist "scripts\stop-afridiag.bat" (
    echo   ✗ stop-afridiag.bat missing
    set /a mgmt_missing+=1
) else (
    echo   ✓ stop-afridiag.bat present
)

if not exist "scripts\backup-data.bat" (
    echo   ✗ backup-data.bat missing
    set /a mgmt_missing+=1
) else (
    echo   ✓ backup-data.bat present
)

if not exist "scripts\restore-data.bat" (
    echo   ✗ restore-data.bat missing
    set /a mgmt_missing+=1
) else (
    echo   ✓ restore-data.bat present
)

if not exist "scripts\check-status.bat" (
    echo   ✗ check-status.bat missing
    set /a mgmt_missing+=1
) else (
    echo   ✓ check-status.bat present
)

if %mgmt_missing% equ 0 (
    echo   Result: ✓ PASS - All management scripts present
    set /a validation_passed+=1
) else (
    echo   Result: ✗ FAIL - %mgmt_missing% management scripts missing
    set /a validation_failed+=1
)

echo.

REM Validation 4: Documentation
echo [VALIDATION 4/8] Documentation...
set docs_missing=0

if not exist "README-RURAL-DEPLOYMENT.md" (
    echo   ✗ README-RURAL-DEPLOYMENT.md missing
    set /a docs_missing+=1
) else (
    echo   ✓ README-RURAL-DEPLOYMENT.md present
)

if not exist "DEPLOYMENT-PACKAGE.md" (
    echo   ✗ DEPLOYMENT-PACKAGE.md missing
    set /a docs_missing+=1
) else (
    echo   ✓ DEPLOYMENT-PACKAGE.md present
)

if %docs_missing% equ 0 (
    echo   Result: ✓ PASS - All documentation present
    set /a validation_passed+=1
) else (
    echo   Result: ⚠ WARN - %docs_missing% documentation files missing
    set /a validation_warnings+=1
)

echo.

REM Validation 5: Offline configuration
echo [VALIDATION 5/8] Offline configuration...
if exist "backend\app\core\config_offline.py" (
    echo   ✓ Offline configuration file present
    
    REM Check for SQLite configuration
    findstr /i "sqlite" "backend\app\core\config_offline.py" >nul 2>&1
    if %errorlevel% equ 0 (
        echo   ✓ SQLite configuration found
    ) else (
        echo   ⚠ SQLite configuration not clearly defined
        set /a validation_warnings+=1
    )
    
    REM Check for offline mode flag
    findstr /i "OFFLINE_MODE.*True" "backend\app\core\config_offline.py" >nul 2>&1
    if %errorlevel% equ 0 (
        echo   ✓ Offline mode enabled
    ) else (
        echo   ⚠ Offline mode not clearly enabled
        set /a validation_warnings+=1
    )
    
    echo   Result: ✓ PASS - Offline configuration valid
    set /a validation_passed+=1
) else (
    echo   ✗ Offline configuration missing
    echo   Result: ✗ FAIL - No offline configuration
    set /a validation_failed+=1
)

echo.

REM Validation 6: Database initialization
echo [VALIDATION 6/8] Database initialization...
if exist "backend\init_offline_database.py" (
    echo   ✓ Database initialization script present
    
    REM Check for table creation logic
    findstr /i "CREATE TABLE" "backend\init_offline_database.py" >nul 2>&1
    if %errorlevel% equ 0 (
        echo   ✓ Table creation logic found
    ) else (
        echo   ⚠ Table creation logic not found
        set /a validation_warnings+=1
    )
    
    echo   Result: ✓ PASS - Database initialization ready
    set /a validation_passed+=1
) else (
    echo   ✗ Database initialization script missing
    echo   Result: ✗ FAIL - No database initialization
    set /a validation_failed+=1
)

echo.

REM Validation 7: Synchronization capabilities
echo [VALIDATION 7/8] Synchronization capabilities...
set sync_components=0

if exist "backend\app\database\offline_sync.py" (
    echo   ✓ Offline sync module present
    set /a sync_components+=1
) else (
    echo   ✗ Offline sync module missing
)

if exist "backend\app\api\routes\sync.py" (
    echo   ✓ Sync API endpoints present
    set /a sync_components+=1
) else (
    echo   ✗ Sync API endpoints missing
)

if %sync_components% equ 2 (
    echo   Result: ✓ PASS - Full sync capabilities available
    set /a validation_passed+=1
) else if %sync_components% equ 1 (
    echo   Result: ⚠ WARN - Partial sync capabilities
    set /a validation_warnings+=1
) else (
    echo   Result: ✗ FAIL - No sync capabilities
    set /a validation_failed+=1
)

echo.

REM Validation 8: Docker configuration
echo [VALIDATION 8/8] Docker configuration...
set docker_config=0

if exist "docker\nginx.conf" (
    echo   ✓ Nginx configuration present
    set /a docker_config+=1
) else (
    echo   ✗ Nginx configuration missing
)

if exist "docker\supervisord.conf" (
    echo   ✓ Supervisor configuration present
    set /a docker_config+=1
) else (
    echo   ✗ Supervisor configuration missing
)

if exist "docker\start.sh" (
    echo   ✓ Container startup script present
    set /a docker_config+=1
) else (
    echo   ✗ Container startup script missing
)

if %docker_config% equ 3 (
    echo   Result: ✓ PASS - Complete Docker configuration
    set /a validation_passed+=1
) else (
    echo   Result: ✗ FAIL - Incomplete Docker configuration
    set /a validation_failed+=1
)

echo.

REM Validation Summary
echo ========================================
echo Validation Summary:
echo ========================================
echo.
echo   Validations Passed:  %validation_passed%/8
echo   Validations Failed:  %validation_failed%/8
echo   Warnings:           %validation_warnings%
echo.

REM Overall package status
if %validation_failed% equ 0 (
    if %validation_warnings% equ 0 (
        echo   Package Status: ✓ EXCELLENT
        echo   Ready for deployment to rural hospitals
    ) else if %validation_warnings% lss 3 (
        echo   Package Status: ✓ GOOD
        echo   Ready for deployment with minor notes
    ) else (
        echo   Package Status: ⚠ ACCEPTABLE
        echo   Deployment possible but review warnings
    )
) else if %validation_failed% lss 3 (
    echo   Package Status: ⚠ NEEDS ATTENTION
    echo   Fix failed validations before deployment
) else (
    echo   Package Status: ✗ NOT READY
    echo   Multiple critical issues must be resolved
)

echo.

REM Deployment readiness checklist
echo Deployment Readiness Checklist:
echo.

if %validation_failed% equ 0 (
    echo   ✓ Package validation complete
    echo   ✓ All core components present
    echo   ✓ Configuration files ready
    echo   ✓ Management scripts available
    echo.
    echo   Next Steps:
    echo   1. Copy package to target system
    echo   2. Run install-afridiag.ps1 as Administrator
    echo   3. Follow README-RURAL-DEPLOYMENT.md
    echo   4. Test installation with check-status.bat
) else (
    echo   ✗ Package validation incomplete
    echo   ✗ Missing critical components
    echo.
    echo   Required Actions:
    echo   1. Fix all failed validations
    echo   2. Re-run this validation script
    echo   3. Ensure all files are present
    echo   4. Review configuration settings
)

echo.

REM File size summary
echo Package Information:
echo.
echo   Package location: %CD%
echo   Validation date: %DATE% %TIME%
echo.

REM Count total files
set file_count=0
for /r %%f in (*) do set /a file_count+=1
echo   Total files in package: %file_count%

echo.
echo Validation completed.
echo.
pause