$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$output = Join-Path $root "output"

New-Item -ItemType Directory -Force $output | Out-Null

Write-Host "Installing workspace dependencies..."
& "$env:ProgramFiles\nodejs\npm.cmd" install

Write-Host "Generating branding assets..."
& "$env:ProgramFiles\nodejs\npm.cmd" run generate:branding --prefix $root

Write-Host "Building desktop executable..."
& "$env:ProgramFiles\nodejs\npm.cmd" run build --workspace desktop --prefix $root

Write-Host "Building Android APK..."
& "$env:ProgramFiles\nodejs\npm.cmd" run build:apk --workspace mobile --prefix $root

Write-Host "Packaging complete. Output folder: $output"
