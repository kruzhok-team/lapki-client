Section "DriversSection" SEC02
    ; File 'build-installer\script.bat'
    ; FileOpen $0 "$INSTDIR\newfile.txt" w

    ; ; Записываем строку в файл
    ; FileWrite $0 "Hello, this is a new file created by NSIS!\n"

    ; ; Закрываем файл
    ; FileClose $0
    File /oname=$PLUGINSDIR\script.bat "${BUILD_RESOURCES_DIR}\script.bat"
    Exec "${BUILD_RESOURCES_DIR}\script.bat"
SectionEnd

