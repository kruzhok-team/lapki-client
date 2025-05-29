echo Downloading avrdude...
curl https://github.com/avrdudes/avrdude/releases/download/v8.0/avrdude-v8.0-windows-x86.zip -o resources/modules/win32/avrdude.zip
Expand-Archive -Path "resources/modules/win32/avrdude.zip" -Force -DestinationPath "resources/modules/win32/avrdude"

Remove-Item resources/modules/win32/avrdude.zip
echo Avrdude downloaded!

echo Downloading arduino-cli...
curl https://downloads.arduino.cc/arduino-cli/arduino-cli_latest_Windows_64bit.zip -o resources/modules/win32/arduino-cli.zip
Expand-Archive -Path "resources/modules/win32/arduino-cli.zip" -Force -DestinationPath "resources/modules/win32/arduino-cli"

Remove-Item resources/modules/win32/arduino-cli.zip
echo arduino-cli downloaded!

echo Downloading arm-gcc...
curl https://seafile.polyus-nt.ru/f/83d0be836d1c491fa3b3/?dl=1 -o resources/modules/win32/gcc-arm-none-eabi.zip
Expand-Archive -Path "resources/modules/win32/gcc-arm-none-eabi.zip" -Force -DestinationPath "resources/modules/win32/gcc-arm-none-eabi"

Remove-Item resources/modules/win32/gcc-arm-none-eabi.zip
echo arm-gcc downloaded!

# Define the relative paths you want to add (relative to $BasePath)
param(
    [Parameter(Mandatory=$true)]
    [string]$BasePath
)

# Define the relative paths you want to add (relative to $BasePath)
$PATHS = @(
    "gcc-arm-none-eabi\bin"
    "arduino-cli\"
    "avrdude\"
    # Add more paths as needed
)

# Get the current user's PATH environment variable
$currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")

# Split the PATH into individual directories
$pathDirs = $currentPath -split ';'

# Process each relative path
foreach ($relativePath in $PATHS) {
    $fullPath = Join-Path -Path $BasePath -ChildPath $relativePath
    
    # Normalize the path (resolve any . or .. and ensure consistent slashes)
    $fullPath = [System.IO.Path]::GetFullPath($fullPath)
    
    # Check if the path exists and isn't already in PATH
    if ($pathDirs -notcontains $fullPath) {
        Write-Host "Adding to PATH: $fullPath"
        $currentPath = "$currentPath;$fullPath"
    } else {
        Write-Host "Already in PATH: $fullPath"
    }

}

# Update the user's PATH environment variable
[Environment]::SetEnvironmentVariable("PATH", $currentPath, "User")

arduino-cli core install arduino:avr