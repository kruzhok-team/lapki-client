!macro customInit
  IfFileExists "$EXEDIR\setup_data\gcc-arm-none-eabi.zip" +3 0
    MessageBox MB_ICONSTOP|MB_OK "Не могу найти setup_data\gcc-arm-none-eabi.zip. Это часть установочного комплекта. Убедитесь, что вы скачали комплект полностью и разархивировали перед запуском."
    Abort

  IfFileExists "$EXEDIR\setup_data\irpcb\bin\*.*" +3 0
    MessageBox MB_ICONSTOP|MB_OK "Не могу найти setup_data\irpcb\bin. Это часть установочного комплекта. Убедитесь, что вы скачали комплект полностью и разархивировали перед запуском."
    Abort

  IfFileExists "$EXEDIR\setup_data\arduino-cli-libs.zip" +3 0
    MessageBox MB_ICONSTOP|MB_OK "Не могу найти setup_data\arduino-cli-libs.zip. Это часть установочного комплекта. Убедитесь, что вы скачали комплект полностью и разархивировали перед запуском."
    Abort

  IfFileExists "$EXEDIR\setup_data\lapki-compiler\library\*.*" +3 0
    MessageBox MB_ICONSTOP|MB_OK "Не могу найти setup_data\lapki-compiler\library. Это часть установочного комплекта. Убедитесь, что вы скачали комплект полностью и разархивировали перед запуском."
    Abort

  IfFileExists "$EXEDIR\setup_data\lapki-compiler\platforms\*.*" +3 0
    MessageBox MB_ICONSTOP|MB_OK "Не могу найти setup_data\lapki-compiler\platforms. Это часть установочного комплекта. Убедитесь, что вы скачали комплект полностью и разархивировали перед запуском."
    Abort

  IfFileExists "$EXEDIR\setup_data\lapki-compiler\fullgraphmlparser\templates\*.*" +3 0
    MessageBox MB_ICONSTOP|MB_OK "Не могу найти setup_data\lapki-compiler\fullgraphmlparser\templates. Это часть установочного комплекта. Убедитесь, что вы скачали комплект полностью и разархивировали перед запуском."
    Abort
!macroend

!macro customInstall
  SetOutPath "$PLUGINSDIR"
  File /oname=$PLUGINSDIR\install_payload.ps1 "${BUILD_RESOURCES_DIR}\install_payload.ps1"
  File /oname=$PLUGINSDIR\install_compiler_deps.ps1 "${BUILD_RESOURCES_DIR}\install_compiler_deps.ps1"
  File /oname=$PLUGINSDIR\install_arduino_cli_libs.ps1 "${BUILD_RESOURCES_DIR}\install_arduino_cli_libs.ps1"
  DetailPrint "Running external setup data installer..."
  ExecWait 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$PLUGINSDIR\install_payload.ps1" -InstallDir "$INSTDIR" -SetupDataDir "$EXEDIR\setup_data"' $0
  StrCmp $0 0 payload_done

  MessageBox MB_ICONSTOP|MB_OK "Не могу найти setup_data. Это часть установочного комплекта. Убедитесь, что вы скачали комплект полностью и разархивировали перед запуском."
  Abort

  payload_done:
!macroend
