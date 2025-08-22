@REM @echo off
@REM setlocal

@REM REM ============================================================================
@REM REM Script: copy_gcc_folder.bat
@REM REM Usage:  copy_gcc_folder.bat BASE_DIR TARGET_DIR
@REM REM   BASE_DIR   - path to the base directory (without trailing backslash)
@REM REM   TARGET_DIR - path to the directory where you want to copy the folder
@REM REM This script will copy BASE_DIR\gcc-arm-none-eabi into TARGET_DIR.
@REM REM ============================================================================

@REM REM 1) Validate arguments
@REM if "%~1"=="" (
@REM     echo ERROR: No base directory provided.
@REM     echo Usage: %~nx0 BASE_DIR TARGET_DIR
@REM     exit /b 1
@REM )
@REM if "%~2"=="" (
@REM     echo ERROR: No target directory provided.
@REM     echo Usage: %~nx0 BASE_DIR TARGET_DIR
@REM     exit /b 1
@REM )

@REM REM 2) Set variables
@REM set "BASE_DIR=%~1"
@REM set "TARGET_DIR=%~2"
@REM set "SRC_DIR=%BASE_DIR%\gcc-arm-none-eabi\"
@REM set "DEST_DIR=%TARGET_DIR%\gcc-arm-none-eabi\"

@REM REM 3) Check source exists
@REM if not exist "%SRC_DIR%\" (
@REM     echo ERROR: Source directory "%SRC_DIR%" not found.
@REM     exit /b 1
@REM )

@REM REM 4) Ensure target parent exists
@REM if not exist "%TARGET_DIR%\" (
@REM     echo Target directory "%TARGET_DIR%" does not exist. Creating...
@REM     mkdir "%TARGET_DIR%"
@REM     if errorlevel 1 (
@REM         echo ERROR: Failed to create target directory.
@REM         exit /b 1
@REM     )
@REM )

@REM REM 5) Copy the directory
@REM echo Copying "%SRC_DIR%" to "%DEST_DIR%"...
@REM xcopy "%SRC_DIR%\" "%DEST_DIR%\" /E /I /Y >nul
@REM if errorlevel 1 (
@REM     echo ERROR: Copy operation failed.
@REM     exit /b 1
@REM )

@REM echo SUCCESS: "%SRC_DIR%" has been copied to "%DEST_DIR%".
@REM endlocal