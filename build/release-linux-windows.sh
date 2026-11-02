#!/usr/bin/env bash
set -euo pipefail

# This is the common release body used both locally in Docker and by GitHub
# Actions.  Downloads may be overridden with version-pinned URLs in CI.
avrdude_url="${AVRDUDE_URL:-https://github.com/avrdudes/avrdude/releases/download/v8.0/avrdude-v8.0-windows-x86.zip}"
arduino_cli_url="${ARDUINO_CLI_URL:-https://github.com/arduino/arduino-cli/releases/download/v1.5.1/arduino-cli_1.5.1_Windows_64bit.zip}"
arduino_cli_linux_url="${ARDUINO_CLI_LINUX_URL:-https://github.com/arduino/arduino-cli/releases/download/v1.5.1/arduino-cli_1.5.1_Linux_64bit.tar.gz}"
# developer.arm.com is unavailable from some release networks. ArduPilot hosts
# the same versioned upstream archive; set ARM_GCC_LINUX_URL for an internal
# mirror when needed.
arm_gcc_linux_url="${ARM_GCC_LINUX_URL:-https://firmware.ardupilot.org/Tools/STM32-tools/gcc-arm-none-eabi-10-2020-q4-major-x86_64-linux.tar.bz2}"
arm_gcc_url="${ARM_GCC_URL:-https://seafile.polyus-nt.ru/f/83d0be836d1c491fa3b3/?dl=1}"
irpcb_url="${IRPCB_URL:-https://seafile.polyus-nt.ru/f/6377a640bc344e31bd6d/?dl=1}"
release_download_cache="${RELEASE_DOWNLOAD_CACHE:-${XDG_CACHE_HOME:-$HOME/.cache}/lapki-release}"
release_linux_targets="${RELEASE_LINUX_TARGETS:-AppImage snap deb}"
release_seafile_staging="${RELEASE_SEAFILE_STAGING:-0}"
release_skip_linux="${RELEASE_SKIP_LINUX:-0}"
release_skip_windows="${RELEASE_SKIP_WINDOWS:-0}"
release_artifacts_dist_dir="${RELEASE_ARTIFACTS_DIST_DIR:-${RELEASE_ARTIFACTS_DIR:+$RELEASE_ARTIFACTS_DIR/dist}}"
release_artifacts_outputs_dir="${RELEASE_ARTIFACTS_OUTPUTS_DIR:-${RELEASE_ARTIFACTS_DIR:+$RELEASE_ARTIFACTS_DIR/outputs}}"
project_root="$(pwd)"
linux_stage=""
windows_stage=""

download() {
  local url="$1"
  local target="$2"
  local cache_key
  local cache_file
  cache_key="$(printf '%s' "$url" | sha256sum | awk '{print $1}')"
  cache_file="$release_download_cache/$cache_key"

  mkdir -p "$release_download_cache"
  if [[ ! -f "$cache_file" ]]; then
    wget --https-only --no-verbose --output-document="$cache_file.part" "$url"
    mv "$cache_file.part" "$cache_file"
  fi
  cp "$cache_file" "$target"
}

