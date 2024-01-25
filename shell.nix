{ pkgs ? import <nixpkgs> {}}:

pkgs.mkShell { 
  packages = [
    ( pkgs.vscode.fhsWithPackages (ps: with ps; ( [ 
        # quality-of-life
        git openssh nano
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

        # stdenv.cc.cc systemd gdk-pixbuf
        # xorg.libxshmfence xorg.libxkbfile
        # zlib openssl.dev libgcrypt
    ])))
  ];
  shellHook = ''
    export USE_SYSTEM_FPM=true
    code .
  '';
}
