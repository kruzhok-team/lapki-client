@REM @echo off
@REM setlocal enabledelayedexpansion

@REM REM Check if BUILD_RESOURSES_DIR is provided
@REM if "%~1"=="" (
@REM     echo Error: BUILD_RESOURSES_DIR parameter is required
@REM     exit /b 1
@REM )

@REM set "BUILD_RESOURSES_DIR=%~1\lapki-compiler\compiler"
@REM set "TARGET_DIR=%BUILD_RESOURSES_DIR%\..\..\..\resources\modules\win32\lapki-compiler"

@REM REM Create target directory if it doesn't exist
@REM if not exist %TARGET_DIR% mkdir %TARGET_DIR%

@REM REM Move platforms directory
@REM if exist %BUILD_RESOURSES_DIR%\platforms (
@REM     xcopy /E /I /Y %BUILD_RESOURSES_DIR%\platforms %TARGET_DIR%\platforms
@REM     echo Moved platforms directory
@REM )

@REM REM Move library directory
@REM if exist %BUILD_RESOURSES_DIR%\library (
@REM     xcopy /E /I /Y %BUILD_RESOURSES_DIR%\library %TARGET_DIR%\library
@REM     echo Moved library directory
@REM )

@REM REM Move fullgraphmlparser\templates directory
@REM if exist %BUILD_RESOURSES_DIR%\fullgraphmlparser\templates (
@REM     xcopy /E /I /Y %BUILD_RESOURSES_DIR%\fullgraphmlparser\templates %TARGET_DIR%\fullgraphmlparser\templates
@REM     echo Moved fullgraphmlparser\templates directory
@REM )

@REM echo Resource movement completed successfully
@REM exit /b 0
