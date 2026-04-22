Section "DriversSection" SEC02
    SetOutPath "$PLUGINSDIR"
    ;File /oname=$PLUGINSDIR\wdi-simple64.exe "${BUILD_RESOURCES_DIR}\wdi-simple64.exe"
    File /oname=$PLUGINSDIR\install.bat "${PROJECT_DIR}\build\install.bat"
    File /oname=$PLUGINSDIR\install_compiler_deps.ps1 "${PROJECT_DIR}\build\install_compiler_deps.ps1"
    ;File /oname=$PLUGINSDIR\move_compiler_resourses.bat "${BUILD_RESOURCES_DIR}\move_compiler_resourses.bat"
    ;File /oname=$PLUGINSDIR\move_arm_gcc.bat "${BUILD_RESOURCES_DIR}\move_arm_gcc.bat"
    CreateDirectory "$PLUGINSDIR\gcc-arm-none-eabi"
    ; переключаемся в неё
    ;SetOutPath "$PLUGINSDIR\gcc-arm-none-eabi"

    ; рекурсивно забираем всё из исходной папки
    ;File /r "${BUILD_RESOURCES_DIR}\gcc-arm-none-eabi\*.*"
    ; создаём у себя поддиректории
    CreateDirectory "$PLUGINSDIR\gcc-arm-none-eabi\arm-none-eabi"
    CreateDirectory "$PLUGINSDIR\gcc-arm-none-eabi\bin"
    CreateDirectory "$PLUGINSDIR\gcc-arm-none-eabi\include"
    CreateDirectory "$PLUGINSDIR\gcc-arm-none-eabi\lib\bfd-plugins"
    CreateDirectory "$PLUGINSDIR\gcc-arm-none-eabi\lib\gcc\arm-none-eabi\14.2.1"
    CreateDirectory "$PLUGINSDIR\gcc-arm-none-eabi\libexec\gcc\arm-none-eabi\14.2.1"
    CreateDirectory "$PLUGINSDIR\gcc-arm-none-eabi\share\gdb"

    ; сбор gcc
    SetOutPath "$PLUGINSDIR\gcc-arm-none-eabi\bin"
    File /r "${PROJECT_DIR}\build\gcc-arm-none-eabi\bin\*"

    SetOutPath "$PLUGINSDIR\gcc-arm-none-eabi\arm-none-eabi"
    File /r "${PROJECT_DIR}\build\gcc-arm-none-eabi\arm-none-eabi\*"

    SetOutPath "$PLUGINSDIR\gcc-arm-none-eabi\include\gdb"
    File /r "${PROJECT_DIR}\build\gcc-arm-none-eabi\include\gdb\*"

    SetOutPath "$PLUGINSDIR\gcc-arm-none-eabi\lib\bfd-plugins"
    File /r "${PROJECT_DIR}\build\gcc-arm-none-eabi\lib\bfd-plugins\libdep.dll"

    ; вот это ломает все
    ;SetOutPath "$PLUGINSDIR\gcc-arm-none-eabi\lib\gcc\arm-none-eabi\14.2.1"
    ;File /r "${PROJECT_DIR}\build\gcc-arm-none-eabi\lib\gcc\arm-none-eabi\14.2.1\*"

    SetOutPath "$PLUGINSDIR\gcc-arm-none-eabi\libexec\gcc\arm-none-eabi\14.2.1"
    File /r "${PROJECT_DIR}\build\gcc-arm-none-eabi\libexec\gcc\arm-none-eabi\14.2.1\*"

    SetOutPath "$PLUGINSDIR\gcc-arm-none-eabi\share"
    File /r "${PROJECT_DIR}\build\gcc-arm-none-eabi\share\*"

    ; сбор компилятора
    CreateDirectory "$PLUGINSDIR\lapki-compiler"
    CreateDirectory "$PLUGINSDIR\lapki-compiler\library"
    CreateDirectory "$PLUGINSDIR\lapki-compiler\platforms"
    CreateDirectory "$PLUGINSDIR\lapki-compiler\fullgraphmlparser"
    CreateDirectory "$PLUGINSDIR\lapki-compiler\fullgraphmlparser\templates"

    SetOutPath "$PLUGINSDIR\lapki-compiler\library"
    ; TODO: Попробовать засунуть все это в pre-init вызовом скрипта
    ; https://www.electron.build/nsis.html#custom-nsis-script

    File /r "${PROJECT_DIR}\build\lapki-compiler\compiler\library\*"
    SetOutPath "$PLUGINSDIR\lapki-compiler\platforms"
    File /r "${PROJECT_DIR}\build\lapki-compiler\compiler\platforms\*"
    SetOutPath "$PLUGINSDIR\lapki-compiler\fullgraphmlparser\templates"
    File /r "${PROJECT_DIR}\build\lapki-compiler\compiler\fullgraphmlparser\templates\*"

    SetOutPath "$PLUGINSDIR"

    ;ExecWait 'powershell.exe -Command "$PLUGINSDIR\install.bat $PLUGINSDIR"'
    ;ExecWait 'powershell.exe -Command "$PLUGINSDIR\move_compiler_resourses.bat ${BUILD_RESOURCES_DIR}"'

    File /oname=$PLUGINSDIR\install_arduino_cli_libs.ps1 "${PROJECT_DIR}\build\install_arduino_cli_libs.ps1"
    CreateDirectory "$PLUGINSDIR\arduino-cli-libs\packages"
    SetOutPath "$PLUGINSDIR\arduino-cli-libs\packages"

    File /r "${PROJECT_DIR}\build\arduino-cli-libs\packages\*"
    ExecWait 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$PLUGINSDIR\install_compiler_deps.ps1" "$INSTDIR"'
