$ErrorActionPreference = 'Stop'
$python = Join-Path $PSScriptRoot '.venv\Scripts\python.exe'

if (-not (Test-Path $python)) {
  throw 'Bridge is not installed yet. Run: powershell -ExecutionPolicy Bypass -File backend\setup.ps1'
}

& $python (Join-Path $PSScriptRoot 'main.py')
