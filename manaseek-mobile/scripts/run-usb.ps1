param([switch]$SkipBuild, [switch]$Regenerate)
$ErrorActionPreference = 'Stop'
. "$PSScriptRoot/local-env.ps1"
$mobileRoot = Split-Path $PSScriptRoot -Parent
$adb = Join-Path $env:ANDROID_HOME 'platform-tools/adb.exe'
$devices = @(& $adb devices | Where-Object { $_ -match '^\S+\s+device$' })
if ($devices.Count -ne 1) { throw 'Connect exactly one Android phone and allow USB debugging first.' }
$serial = ($devices[0] -split '\s+')[0]
$abi = (& $adb -s $serial shell getprop ro.product.cpu.abi).Trim()
if ($abi -notin @('arm64-v8a', 'armeabi-v7a', 'x86_64', 'x86')) { throw "Unsupported ABI: $abi" }
$env:ANDROID_ABIS = $abi
Push-Location $mobileRoot
try {
    if (!$SkipBuild) {
        $buildArgs = @('scripts/build-apk.mjs')
        if (!$Regenerate -and (Test-Path android/gradlew.bat)) { $buildArgs += '--skip-prebuild' }
        & node @buildArgs
        if ($LASTEXITCODE -ne 0) { throw 'APK build failed.' }
    }
    $version = (Get-Content package.json -Raw | ConvertFrom-Json).version
    $apk = Join-Path $mobileRoot "out/android/manaseek-$version.apk"
    if (!(Test-Path -LiteralPath $apk)) { throw "APK not found: $apk" }
    & $adb -s $serial install -r $apk
    if ($LASTEXITCODE -ne 0) { throw 'APK installation failed. Check the phone screen.' }
    & $adb -s $serial shell am start -n id.manaseek.app/.MainActivity
    if ($LASTEXITCODE -ne 0) { throw 'Unable to start Manaseek.' }
} finally {
    Pop-Location
}
