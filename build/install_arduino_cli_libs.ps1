param($packagesPath)

$arduino15Path = "$env:LOCALAPPDATA\Arduino15"

if (!(Test-Path $arduino15Path)) {
    New-Item -ItemType Directory -Path $arduino15Path
}

Move-Item -Path $packagesPath -Destination $arduino15Path -Force
