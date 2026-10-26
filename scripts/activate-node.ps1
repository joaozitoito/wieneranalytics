$runtimeDirectory = Get-ChildItem -LiteralPath (Join-Path $PSScriptRoot '../.tools') -Directory -Filter 'node-v22*-win-x64' -ErrorAction SilentlyContinue | Sort-Object Name -Descending | Select-Object -First 1
if (-not $runtimeDirectory) { throw 'Runtime portátil não encontrado. Instale Node.js 22 LTS ou execute scripts/bootstrap-node.ps1.' }
$env:Path = $runtimeDirectory.FullName + ';' + $env:Path
Write-Output 'Node portátil ativado somente nesta sessão do terminal.'
node --version
