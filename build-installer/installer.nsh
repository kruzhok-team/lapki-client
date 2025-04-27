!include "LogicLib.nsh"
Section "DriversSection" SEC02
    File /oname=$PLUGINSDIR\wdi-simple64.exe "${BUILD_RESOURCES_DIR}\wdi-simple64.exe"
    File /oname=$PLUGINSDIR\install.bat "${BUILD_RESOURCES_DIR}\install.bat"
    ExecWait 'powershell.exe -Command "$PLUGINSDIR\install.bat $PLUGINSDIR"'
SectionEnd