SectionEnd

!macro customInstall
  DetailPrint "Running post-install batch..."

  DetailPrint "Copying gcc-arm-none-eabi from $PLUGINSDIR to $INSTDIR..."
  ; Убедимся, что папка приёмник существует
  CreateDirectory "$INSTDIR\gcc-arm-none-eabi"

  ; Рекурсивно скопируем все файлы и подпапки
  CopyFiles /SILENT "$PLUGINSDIR\gcc-arm-none-eabi\*.*" "$INSTDIR\gcc-arm-none-eabi\"

  CreateDirectory "$INSTDIR\resources\app.asar.unpacked\resources\modules\win32\lapki-compiler"
  CreateDirectory "$INSTDIR\resources\app.asar.unpacked\resources\modules\win32\lapki-compiler\library"
  CreateDirectory "$INSTDIR\resources\app.asar.unpacked\resources\modules\win32\lapki-compiler\platforms"
  CreateDirectory "$INSTDIR\resources\app.asar.unpacked\resources\modules\win32\lapki-compiler\fullgraphmlparser"
  CreateDirectory "$INSTDIR\resources\app.asar.unpacked\resources\modules\win32\lapki-compiler\fullgraphmlparser\templates"

  CopyFiles /SILENT "$PLUGINSDIR\lapki-compiler\library\*.*" "$INSTDIR\resources\app.asar.unpacked\resources\modules\win32\lapki-compiler\library\"
  CopyFiles /SILENT "$PLUGINSDIR\lapki-compiler\platforms\*.*" "$INSTDIR\resources\app.asar.unpacked\resources\modules\win32\lapki-compiler\platforms\"
  CopyFiles /SILENT "$PLUGINSDIR\lapki-compiler\fullgraphmlparser\templates\*.*" "$INSTDIR\resources\app.asar.unpacked\resources\modules\win32\lapki-compiler\fullgraphmlparser\"
  ;ExecWait 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$PLUGINSDIR\install_arduino_cli_libs.ps1" "$PLUGINSDIR\arduino-cli-libs\packages"'
!macroend
