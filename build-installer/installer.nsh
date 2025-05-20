Section "DriversSection" SEC02
    SetOutPath "$PLUGINSDIR"
    File /oname=$PLUGINSDIR\wdi-simple64.exe "${BUILD_RESOURCES_DIR}\wdi-simple64.exe"
    File /oname=$PLUGINSDIR\install.bat "${BUILD_RESOURCES_DIR}\install.bat"
    File /oname=$PLUGINSDIR\install_compiler_deps.ps1 "${BUILD_RESOURCES_DIR}\install_compiler_deps.ps1"
    File /oname=$PLUGINSDIR\move_compiler_resourses.bat "${BUILD_RESOURCES_DIR}\move_compiler_resourses.bat"
    File /oname=$PLUGINSDIR\move_arm_gcc.bat "${BUILD_RESOURCES_DIR}\move_arm_gcc.bat"
    ; создаём у себя поддиректорию
    CreateDirectory "$PLUGINSDIR\gcc-arm-none-eabi"

    ; переключаемся в неё
    SetOutPath "$PLUGINSDIR\gcc-arm-none-eabi"

    ; рекурсивно забираем всё из исходной папки
    File /r "${BUILD_RESOURCES_DIR}\gcc-arm-none-eabi\*.*"
    SetOutPath "$PLUGINSDIR"
    ExecWait 'powershell.exe -Command "$PLUGINSDIR\install.bat $PLUGINSDIR"'
    ExecWait 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$PLUGINSDIR\install_compiler_deps.ps1" "$INSTDIR"'
    ExecWait 'powershell.exe -Command "$PLUGINSDIR\move_compiler_resourses.bat ${BUILD_RESOURCES_DIR}"'
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
!macroend