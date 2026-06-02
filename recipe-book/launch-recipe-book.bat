@echo off
REM ============================================================
REM  Recipe Book Creator - launcher
REM  Double-click this file (or the Desktop shortcut that points
REM  to it) to start the app and open it in your browser.
REM ============================================================

REM Always run from the folder this script lives in.
cd /d "%~dp0"

echo.
echo ==== Recipe Book Creator ====
echo.

REM Make sure Node.js / npm is available.
where npm >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js / npm was not found on your PATH.
    echo Please install Node.js from https://nodejs.org/ and try again.
    echo.
    pause
    exit /b 1
)

REM Install dependencies the first time (or after they are removed).
if not exist "node_modules" (
    echo Installing dependencies, this may take a minute...
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
)

REM Open the app in the default browser shortly after the server starts.
echo Starting the dev server...
start "" cmd /c "timeout /t 4 >nul & start http://localhost:5173/"

REM Start Vite. The window stays open while the app runs;
REM close it (or press Ctrl+C) to stop the app.
call npm run dev

pause
