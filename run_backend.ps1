# Start Django Backend on http://127.0.0.1:8000
$root = $PSScriptRoot
Write-Host "Starting ReRoute AI Django Backend on http://127.0.0.1:8000..." -ForegroundColor Green
& "$root\.venv\Scripts\python.exe" "$root\backend\manage.py" runserver 0.0.0.0:8000

