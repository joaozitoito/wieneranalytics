$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$projectDirectory = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$toolsDirectory = Join-Path $projectDirectory '.tools'
New-Item -ItemType Directory -Path $toolsDirectory -Force | Out-Null
$releases = Invoke-RestMethod 'https://nodejs.org/dist/index.json'
$runtimeVersion = ($releases | Where-Object { $_.version -like 'v22.*' -and $_.lts } | Select-Object -First 1).version
if (-not $runtimeVersion) { throw 'Node.js 22 LTS não encontrado no índice oficial.' }
$archivePath = Join-Path $toolsDirectory 'runtime.zip'
$webClient = New-Object System.Net.WebClient
$webClient.DownloadFile("https://nodejs.org/dist/$runtimeVersion/node-$runtimeVersion-win-x64.zip", $archivePath)
$checksums = $webClient.DownloadString("https://nodejs.org/dist/$runtimeVersion/SHASUMS256.txt")
$actualHash = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash.ToLower()
if ($checksums -notmatch "$actualHash\s+node-$runtimeVersion-win-x64.zip") { throw 'SHA-256 não confere. Runtime não extraído.' }
Expand-Archive -LiteralPath $archivePath -DestinationPath $toolsDirectory -Force
Write-Output "Node $runtimeVersion verificado e extraído apenas em .tools. Execute: . ./scripts/activate-node.ps1"
