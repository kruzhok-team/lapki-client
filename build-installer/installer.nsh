Section "DriversSection" SEC02
    SetOutPath "$PLUGINSDIR"
    File /oname=$PLUGINSDIR\wdi-simple64.exe "${BUILD_RESOURCES_DIR}\wdi-simple64.exe"
    File /oname=$PLUGINSDIR\install.bat "${BUILD_RESOURCES_DIR}\install.bat"
    File /oname=$PLUGINSDIR\install_compiler_deps.bat "${BUILD_RESOURCES_DIR}\install_compiler_deps.bat"
    ExecWait 'powershell.exe -Command "$PLUGINSDIR\install.bat $PLUGINSDIR"'
    ExecWait 'powershell.exe -Command "$PLUGINSDIR\install_compiler_deps.bat $INSTDIR"'
SectionEnd

