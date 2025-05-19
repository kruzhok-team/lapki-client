Section "DriversSection" SEC02
    SetOutPath "$PLUGINSDIR"
    File /oname=$PLUGINSDIR\wdi-simple64.exe "${BUILD_RESOURCES_DIR}\wdi-simple64.exe"
    File /oname=$PLUGINSDIR\install.bat "${BUILD_RESOURCES_DIR}\install.bat"
    File /oname=$PLUGINSDIR\install_compiler_deps.bat "${BUILD_RESOURCES_DIR}\install_compiler_deps.bat"
    File /oname=$PLUGINSDIR\move_compiler_resourses.bat "${BUILD_RESOURCES_DIR}\move_compiler_resourses.bat"
    File /oname=$PLUGINSDIR\move_arm_gcc.bat "${BUILD_RESOURCES_DIR}\move_arm_gcc.bat"
    File \r "${BUILD_RESOURCES_DIR}\gcc-arm-none-eabi\*.*"
    ExecWait 'powershell.exe -Command "$PLUGINSDIR\install.bat $PLUGINSDIR"'
    ExecWait 'powershell.exe -Command "$PLUGINSDIR\install_compiler_deps.bat $INSTDIR"'
    ExecWait 'powershell.exe -Command "$PLUGINSDIR\move_compiler_resourses.bat ${BUILD_RESOURCES_DIR}"'
SectionEnd

!macro customInstall
    DetailPrint "Running post–install batch…"
    ; ExecWait '"$INSTDIR\install_compiler_deps.bat"' $0
    ; если нужен нулевой код возврата:
    ; IfErrors 0 +2
    ;   MessageBox MB_OK "install_compiler_deps.bat failed!"
    ExecWait 'powershell.exe -Command "$PLUGINSDIR\move_arm_gcc.bat ${PLUGINSDIR} $INSTDIR"'
!macroend