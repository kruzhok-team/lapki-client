@REM @echo off
@REM setlocal enabledelayedexpansion
@REM chcp 1251 > nul
@REM FSUTIL DIRTY query %SystemDrive% >NUL || (
@REM     PowerShell "Start-Process -FilePath cmd.exe -Wait -Args '/C CHDIR /D %CD% & ""%0" %*"' -Verb RunAs"
@REM     EXIT
@REM )

@REM @REM if "%PROCESSOR_ARCHITECTURE%" == "x86" (
@REM @REM     if defined PROCESSOR_ARCHITEW6432 (
@REM @REM         echo "64 os, but script is running in 32-mode (WOW64)"
@REM @REM         .\wdi-simple32.exe -t 1 -b
@REM @REM     ) else (
@REM @REM         echo "32 bit os"
@REM @REM         start /wait .\wdi-simple32.exe -t 1 -b
@REM @REM     )
@REM @REM ) else (

@REM if "%~1"=="" (
@REM     echo Error: No argument provided.
@REM     pause
@REM     exit /b 1
@REM )

@REM set "arg=%~1"
@REM echo !arg!

@REM set "last_char=!arg:~-1!"
@REM if !last_char!==^" (
@REM     set "arg=!arg:~0,-1!"
@REM )
@REM set "result=!arg!\wdi-simple64.exe"
@REM echo Installing drivers for CyberBear. Sit tight!
@REM @REM TODO: Установка драйверов МС-ТЮК
@REM @REM echo "!result!" -t 1 -l 0 -v 0x1209 -p 0xAC01
@REM @REM TODO: Проблема с передачей кириллицы в качестве аргумента
@REM @REM Перевод в UTF-8 не помогает, а с кириллицей он начинает ругаться
@REM @REM Если медведь сохранил плохое название, то wdi-simple будет отваливаться от переполнения
@REM @REM В таком случае нужно удалять устройство вручную
@REM start "Install drivers..." /WAIT "!result!" -t 1 -l 0 -v 0x1209 -p 0xAC01 -n "CyberBear"
