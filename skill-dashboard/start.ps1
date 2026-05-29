Write-Host "Starting Skill & Agent Dashboard..." -ForegroundColor Cyan

$be = Start-Job -ScriptBlock {
  node C:\ID_Skills\skill-dashboard\backend\src\server.js
}

$fe = Start-Job -ScriptBlock {
  Set-Location C:\ID_Skills\skill-dashboard\frontend
  npx vite
}

Start-Sleep -Seconds 2

Write-Host "`n Backend: http://localhost:3001" -ForegroundColor Green
Write-Host " Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "`nPress any key to stop..." -ForegroundColor Yellow

$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Stop-Job $be -ErrorAction SilentlyContinue
Stop-Job $fe -ErrorAction SilentlyContinue
Remove-Job $be -ErrorAction SilentlyContinue
Remove-Job $fe -ErrorAction SilentlyContinue

Write-Host "Stopped." -ForegroundColor Cyan