verify_linux_package() {
  local package_root="$1"
  local linux_target="$2"
  local unpacked_resources="$package_root/resources/app.asar.unpacked/resources"
  local gcc_path
  local windows_module_path
  local interpreter_path
  local cyberbear_loader_path
  local arduino_core_marker
  local arduino_cli_path
  local avr_lto_plugin
  local arm_gcc_path
  local arm_gcc_runtime_file
  local flasher_libusb_path
  local avrdude_path
  local avrdude_config_path
  if [[ "$linux_target" == 'deb' ]]; then
    gcc_path="$(find "$package_root" -iname '*gcc-arm-none-eabi*' -print -quit)"
    if [[ -n "$gcc_path" ]]; then
      echo "DEB unexpectedly contains an ARM GCC toolchain: $gcc_path" >&2
      exit 1
    fi
  else
    arm_gcc_path="$unpacked_resources/toolchains/linux/gcc-arm-none-eabi/bin/arm-none-eabi-g++"
    if [[ ! -x "$arm_gcc_path" ]]; then
      echo "$linux_target does not contain an executable bundled ARM GCC." >&2
      exit 1
    fi
    for arm_gcc_runtime_file in crti.o crtbegin.o libstdc++.a libm.a; do
      arm_gcc_runtime_file="$("$arm_gcc_path" -print-file-name="$arm_gcc_runtime_file")"
      if [[ ! -f "$arm_gcc_runtime_file" ]]; then
        echo "$linux_target ARM GCC is incomplete: $arm_gcc_runtime_file is unavailable." >&2
        exit 1
      fi
    done
  fi
  windows_module_path="$(find "$unpacked_resources/modules/win32" -type f -print -quit 2>/dev/null || true)"
  if [[ -n "$windows_module_path" ]]; then
    echo "Linux package unexpectedly contains a Windows module: $windows_module_path" >&2
    exit 1
  fi
  interpreter_path="$unpacked_resources/modules/linux/sm-interpreter"
  if [[ ! -x "$interpreter_path" ]]; then
    echo "Linux package does not contain an executable sm-interpreter: $interpreter_path" >&2
    exit 1
  fi
  cyberbear_loader_path="$unpacked_resources/modules/linux/blg-mb/cyberbear-loader"
  if [[ ! -x "$cyberbear_loader_path" ]]; then
    echo "Linux package does not contain an executable cyberbear-loader: $cyberbear_loader_path" >&2
    exit 1
  fi
  if [[ "$linux_target" != 'deb' ]]; then
    flasher_libusb_path="$unpacked_resources/modules/linux/lib/libusb-1.0.so.0"
    if [[ ! -f "$flasher_libusb_path" ]]; then
      echo "Linux package does not contain libusb for lapki-flasher." >&2
      exit 1
    fi
    avrdude_path="$unpacked_resources/modules/linux/avrdude"
    avrdude_config_path="$unpacked_resources/modules/linux/avrdude.conf"
    if [[ ! -x "$avrdude_path" ]] || [[ ! -f "$avrdude_config_path" ]]; then
      echo "Linux package does not contain bundled avrdude and its configuration." >&2
      exit 1
    fi
    if LD_LIBRARY_PATH="$unpacked_resources/modules/linux/lib" ldd "$avrdude_path" | grep -q 'not found'; then
      echo "Bundled avrdude has unresolved shared-library dependencies." >&2
      exit 1
    fi
  fi
  arduino_core_marker="$unpacked_resources/arduino-cli-data/linux/.lapki-arduino-avr-core-version"
  if [[ ! -f "$arduino_core_marker" ]]; then
    echo "Linux package does not contain the bundled Arduino AVR core." >&2
    exit 1
  fi
  # Arduino's unversioned plugin is a symlink to liblto_plugin.so.0.0.0.
  # Do not use `find -type f`: it would reject the valid symlink.
  avr_lto_plugin="$(find "$unpacked_resources/arduino-cli-data/linux/packages/arduino/tools/avr-gcc" -name liblto_plugin.so -print -quit 2>/dev/null || true)"
  if [[ -z "$avr_lto_plugin" || ! -e "$avr_lto_plugin" ]]; then
    echo "Linux package does not contain AVR GCC's liblto_plugin.so." >&2
    exit 1
  fi
  arduino_cli_path="$unpacked_resources/toolchains/linux/arduino-cli/arduino-cli"
  if [[ ! -x "$arduino_cli_path" ]]; then
    echo "Linux package does not contain an executable Arduino CLI: $arduino_cli_path" >&2
    exit 1
  fi
  if [[ -e "$unpacked_resources/arduino-cli-data/win32" ]]; then
    echo "Linux package unexpectedly contains Windows Arduino AVR core data." >&2
    exit 1
  fi
}

copy_linux_artifact() {
  local linux_target="$1"
  local artifact_pattern
  local artifact_destination
  local artifacts

  case "$linux_target" in
    AppImage) artifact_pattern='*.AppImage' ;;
    snap) artifact_pattern='*.snap' ;;
    deb) artifact_pattern='*.deb' ;;
    rpm) artifact_pattern='*.rpm' ;;
    *)
      echo "Unsupported Linux artifact target: $linux_target" >&2
      exit 1
      ;;
  esac

  artifact_destination="${release_artifacts_dist_dir:-$project_root/dist}"
  mkdir -p "$artifact_destination"
  mapfile -t artifacts < <(find dist -maxdepth 1 -type f -name "$artifact_pattern")
  if [[ "${#artifacts[@]}" -eq 0 ]]; then
    echo "Linux build did not create a $linux_target artifact." >&2
    exit 1
  fi
  cp -a "${artifacts[@]}" "$artifact_destination/"
  echo "[release] Copied $linux_target artifact to $artifact_destination."
}

cleanup_stages() {
  if [[ -n "$linux_stage" ]]; then
    rm -rf -- "$linux_stage"
  fi
  if [[ -n "$windows_stage" ]]; then
    rm -rf -- "$windows_stage"
  fi
}

trap cleanup_stages EXIT

if ! command -v zip >/dev/null; then
  apt-get update
  apt-get install --no-install-recommends -y zip
