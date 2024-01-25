{ pkgs ? import <nixpkgs> {} }:

(pkgs.buildFHSEnv {
  name = "lapki-env";
  targetPkgs = pkgs: (with pkgs; [
    # base toolchain
    nodejs-18_x typescript fpm

    # electron runtime
    pkg-config glib nss nspr at-spi2-atk
    cups dbus libdrm gtk3 pango cairo
    xorg.libX11 xorg.libXcomposite
    xorg.libXdamage xorg.libXext
    xorg.libXfixes xorg.libXrandr
    xorg.libxcb libxkbcommon libGL
    expat alsa-lib mesa # note: libgbm

    # lapki-flasher dependencies
    libusb avrdude udev
  ]);
  # runScript = "bash -c 'ldd ./node_modules/electron/dist/electron'";
  runScript = "bash -c 'USE_SYSTEM_FPM=true npm run dev'";
}).env