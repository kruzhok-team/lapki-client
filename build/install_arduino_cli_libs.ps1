param($packagesPath)

$arduino15Path = "$env:LOCALAPPDATA\Arduino15"
$targetPackagesPath = Join-Path $arduino15Path "packages"

if (!(Test-Path $arduino15Path)) {
    New-Item -ItemType Directory -Path $arduino15Path
}

if (!(Test-Path $packagesPath)) {
    throw "Arduino CLI packages path not found: $packagesPath"
}

if (!(Test-Path $targetPackagesPath)) {
    New-Item -ItemType Directory -Path $targetPackagesPath
}

Copy-Item -Path (Join-Path $packagesPath '*') -Destination $targetPackagesPath -Recurse -Force