fi

if [[ "$release_skip_linux" != "1" ]]; then
  # AVR core contains host-specific AVR tools. Prepare it before packaging,
  # using the matching Linux Arduino CLI executable.
  mkdir -p build/arduino-cli-linux
  download "$arduino_cli_linux_url" build/arduino-cli-linux/arduino-cli.tar.gz
  tar -xzf build/arduino-cli-linux/arduino-cli.tar.gz -C build/arduino-cli-linux
  bash build/prepare-arduino-cli-core.sh linux build/arduino-cli-linux/arduino-cli

  mkdir -p build/gcc-arm-none-eabi-linux
  download "$arm_gcc_linux_url" build/gcc-arm-none-eabi-linux/gcc-arm-none-eabi.tar.bz2
  bash build/prepare-linux-toolchains.sh \
    build/arduino-cli-linux/arduino-cli \
    build/gcc-arm-none-eabi-linux/gcc-arm-none-eabi.tar.bz2
fi

if ! command -v rsync >/dev/null; then
  apt-get update
  apt-get install --no-install-recommends -y rsync
fi

if [[ "$release_skip_windows" != "1" && "${RELEASE_SKIP_DOWNLOADS:-0}" != "1" ]]; then
  mkdir -p resources/modules/win32/arduino-cli build
  download "$avrdude_url" resources/modules/win32/avrdude.zip
  unzip -oq resources/modules/win32/avrdude.zip -d resources/modules/win32
  rm -f resources/modules/win32/avrdude.zip

  download "$arduino_cli_url" resources/modules/win32/arduino-cli.zip
  unzip -oq resources/modules/win32/arduino-cli.zip -d resources/modules/win32/arduino-cli
  rm -f resources/modules/win32/arduino-cli.zip

  download "$arm_gcc_url" build/gcc-arm-none-eabi.zip

  download "$irpcb_url" build/irpcb.zip
  unzip -oq build/irpcb.zip -d build/irpcb
  rm -f build/irpcb.zip
fi

if [[ "$release_skip_windows" != "1" ]]; then
  windows_arduino_data_path="$(winepath -w "$project_root/resources/arduino-cli-data/win32")"
  ARDUINO_CLI_DATA_DIR="$windows_arduino_data_path" \
    bash build/prepare-arduino-cli-core.sh win32 wine \
    "$project_root/resources/modules/win32/arduino-cli/arduino-cli.exe"

  if [[ ! -f build/gcc-arm-none-eabi.zip ]] || [[ ! -d build/irpcb/bin ]]; then
    echo 'Windows compiler payload is missing; enable downloads or provide cached artifacts.' >&2
    exit 1
  fi

  windows_gcc_unpack_dir="$(mktemp -d)"
  unzip -oq build/gcc-arm-none-eabi.zip -d "$windows_gcc_unpack_dir"
  windows_gcc_executable="$(find "$windows_gcc_unpack_dir" -type f -iname arm-none-eabi-gcc.exe -print -quit)"
  if [[ -z "$windows_gcc_executable" ]]; then
    echo 'Windows ARM GCC archive does not contain arm-none-eabi-gcc.exe.' >&2
    exit 1
  fi
  windows_gcc_root="$(dirname "$(dirname "$windows_gcc_executable")")"
  rm -rf -- resources/modules/win32/gcc-arm-none-eabi resources/modules/win32/irpcb
  mkdir -p resources/modules/win32/irpcb
  cp -a "$windows_gcc_root" resources/modules/win32/gcc-arm-none-eabi
  cp -a build/irpcb/bin resources/modules/win32/irpcb/bin
  rm -rf -- "$windows_gcc_unpack_dir"
  bash build/prepare-windows-compiler.sh
fi

mkdir -p dist
# `dist` – именованный раздел Docker, где лежат релизы. 
# Перед сборкой нужно вычистить старые артефакты,
# а не то пакеты AppImage/Snap попадают в app.asar.
find dist -mindepth 1 -maxdepth 1 -exec rm -rf -- {} +
mkdir -p outputs
find outputs -mindepth 1 -maxdepth 1 -exec rm -rf -- {} +

npm ci
npm run build
version="$(node -p 'require("./package.json").version')"

