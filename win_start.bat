@echo off
setlocal enabledelayedexpansion
TITLE Inventory App Launcher
CLS

REM Always run relative to this .bat file location
cd /d "%~dp0"

REM Configure port in one place
set PORT=3000

echo Starting Inventory Engine on port %PORT%...

REM Start backend minimized with PORT set
start /MIN "Inventory Backend" cmd /c "cd backend && set PORT=%PORT% && npm start"

echo Waiting for server to initialize...

:LOOP
REM Check YOUR server readiness via health endpoint (more reliable than netstat)
powershell -Command "try { $r = Invoke-WebRequest -UseBasicParsing http://localhost:%PORT%/api/health -TimeoutSec 1; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1

if %errorlevel% equ 0 goto :LAUNCH

timeout /t 1 /nobreak >nul
goto :LOOP

:LAUNCH
echo Server is ready! Launching application...
start "" "http://localhost:%PORT%"

exit

