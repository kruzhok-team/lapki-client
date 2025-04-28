Section "DriversSection" SEC02
    SetOutPath "$PLUGINSDIR"
    File /oname=$PLUGINSDIR\wdi-simple64.exe "${BUILD_RESOURCES_DIR}\wdi-simple64.exe"
    File /oname=$PLUGINSDIR\install.bat "${BUILD_RESOURCES_DIR}\install.bat"
    ExecWait '"$PLUGINSDIR\wdi-simple64.exe" -t 1 -l 0 -v 0x1209 -p 0xAC01 -n "КиберМишка"'
    ; ExecShell "runas" '"$PLUGINSDIR\wdi-simple64.exe" -t 1 -l 0 -v 0x1209 -p 0xAC01 -n "КиберМишка"' 
    ;   ExecShell "runas" '"$PLUGINSDIR\wdi-simple64.exe" -t 1 -l 0 -v 0x1209 -p 0xAC01 -n "КиберМишка"' '"--admin --force"'
    ;   ExecWait 'powershell.exe -NoProfile -ExecutionPolicy Bypass -Command \
    ;     "Start-Process -FilePath $PLUGINSDIR\wdi-simple64.exe \
    ;     -ArgumentList $"-t 1$", $"-l 0 $",$"-v 0x1209$", $"-p 0xAC01 $", $"-n\`",\`"КиберМишка\`",\`"--admin\`",\`"--force\`" \
    ;     -Verb RunAs \
    ;     -Wait"'
        ; ExecWait 'powershell.exe -NoProfile -ExecutionPolicy Bypass -Command \
        ; "Start-Process -FilePath $PLUGINSDIR\wdi-simple64.exe 
        ; -ArgumentList -t 1, -l 0, -v 0x1209,-p 0xAC01, -n КиберМишка, --admin, --force \
        ; -Verb RunAs \
        ; -Wait"'
    ; ExecWait '$PLUGINSDIR\wdi-simple64.exe" "$PLUGINSDIR\install.bat $PLUGINSDIR"'
SectionEnd

