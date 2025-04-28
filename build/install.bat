@echo off
setlocal enabledelayedexpansion

FSUTIL DIRTY query %SystemDrive% >NUL || (
    PowerShell "Start-Process -FilePath cmd.exe -Wait -Args '/C CHDIR /D %CD% & ""%0" %*"' -Verb RunAs"
    EXIT
)

@REM if "%PROCESSOR_ARCHITECTURE%" == "x86" (
@REM     if defined PROCESSOR_ARCHITEW6432 (
@REM         echo "64 os, but script is running in 32-mode (WOW64)"
@REM         .\wdi-simple32.exe -t 1 -b
@REM     ) else (
@REM         echo "32 bit os"
@REM         start /wait .\wdi-simple32.exe -t 1 -b
@REM     )
@REM ) else (

if "%~1"=="" (
    echo Error: No argument provided.
    pause
    exit /b 1
)

set "arg=%~1"
echo !arg!

set "last_char=!arg:~-1!"
if !last_char!==^" (
    set "arg=!arg:~0,-1!"
)
set "result=!arg!\wdi-simple64.exe"
echo Installing drivers for CyberBear. Sit tight!
@REM echo "!result!" -t 1 -l 0 -v 0x1209 -p 0xAC01
start "Install drivers..." /WAIT "!result!" -t 1 -l 0 -v 0x1209 -p 0xAC01 -n "КиберМишка"
