@echo off
@REM if "%PROCESSOR_ARCHITECTURE%" == "x86" (
@REM     if defined PROCESSOR_ARCHITEW6432 (
@REM         echo "64 os, but script is running in 32-mode (WOW64)"
@REM         .\wdi-simple32.exe -t 1 -b
@REM     ) else (
@REM         echo "32 bit os"
@REM         start /wait .\wdi-simple32.exe -t 1 -b
@REM     )
@REM ) else (


setlocal enabledelayedexpansion
if "%~1"=="" (
    echo Ошибка: Аргумент не указан.
    exit /b 1
)

set "arg=%~1"
echo !arg!

set "last_char=!arg:~-1!"
if !last_char!==^" (
    set "arg=!arg:~0,-1!"
)
set "result=!arg!\wdi-simple64.exe"
echo "64 bit os"
echo "!result!" -t 1 -b
start "Install drivers..." /WAIT "!result!" -t 1 -b
timeout /t 10 /nobreak >nul
@REM )

@REM powershell -Command "&'C:\Users\karto\OneDrive\Рабочий стол\Программирование\lapki-client\build\install.bat' -ArgumentList  'C:\Users\karto\OneDrive\Рабочий стол\Программирование\lapki-client\build'"             
@REM powershell -Command "& 'C:\Users\karto\OneDrive\Рабочий стол\Программирование\lapki-client\build\install.bat' '\"C:\Users\karto\OneDrive\Рабочий стол\Программирование\lapki-client\build\"'"       