@echo off
setlocal enabledelayedexpansion

REM Check if BUILD_RESOURSES_DIR is provided
if "%~1"=="" (
    echo Error: BUILD_RESOURSES_DIR parameter is required
    exit /b 1
)

set "BUILD_RESOURSES_DIR=%~1\lapki-compiler\compiler"
set "TARGET_DIR=%BUILD_RESOURSES_DIR%\..\..\..\resources\modules\win32\lapki-compiler"

REM Create target directory if it doesn't exist
if not exist %TARGET_DIR% mkdir %TARGET_DIR%

REM Move platforms directory
if exist %BUILD_RESOURSES_DIR%\platforms (
    xcopy /E /I /Y %BUILD_RESOURSES_DIR%\platforms %TARGET_DIR%\platforms
    echo Moved platforms directory
)

REM Move library directory
if exist %BUILD_RESOURSES_DIR%\library (
    xcopy /E /I /Y %BUILD_RESOURSES_DIR%\library %TARGET_DIR%\library
    echo Moved library directory
)

REM Move fullgraphmlparser\templates directory
if exist %BUILD_RESOURSES_DIR%\fullgraphmlparser\templates (
    xcopy /E /I /Y %BUILD_RESOURSES_DIR%\fullgraphmlparser\templates %TARGET_DIR%\fullgraphmlparser\templates
    echo Moved fullgraphmlparser\templates directory
)

echo Resource movement completed successfully
exit /b 0
