param($packagesPath, $indexesPath)

$arduino15Path = "$env:LOCALAPPDATA\Arduino15\packages"
$arduinoIndexesPath = "$env:LOCALAPPDATA\Arduino15"

if (!(Test-Path $arduino15Path)) {
    New-Item -ItemType Directory -Path $arduino15Path
}
Get-ChildItem -LiteralPath $packagesPath -Force |
    Copy-Item `
        -Destination $arduino15Path `
        -Recurse `
        -Force
Get-ChildItem -LiteralPath $indexesPath -Force |
    Copy-Item `
        -Destination $arduinoIndexesPath `
        -Recurse `
        -Force