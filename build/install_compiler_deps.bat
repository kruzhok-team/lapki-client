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
set "NEWPATH=%PATH%"

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

REM 4) Сохраняем PATH в HKCU\Environment как REG_EXPAND_SZ
REM ------------------------------------------------------
echo.
echo Writing PATH to registry...
reg add "HKCU\Environment" /v Path /t REG_EXPAND_SZ /d "!NEWPATH!" /f >nul

REM ------------------------------------------------------
REM 5) Оповещаем систему — чтобы диалог «Переменные среды» 
REM    и все новые консоли увидели обновлённый PATH
REM ------------------------------------------------------
echo.
echo Broadcasting environment change...
REM WM_SETTINGCHANGE = 0x001A, HWND_BROADCAST = 0xFFFF
<nul set /p="> "  &  RUNDLL32.EXE USER32.DLL,SendNotifyMessageW 0xffff,0x1A,0,"Environment"

echo.
echo Done. Please reopen the Environment Variables dialog or start a new console.
endlocal
