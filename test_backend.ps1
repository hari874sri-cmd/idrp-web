# Run Django Test Suite
$root = $PSScriptRoot
Write-Host "Running ReRoute AI Backend Unit & Integration Tests..." -ForegroundColor Cyan
& "$root\.venv\Scripts\python.exe" "$root\backend\manage.py" test apps.accounts apps.donations apps.forecasting apps.matching

