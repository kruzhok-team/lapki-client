const { chmodSync, existsSync } = require('fs');
const path = require('path');

/**
 * Windows bind mounts do not retain Unix modes.  electron-builder copies
 * unpacked resources before this hook, so restore executable modes in the
 * final staging tree before signing and creating distribution artifacts.
 */
exports.default = async (context) => {
  if (context.electronPlatformName === 'darwin') {
    const modulesPath = path.join(
      context.appOutDir,
      `${context.packager.appInfo.productFilename}.app`,
      'Contents/Resources/app.asar.unpacked/resources/modules/darwin'
    );
    for (const moduleName of ['sm-interpreter', 'lapki-flasher']) {
      const executablePath = path.join(modulesPath, moduleName);
      if (!existsSync(executablePath)) {
        throw new Error(`Required macOS module is missing from package: ${executablePath}`);
      }
      chmodSync(executablePath, 0o755);
    }
    return;
  }

  if (context.electronPlatformName === 'win32') {
    for (const relativePath of [
      'resources/app.asar.unpacked/resources/modules/win32/lapki-compiler/lapki-compiler.exe',
      'resources/app.asar.unpacked/resources/modules/win32/lapki-compiler/library',
      'resources/app.asar.unpacked/resources/modules/win32/lapki-compiler/platforms',
      'resources/app.asar.unpacked/resources/modules/win32/lapki-compiler/fullgraphmlparser/templates',
      'resources/app.asar.unpacked/resources/modules/win32/gcc-arm-none-eabi/bin/arm-none-eabi-gcc.exe',
      'resources/app.asar.unpacked/resources/modules/win32/arduino-cli/arduino-cli.exe',
      'resources/app.asar.unpacked/resources/arduino-cli-data/win32/packages/arduino/hardware/avr/1.8.8',
      'resources/app.asar.unpacked/resources/modules/win32/irpcb/bin/make.exe',
      'resources/app.asar.unpacked/resources/modules/win32/irpcb/bin/msys-2.0.dll',
    ]) {
      const resourcePath = path.join(context.appOutDir, relativePath);
      if (!existsSync(resourcePath)) {
        throw new Error(
          `Required Windows compiler resource is missing from package: ${resourcePath}`
        );
      }
    }
    return;
  }

  if (context.electronPlatformName !== 'linux') return;

  for (const relativePath of [
    'resources/app.asar.unpacked/resources/modules/linux/lapki-compiler/lapki-compiler',
    'resources/app.asar.unpacked/resources/modules/linux/sm-interpreter',
    'resources/app.asar.unpacked/resources/modules/linux/blg-mb/cyberbear-loader',
  ]) {
    const executablePath = path.join(context.appOutDir, relativePath);
    if (!existsSync(executablePath)) {
      throw new Error(`Required Linux module is missing from package: ${executablePath}`);
    }
    chmodSync(executablePath, 0o755);
  }

  for (const relativePath of [
    'resources/app.asar.unpacked/resources/toolchains/linux/arduino-cli/arduino-cli',
    'resources/app.asar.unpacked/resources/toolchains/linux/arduino-cli/arduino-cli.real',
    'resources/app.asar.unpacked/resources/toolchains/linux/make/make',
    'resources/app.asar.unpacked/resources/modules/linux/avrdude',
    'resources/app.asar.unpacked/resources/modules/linux/avrdude.real',
  ]) {
    const executablePath = path.join(context.appOutDir, relativePath);
    if (existsSync(executablePath)) chmodSync(executablePath, 0o755);
  }
};
