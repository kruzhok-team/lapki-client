# <#
# .SYNOPSIS
#     Adds specified relative paths to the user's PATH environment variable.
# .DESCRIPTION
#     This script takes a base directory as its first parameter and adds all paths listed in the $PATHS variable
#     (relative to the base directory) to the user's PATH environment variable if they exist.
# .PARAMETER BasePath
#     The base directory against which relative paths in $PATHS will be resolved.
# .EXAMPLE
#     .\AddToPath.ps1 "C:\MyProjects"
#     This will add all paths listed in $PATHS (relative to C:\MyProjects) to the user's PATH.
# #>

# param(
#     [Parameter(Mandatory=$true)]
#     [string]$BasePath
# )

# # Define the relative paths you want to add (relative to $BasePath)
# $PATHS = @(
#     "gcc-arm-none-eabi\bin"
#     "resources\app.asar.unpacked\resources\modules\win32\arduino-cli\"
#     # Add more paths as needed
# )

# # Get the current user's PATH environment variable
# $currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")

# # Split the PATH into individual directories
# $pathDirs = $currentPath -split ';'

# # Process each relative path
# foreach ($relativePath in $PATHS) {
#     $fullPath = Join-Path -Path $BasePath -ChildPath $relativePath
    
#     # Normalize the path (resolve any . or .. and ensure consistent slashes)
#     $fullPath = [System.IO.Path]::GetFullPath($fullPath)
    
#     # Check if the path exists and isn't already in PATH
#     if ($pathDirs -notcontains $fullPath) {
#         Write-Host "Adding to PATH: $fullPath"
#         $currentPath = "$currentPath;$fullPath"
#     } else {
#         Write-Host "Already in PATH: $fullPath"
#     }

# }

# # Update the user's PATH environment variable
# [Environment]::SetEnvironmentVariable("PATH", $currentPath, "User")