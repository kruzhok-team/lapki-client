{ pkgs ? import <nixpkgs> {}}:

pkgs.mkShell { 
  packages = [
    ( pkgs.vscode.fhsWithPackages (ps: with ps; ( 
        atomEnv.packages  
        ++
        [ libxkbcommon zlib openssl.dev 
          nodejs-18_x 
          pkg-config
          git openssh nano
          typescript
        ]
      ))
    )
  ];
  shellHook = ''
    code .
  '';
}
