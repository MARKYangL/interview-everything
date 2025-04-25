@echo off
REM This batch file runs the Interview Everything application with proper directory setup
REM and ensures the application starts in stealth mode by default.

setlocal enabledelayedexpansion

REM Set Node.js memory limit to a higher value for better performance
set NODE_OPTIONS=--max-old-space-size=4096

REM Check if the user has Administrator privileges
>nul 2>&1 "%SYSTEMROOT%\system32\cacls.exe" "%SYSTEMROOT%\system32\config\system"

REM If error level is not 0, we do not have admin privileges
if %errorlevel% neq 0 (
    echo Running without Administrator privileges. Some features might not work properly.
    echo Consider running as Administrator if you encounter any issues.
    REM Continue execution without prompt
) else (
    echo Running with Administrator privileges.
)

REM Create necessary directories if they don't exist
echo Creating necessary application directories...
mkdir "%APPDATA%\interview-everything\temp" 2>nul
mkdir "%APPDATA%\interview-everything\cache" 2>nul
mkdir "%APPDATA%\interview-everything\screenshots" 2>nul
mkdir "%APPDATA%\interview-everything\extra_screenshots" 2>nul

REM Clean any previous builds to ensure a fresh start
echo Cleaning previous builds...
call npm run clean

REM Check if the build needs to be run
if not exist "dist-electron" (
    echo Building the application...
    call npm run build
) else (
    echo Using existing build...
)

REM Start the application
echo Starting Interview Everything in invisible mode...
echo Press Ctrl+B to toggle visibility once the application is running...
call npm run run-prod

endlocal