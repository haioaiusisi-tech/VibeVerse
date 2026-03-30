$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$mobile = Join-Path $root "mobile"
$output = Join-Path $root "output\mobile"
$androidSdk = $env:ANDROID_HOME

New-Item -ItemType Directory -Force $output | Out-Null

if (-not $androidSdk) {
  $androidSdk = Join-Path $env:LOCALAPPDATA "Android\Sdk"
  $env:ANDROID_HOME = $androidSdk
}

if (-not (Test-Path $androidSdk)) {
  throw "ANDROID_HOME was not found. Install Android SDK or Android Studio, then rerun the mobile build."
}

$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-17.0.18.8-hotspot"
$env:Path = "$env:JAVA_HOME\bin;$androidSdk\platform-tools;$androidSdk\cmdline-tools\latest\bin;$androidSdk\build-tools\35.0.0;$env:Path"
$env:CI = "1"

$sdkManager = Join-Path $androidSdk "cmdline-tools\latest\bin\sdkmanager.bat"
if (Test-Path $sdkManager) {
  Write-Host "Ensuring Android SDK packages are installed..."
  cmd /c "for /L %i in (1,1,20) do @echo y" | & $sdkManager --licenses | Out-Null
  & $sdkManager "platform-tools" "platforms;android-35" "build-tools;35.0.0" "ndk;27.1.12297006"
}

Write-Host "Generating Android project..."
& "$env:ProgramFiles\nodejs\npm.cmd" run prebuild --prefix $mobile

$gradle = Join-Path $mobile "android\gradlew.bat"
if (-not (Test-Path $gradle)) {
  throw "Gradle wrapper not generated at $gradle"
}

Write-Host "Assembling release APK..."
Push-Location (Join-Path $mobile "android")
try {
  & $gradle assembleRelease
} finally {
  Pop-Location
}

$apk = Join-Path $mobile "android\app\build\outputs\apk\release\app-release.apk"
if (-not (Test-Path $apk)) {
  throw "APK was not produced at $apk"
}

Copy-Item $apk (Join-Path $output "VibeVerse.apk") -Force
Write-Host "APK copied to $(Join-Path $output 'VibeVerse.apk')"
