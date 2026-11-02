#!/bin/bash
# Compatible with the system Bash 3.2 on macOS Catalina.
set -euo pipefail

if [[ "$(uname -s)" != Darwin ]]; then
  echo 'Этот скрипт предназначен для macOS.' >&2
  exit 1
fi

if [[ $# -gt 1 ]]; then
  echo "Использование: bash \"$0\" \"/Applications/Cyberiada IDE.app\"" >&2
  exit 1
fi

echo 'Полностью закройте Cyberiada IDE перед исправлением.'
if [[ $# -eq 1 ]]; then
  app_path="$1"
else
  # A native picker avoids guessing the app name or repairing another copy.
  app_path=$(osascript -e 'POSIX path of (choose file with prompt "Выберите установленную Cyberiada IDE в папке Программы (не внутри DMG)" of type {"com.apple.application-bundle"})')
fi

if [[ ! -d "$app_path/Contents" ]]; then
  echo "Не найден пакет приложения: $app_path" >&2
  exit 1
fi
app_path=$(cd "$app_path" && pwd -P)
case "$app_path" in
  /Volumes/*)
    echo 'Сначала скопируйте IDE из DMG в папку Программы и выберите установленное приложение.' >&2
    exit 1
    ;;
esac

interpreter_path="$app_path/Contents/Resources/app.asar.unpacked/resources/modules/darwin/sm-interpreter"
if [[ ! -f "$interpreter_path" || -L "$interpreter_path" ]]; then
  echo "Не найден обычный файл интерпретатора: $interpreter_path" >&2
  echo 'Скопируйте приложение из DMG в папку Программы с заменой и повторите запуск скрипта.' >&2
  exit 1
fi

ls -l "$interpreter_path"
if [[ -x "$interpreter_path" ]]; then
  echo 'Право на выполнение уже есть. Этот скрипт не устранит другие причины CONN_ERR.'
  exit 0
fi

if [[ -O "$interpreter_path" ]]; then
  chmod u+x "$interpreter_path"
else
  echo 'Файл принадлежит другому пользователю. sudo запросит пароль администратора для изменения его прав.'
  sudo chmod a+x "$interpreter_path"
fi

if [[ ! -x "$interpreter_path" ]]; then
  echo 'Не удалось предоставить текущему пользователю право на выполнение.' >&2
  exit 1
fi
ls -l "$interpreter_path"
echo 'Право на выполнение восстановлено. Запустите Cyberiada IDE и проверьте подключение к симулятору.'
