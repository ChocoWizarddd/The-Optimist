$ErrorActionPreference = 'Stop'
$backendDir = $PSScriptRoot
$python = Join-Path $backendDir '.venv\Scripts\python.exe'

if (-not (Test-Path $python)) {
  python -m venv (Join-Path $backendDir '.venv')
}

& $python -m pip install --upgrade pip
& $python -m pip install -r (Join-Path $backendDir 'requirements.txt')
Write-Host 'USB bridge dependencies are ready.' -ForegroundColor Green
