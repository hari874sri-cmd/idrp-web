# Start Vite Frontend Dev Server on http://localhost:5173
$root = $PSScriptRoot
$env:PATH = "$root\node_runtime;$env:PATH"
Set-Location "$root\frontend"
Write-Host "Starting ReRoute AI Vite Frontend on http://localhost:5173..." -ForegroundColor Green
& "$root\node_runtime\node.exe" "$root\node_runtime\node_modules\npm\bin\npm-cli.js" run dev

