@echo off
setlocal

REM ============================================================================
REM Script: copy_gcc_folder.bat
REM Usage:  copy_gcc_folder.bat BASE_DIR TARGET_DIR
REM   BASE_DIR   - path to the base directory (without trailing backslash)
REM   TARGET_DIR - path to the directory where you want to copy the folder
REM This script will copy BASE_DIR\gcc-arm-none-eabi into TARGET_DIR.
REM ============================================================================

REM 1) Validate arguments
if "%~1"=="" (
    echo ERROR: No base directory provided.
    echo Usage: %~nx0 BASE_DIR TARGET_DIR
    exit /b 1
)
if "%~2"=="" (
    echo ERROR: No target directory provided.
    echo Usage: %~nx0 BASE_DIR TARGET_DIR
    exit /b 1
)

REM 2) Set variables
set "BASE_DIR=%~1"
set "TARGET_DIR=%~2"
set "SRC_DIR=%BASE_DIR%\gcc-arm-none-eabi\"
set "DEST_DIR=%TARGET_DIR%\gcc-arm-none-eabi\"

REM 3) Check source exists
if not exist "%SRC_DIR%\" (
    echo ERROR: Source directory "%SRC_DIR%" not found.
    exit /b 1
)

REM 4) Ensure target parent exists
if not exist "%TARGET_DIR%\" (
    echo Target directory "%TARGET_DIR%" does not exist. Creating...
    mkdir "%TARGET_DIR%"
    if errorlevel 1 (
        echo ERROR: Failed to create target directory.
        exit /b 1
    )
)

REM 5) Copy the directory
echo Copying "%SRC_DIR%" to "%DEST_DIR%"...
xcopy "%SRC_DIR%\" "%DEST_DIR%\" /E /I /Y >nul
if errorlevel 1 (
    echo ERROR: Copy operation failed.
    exit /b 1
)

echo SUCCESS: "%SRC_DIR%" has been copied to "%DEST_DIR%".
endlocal