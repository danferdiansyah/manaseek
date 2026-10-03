$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$toolRoot = Join-Path $taskRoot '.local-android'
# Keep a machine-wide ccache/shim out of this isolated build. React Native
# auto-detects it and would otherwise use its global cache and runtime.
$ccacheBins = @(Get-Command ccache -All -CommandType Application -ErrorAction SilentlyContinue | ForEach-Object { (Split-Path $_.Source -Parent).TrimEnd('\') })
if ($ccacheBins.Count) {
    $env:Path = (($env:Path -split ';') | Where-Object { $ccacheBins -inotcontains $_.TrimEnd('\') }) -join ';'
}
foreach ($folder in @('temp', 'npm-cache', 'gradle', 'android-user', 'avd', 'expo', 'cache')) {
    New-Item -ItemType Directory -Force (Join-Path $toolRoot $folder) | Out-Null
}
$nodeRoot = Get-ChildItem $toolRoot -Directory -Filter 'node-v*-win-x64' | Sort-Object Name -Descending | Select-Object -First 1
$jdkRoot = Get-ChildItem $toolRoot -Directory -Filter 'jdk-*' | Sort-Object Name -Descending | Select-Object -First 1
if (!$nodeRoot) { throw 'Portable Node is missing in .local-android.' }
$env:Path = "$($nodeRoot.FullName);$env:Path"
if ($jdkRoot) {
    $env:JAVA_HOME = $jdkRoot.FullName
    $env:Path = "$env:JAVA_HOME\bin;$env:Path"
}
$env:ANDROID_HOME = Join-Path $toolRoot 'sdk'
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:ANDROID_USER_HOME = Join-Path $toolRoot 'android-user'
$env:ANDROID_EMULATOR_HOME = $env:ANDROID_USER_HOME
$env:ANDROID_AVD_HOME = Join-Path $toolRoot 'avd'
$env:GRADLE_USER_HOME = Join-Path $toolRoot 'gradle'
$env:npm_config_cache = Join-Path $toolRoot 'npm-cache'
$env:__UNSAFE_EXPO_HOME_DIRECTORY = Join-Path $toolRoot 'expo'
$env:XDG_CACHE_HOME = Join-Path $toolRoot 'cache'
$env:TEMP = Join-Path $toolRoot 'temp'
$env:TMP = $env:TEMP
$env:EXPO_NO_TELEMETRY = '1'
$env:CI = '1'
$env:Path = "$env:ANDROID_HOME\platform-tools;$env:Path"
