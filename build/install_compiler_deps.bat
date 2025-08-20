@REM @echo off
@REM setlocal EnableDelayedExpansion

@REM REM =====================================================
@REM REM 0) Read the existing **user** PATH from HKCU
@REM REM =====================================================
@REM set "USERPATH="
@REM for /f "skip=2 tokens=2,*" %%A in ('
@REM   reg query "HKCU\Environment" /v Path 2^>nul
@REM ') do set "USERPATH=%%B"

@REM REM Ensure we have a trailing semicolon for easy matching/appending
@REM if defined USERPATH (
@REM   if not "!USERPATH:~-1!"==";" set "USERPATH=!USERPATH!;"
@REM ) else (
@REM   set "USERPATH=;"
@REM )

@REM REM =====================================================
@REM REM 1) Parse BASE_DIR argument
@REM REM =====================================================
@REM if "%~1"=="" (
@REM   echo ERROR: No base directory provided.
@REM   exit /b 1
@REM )
@REM set "BASE_DIR=%~1"
@REM shift

@REM if not exist "%BASE_DIR%\" (
@REM   echo ERROR: Base directory "%BASE_DIR%" does not exist.
@REM   exit /b 1
@REM )

@REM REM =====================================================
@REM REM 2) List of relative dirs under BASE_DIR to add
@REM REM =====================================================
@REM set "ITEMS=gcc-arm-none-eabi\bin\ resources\app.asar.unpacked\resources\modules\win32\arduino-cli\"

@REM REM =====================================================
@REM REM 3) Loop and append each unique directory to USERPATH
@REM REM =====================================================
@REM for %%R in (%ITEMS%) do (
@REM   set "FULL=%BASE_DIR%\%%R"
@REM   for %%F in ("!FULL!") do set "DIR=%%~dpF"
@REM   if "!DIR:~-1!"=="\" set "DIR=!DIR:~0,-1!"

@REM   rem only add if not already present
@REM   echo !USERPATH! | findstr /I /C:";!DIR!;" >nul
@REM   if errorlevel 1 (
@REM     echo Adding "!DIR!" to user PATH...
@REM     set "USERPATH=!USERPATH!!DIR!;"
@REM   ) else (
@REM     echo "!DIR!" already in user PATH, skipping.
@REM   )
@REM )

@REM REM Trim trailing semicolon
@REM if "!USERPATH:~-1!"==";" set "USERPATH=!USERPATH:~0,-1!"

@REM REM =====================================================
@REM REM 4) Write back **only** the user PATH via setx
@REM REM    (system PATH remains untouched)
@REM REM =====================================================
@REM echo.
@REM echo Writing updated user PATH...
@REM setx PATH "!USERPATH!" >nul
@REM set "PATH=!USERPATH!"
@REM echo.
@REM echo Done. New user PATH saved.
@REM echo Please start a new console session to apply changes.
@REM endlocal
