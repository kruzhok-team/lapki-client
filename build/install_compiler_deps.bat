@echo off
setlocal EnableDelayedExpansion

REM =====================================================
REM Configuration: set your base directory and files here
REM =====================================================
if "%~1"=="" (
    echo ERROR: No base directory provided.
    exit /b 1
)
set "BASE_DIR=%~1"
shift

if not exist "%BASE_DIR%\" (
    echo ERROR: Base directory "%BASE_DIR%" does not exist.
    exit /b 1
)
set "ITEMS=resources\app.asar.unpacked\resources\modules\win32\gcc-arm-none-eabi\bin resources\app.asar.unpacked\resources\modules\win32\arduino-cli"

REM =====================================================
REM 2) Prepare new PATH
REM =====================================================
set "OLDPATH=%PATH%"
set "NEWPATH="

REM =====================================================
REM 3) Loop through each relative item
REM =====================================================
for %%R in (%ITEMS%) do (
    set "REL=%%R"
    set "FULL_PATH=%BASE_DIR%\!REL!"
    REM extract directory of the file
    for %%F in ("!FULL_PATH!") do set "DIR=%%~dpF"
    REM strip trailing backslash
    if "!DIR:~-1!"=="\" set "DIR=!DIR:~0,-1!"
    REM check if already in NEWPATH
    echo !NEWPATH! | findstr /I /C:";!DIR!;" >nul
    if errorlevel 1 (
        echo Adding "!DIR!" to PATH...
        set "NEWPATH=!NEWPATH!;!DIR!"
    ) else (
        echo "!DIR!" already in PATH, skipping.
    )
)

REM =====================================================
REM 4) Persist the updated PATH and apply to current session
REM =====================================================
echo.
echo Updating user PATH permanently...
setx path "!NEWPATH!" >nul

echo.
echo Updating current session PATH...
set "PATH=!NEWPATH!"

echo.
echo Done. New PATH:
echo %PATH%
endlocal
