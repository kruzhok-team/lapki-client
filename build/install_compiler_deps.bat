@echo off
setlocal EnableDelayedExpansion

REM =====================================================
REM 0) Read the existing **user** PATH from HKCU
REM =====================================================
set "USERPATH="
for /f "skip=2 tokens=2,*" %%A in ('
  reg query "HKCU\Environment" /v Path 2^>nul
') do set "USERPATH=%%B"

REM Ensure we have a trailing semicolon for easy matching/appending
if defined USERPATH (
  if not "!USERPATH:~-1!"==";" set "USERPATH=!USERPATH!;"
) else (
  set "USERPATH=;"
)

REM =====================================================
REM 1) Parse BASE_DIR argument
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

REM =====================================================
REM 2) List of relative dirs under BASE_DIR to add
REM =====================================================
set "ITEMS=gcc-arm-none-eabi\bin\ resources\app.asar.unpacked\resources\modules\win32\arduino-cli\"

REM =====================================================
REM 3) Loop and append each unique directory to USERPATH
REM =====================================================
for %%R in (%ITEMS%) do (
  set "FULL=%BASE_DIR%\%%R"
  for %%F in ("!FULL!") do set "DIR=%%~dpF"
  if "!DIR:~-1!"=="\" set "DIR=!DIR:~0,-1!"

  rem only add if not already present
  echo !USERPATH! | findstr /I /C:";!DIR!;" >nul
  if errorlevel 1 (
    echo Adding "!DIR!" to user PATH...
    set "USERPATH=!USERPATH!!DIR!;"
  ) else (
    echo "!DIR!" already in user PATH, skipping.
  )
)

REM Trim trailing semicolon
if "!USERPATH:~-1!"==";" set "USERPATH=!USERPATH:~0,-1!"

REM =====================================================
REM 4) Write back **only** the user PATH via setx
REM    (system PATH remains untouched)
REM =====================================================
echo.
echo Writing updated user PATH...
setx PATH "!USERPATH!" >nul
set "PATH=!USERPATH!"
echo.
echo Done. New user PATH saved.
echo Please start a new console session to apply changes.
endlocal
