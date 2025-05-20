Section "DriversSection" SEC02
    SetOutPath "$PLUGINSDIR"
    File /oname=$PLUGINSDIR\wdi-simple64.exe "${BUILD_RESOURCES_DIR}\wdi-simple64.exe"
    File /oname=$PLUGINSDIR\install.bat "${BUILD_RESOURCES_DIR}\install.bat"
    File /oname=$PLUGINSDIR\install_compiler_deps.ps1 "${BUILD_RESOURCES_DIR}\install_compiler_deps.ps1"
    ;File /oname=$PLUGINSDIR\move_compiler_resourses.bat "${BUILD_RESOURCES_DIR}\move_compiler_resourses.bat"
    ;File /oname=$PLUGINSDIR\move_arm_gcc.bat "${BUILD_RESOURCES_DIR}\move_arm_gcc.bat"

    ; создаём у себя поддиректорию
    CreateDirectory "$PLUGINSDIR\gcc-arm-none-eabi"

    ; переключаемся в неё
    SetOutPath "$PLUGINSDIR\gcc-arm-none-eabi"

    ; рекурсивно забираем всё из исходной папки
    File /r "${BUILD_RESOURCES_DIR}\gcc-arm-none-eabi\*.*"


    CreateDirectory "$PLUGINSDIR\lapki-compiler"
    CreateDirectory "$PLUGINSDIR\lapki-compiler\library"
    CreateDirectory "$PLUGINSDIR\lapki-compiler\platforms"
    CreateDirectory "$PLUGINSDIR\lapki-compiler\fullgraphmlparser"
    CreateDirectory "$PLUGINSDIR\lapki-compiler\fullgraphmlparser\templates"
    ; переключаемся в неё
    SetOutPath "$PLUGINSDIR\lapki-compiler\library"

    ; TODO: Попробовать засунуть все это в pre-init вызовом скрипта
    ; рекурсивно забираем всё из исходной папки
    File /r "${BUILD_RESOURCES_DIR}\lapki-compiler\compiler\library\*.*"
    SetOutPath "$PLUGINSDIR\lapki-compiler\platforms"
    File /r "${BUILD_RESOURCES_DIR}\lapki-compiler\compiler\platforms\"
    SetOutPath "$PLUGINSDIR\lapki-compiler\fullgraphmlparser\templates"
    File /r "${BUILD_RESOURCES_DIR}\lapki-compiler\compiler\fullgraphmlparser\templates"

    SetOutPath "$PLUGINSDIR"
    
    ExecWait 'powershell.exe -Command "$PLUGINSDIR\install.bat $PLUGINSDIR"'
    ExecWait 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$PLUGINSDIR\install_compiler_deps.ps1" "$INSTDIR"'
    ;ExecWait 'powershell.exe -Command "$PLUGINSDIR\move_compiler_resourses.bat ${BUILD_RESOURCES_DIR}"'
SectionEnd

!macro customInstall
  DetailPrint "Running post–install batch…"

  DetailPrint "Copying gcc-arm-none-eabi from $PLUGINSDIR to $INSTDIR…"  
  ; Убедимся, что папка приёмник существует  
  CreateDirectory "$INSTDIR\gcc-arm-none-eabi"

  ; Рекурсивно скопируем все файлы и подпапки  
  CopyFiles /SILENT "$PLUGINSDIR\gcc-arm-none-eabi\*.*" "$INSTDIR\gcc-arm-none-eabi\"
  ; Удалим временную директорию (чтобы не оставлять мусор)  
  RMDir /r "$PLUGINSDIR\gcc-arm-none-eabi"

  DetailPrint "Done. INSTDIR now contains:"  
  DetailPrint "  $INSTDIR\gcc-arm-none-eabi"  

  CreateDirectory "$INSTDIR\resources\app.asar.unpacked\resources\modules\win32\lapki-compiler"
  CreateDirectory "$INSTDIR\resources\app.asar.unpacked\resources\modules\win32\lapki-compiler\library"
  CreateDirectory "$INSTDIR\resources\app.asar.unpacked\resources\modules\win32\lapki-compiler\platforms"
  CreateDirectory "$INSTDIR\resources\app.asar.unpacked\resources\modules\win32\lapki-compiler\fullgraphmlparser"
  CreateDirectory "$INSTDIR\resources\app.asar.unpacked\resources\modules\win32\lapki-compiler\fullgraphmlparser\templates"

  CopyFiles /SILENT "$PLUGINSDIR\lapki-compiler\library\*.*" "$INSTDIR\resources\app.asar.unpacked\resources\modules\win32\lapki-compiler\library\"
  CopyFiles /SILENT "$PLUGINSDIR\lapki-compiler\platforms\*.*" "$INSTDIR\resources\app.asar.unpacked\resources\modules\win32\lapki-compiler\platforms\"
  SetOutPath     "$INSTDIR\resources\app.asar.unpacked\resources\modules\win32\lapki-compiler\fullgraphmlparser\templates"
  File /r "${BUILD_RESOURCES_DIR}\lapki-compiler\fullgraphmlparser\templates\*.*"
  ;CopyFiles /SILENT "$PLUGINSDIR\lapki-compiler\fullgraphmlparser\templates\*.*" "$INSTDIR\resources\app.asar.unpacked\resources\modules\win32\lapki-compiler\fullgraphmlparser\templates\"
!macroend