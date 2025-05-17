@echo off
setlocal EnableDelayedExpansion

REM =====================================================
REM 0) читаем существующий пользовательский PATH
REM =====================================================
set "USERPATH="
for /f "tokens=2,* skip=2" %%A in ('
    reg query "HKCU\Environment" /v Path 2^>nul
') do set "USERPATH=%%B"

REM =====================================================
REM 1) получаем BASE_DIR и список относительных путей
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
REM 2) добавляем каждый каталог в USERPATH, если там нет
REM =====================================================
REM — гарантируем, что USERPATH заканчивается ;
if defined USERPATH (
    if "!USERPATH:~-1!" neq ";" set "USERPATH=!USERPATH!;"
) else (
    set "USERPATH=;"
)

for %%R in (%ITEMS%) do (
    set "FULL=%BASE_DIR%\%%R"
    for %%F in ("!FULL!") do set "DIR=%%~dpF"
    if "!DIR:~-1!"=="\" set "DIR=!DIR:~0,-1!"
    REM проверяем, есть ли уже ;DIR; в USERPATH;
    echo !USERPATH! | findstr /I /C:";!DIR!;" >nul
    if errorlevel 1 (
        echo Adding "!DIR!" to user PATH...
        set "USERPATH=!USERPATH!!DIR!;"
    ) else (
        echo "!DIR!" already present, skipping.
    )
)

REM обрезаем финальный ;
if "!USERPATH:~-1!"==";" set "USERPATH=!USERPATH:~0,-1!"

REM =====================================================
REM 3) пишем обратно в реестр и оповещаем систему
REM =====================================================
echo.
echo Writing updated user PATH to HKCU\Environment...
reg add "HKCU\Environment" /v Path /t REG_EXPAND_SZ /d "!USERPATH!" /f >nul

echo.
echo Broadcasting environment change...
REM WM_SETTINGCHANGE=0x1A, HWND_BROADCAST=0xFFFF, SMTO_ABORTIFHUNG=0x0002
<nul set /p=">"  &  RUNDLL32.EXE USER32.DLL,SendNotifyMessageW 0xffff,0x1A,0,"Environment"

echo.
echo Done. New user PATH written. Please reopen any consoles or the Environment Variables dialog to see changes.
endlocal