if [[ "$release_skip_linux" != "1" ]]; then
  # Сборка забирает всё, до чего доберётся, поэтому надёжнее
  # собирать под Linux из-под отдельной копии проекта.
  linux_stage="$(mktemp -d)"
  echo '[release] Copying project to native Linux storage for packaging...'
  rsync -a --delete \
    --exclude '.git' \
    --exclude 'node_modules' \
    --exclude 'dist' \
    --exclude 'outputs' \
    --exclude 'build/gcc-arm-none-eabi' \
    --exclude 'build/gcc-arm-none-eabi.zip' \
    --exclude 'resources/modules/win32' \
    --exclude 'resources/modules/darwin' \
    "$project_root/" "$linux_stage/"
  echo '[release] Native Linux staging copy is ready.'
  # `/project` is commonly a Windows bind mount, where chmod is not preserved.
  # The staging directory is native Linux storage, so make bundled executables
  # runnable there before electron-builder copies them into the package.
  chmod 755 \
    "$linux_stage/resources/modules/linux/lapki-compiler/lapki-compiler" \
    "$linux_stage/resources/modules/linux/sm-interpreter" \
    "$linux_stage/resources/modules/linux/blg-mb/cyberbear-loader"
  ln -s "$project_root/node_modules" "$linux_stage/node_modules"

  pushd "$linux_stage" >/dev/null
  echo '[release] Preparing Linux module resources in native storage...'
  npm run prepare:linux
  echo '[release] Linux module resources are ready.'
  for linux_target in $release_linux_targets; do
    if [[ "$linux_target" == "deb" ]]; then
      rm -rf -- \
        resources/toolchains/linux/gcc-arm-none-eabi \
        resources/toolchains/linux/make \
        resources/modules/linux/lib \
        resources/modules/linux/avrdude \
        resources/modules/linux/avrdude.real \
        resources/modules/linux/avrdude.conf
    else
      rsync -a --delete "$project_root/resources/toolchains/linux/" "resources/toolchains/linux/"
    fi
    echo "[release] Building Linux target: $linux_target"
    npx electron-builder --linux "$linux_target" --config
    verify_linux_package "dist/linux-unpacked" "$linux_target"
    copy_linux_artifact "$linux_target"
  done
  popd >/dev/null
  cleanup_stages
  linux_stage=""
fi

if [[ "$release_skip_windows" != "1" ]]; then
  # electron-builder performs many small-file operations while preparing an NSIS
  # installer. Use native Linux storage rather than the Windows bind mount, just
  # as for the Linux targets. Windows-only resources remain in this stage; Linux
  # modules and toolchains are not copied because the Windows configuration
  # excludes them anyway.
  windows_stage="$(mktemp -d)"
  echo '[release] Copying project to native Linux storage for Windows packaging...'
  rsync -a --delete \
    --exclude '.git' \
    --exclude 'node_modules' \
    --exclude 'out' \
    --exclude 'dist' \
    --exclude 'outputs' \
    --exclude 'build/arduino-cli-linux' \
    --exclude 'build/gcc-arm-none-eabi' \
    --exclude 'build/gcc-arm-none-eabi.zip' \
    --exclude 'build/irpcb' \
    --exclude 'resources/modules/linux' \
    --exclude 'resources/modules/darwin' \
    --exclude 'resources/arduino-cli-data/linux' \
    --exclude 'resources/toolchains/linux' \
    "$project_root/" "$windows_stage/"
  echo '[release] Native Windows staging copy is ready.'
  ln -s "$project_root/node_modules" "$windows_stage/node_modules"
  ln -s "$project_root/out" "$windows_stage/out"

  pushd "$windows_stage" >/dev/null
  npx electron-builder --win --config
  find dist -maxdepth 1 -type f -exec cp -a {} "$project_root/dist/" \;
  popd >/dev/null
  rm -rf -- "$windows_stage"
  windows_stage=""

  mkdir -p outputs/windows-release
  cp dist/*-setup.exe outputs/windows-release/

  (
    cd outputs/windows-release
    zip -qr "../cyberiada-${version}-windows.zip" .
  )

  rm -rf -- outputs/windows-release
fi

if [[ "$release_seafile_staging" == "1" ]]; then
  mkdir -p outputs/seafile-upload
  cp "outputs/cyberiada-${version}-windows.zip" outputs/seafile-upload/
  find "${release_artifacts_dist_dir:-dist}" -maxdepth 1 -type f \( \
    -name '*.deb' -o -name '*.rpm' -o -name '*.snap' -o -name '*.AppImage' \
    \) -exec cp {} outputs/seafile-upload/ \;
fi

if [[ -n "$release_artifacts_dist_dir" && -n "$release_artifacts_outputs_dir" ]]; then
  mkdir -p "$release_artifacts_dist_dir" "$release_artifacts_outputs_dir"
  find dist -maxdepth 1 -type f -exec cp -a {} "$release_artifacts_dist_dir/" \;
  cp -a outputs/. "$release_artifacts_outputs_dir/"
fi
