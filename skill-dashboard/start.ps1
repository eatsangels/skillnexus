#Requires -Version 5.1
<#
.SYNOPSIS
  SkillNexus - Script de inicio para el modo web (dashboard local)
  Instala dependencias automaticamente si no estan presentes.
#>

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

function Write-Step($msg) {
  Write-Host ""
  Write-Host "  >> $msg" -ForegroundColor Cyan
}

function Write-OK($msg) {
  Write-Host "  OK $msg" -ForegroundColor Green
}

function Write-Warn($msg) {
  Write-Host "  !! $msg" -ForegroundColor Yellow
}

# Banner
Clear-Host
Write-Host ""
Write-Host "  ============================================" -ForegroundColor DarkMagenta
Write-Host "       SkillNexus  --  Web Mode              " -ForegroundColor Magenta
Write-Host "  ============================================" -ForegroundColor DarkMagenta
Write-Host ""

# Verificar Node.js
Write-Step "Verificando Node.js..."
try {
  $nodeVersion = node --version 2>&1
  Write-OK "Node.js $nodeVersion encontrado"
} catch {
  Write-Host ""
  Write-Host "  ERROR: Node.js no esta instalado. Descargalo desde https://nodejs.org" -ForegroundColor Red
  Write-Host ""
  Read-Host "Presiona Enter para salir"
  exit 1
}

# Instalar dependencias si faltan
$locations = @(
  @{ Label = "Backend";  Path = Join-Path $root "backend"  },
  @{ Label = "Frontend"; Path = Join-Path $root "frontend" }
)

foreach ($loc in $locations) {
  $nmPath = Join-Path $loc.Path "node_modules"
  if (-not (Test-Path $nmPath)) {
    Write-Step "Instalando dependencias del $($loc.Label) (primera vez, puede tardar unos minutos)..."
    Push-Location $loc.Path
    try {
      npm install --loglevel=warn
      Write-OK "Dependencias del $($loc.Label) instaladas correctamente"
    } catch {
      Write-Host "  ERROR al instalar dependencias del $($loc.Label)" -ForegroundColor Red
      Pop-Location
      Read-Host "Presiona Enter para salir"
      exit 1
    }
    Pop-Location
  } else {
    Write-OK "$($loc.Label): dependencias ya instaladas"
  }
}

# Iniciar servicios
Write-Step "Iniciando servicios..."
Write-Host ""

$be = Start-Job -ScriptBlock {
  param($path)
  node "$path\backend\src\server.js"
} -ArgumentList $root

$fe = Start-Job -ScriptBlock {
  param($path)
  Set-Location "$path\frontend"
  npx vite
} -ArgumentList $root

# Esperar arranque real del backend (poll a /api/health en vez de un sleep fijo)
Write-Step "Esperando a que el backend responda..."
$backendReady = $false
for ($i = 0; $i -lt 30; $i++) {
  try {
    $r = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    if ($r.StatusCode -eq 200) { $backendReady = $true; break }
  } catch {
    Start-Sleep -Milliseconds 500
  }
}
if ($backendReady) { Write-OK "Backend listo" } else { Write-Warn "El backend tardo en responder; abriendo de todos modos" }

# Info
Write-Host "  +------------------------------------------+" -ForegroundColor DarkGreen
Write-Host "  |  Frontend  -->  http://localhost:5173    |" -ForegroundColor Green
Write-Host "  |  Backend   -->  http://localhost:3001    |" -ForegroundColor Green
Write-Host "  +------------------------------------------+" -ForegroundColor DarkGreen
Write-Host ""

# Abrir navegador
Write-Host "  Abriendo el navegador..." -ForegroundColor DarkCyan
Start-Sleep -Seconds 2
try {
  Start-Process "http://localhost:5173"
} catch { }

Write-Host ""
Write-Host "  Presiona cualquier tecla para detener los servidores..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Detener
Write-Host ""
Write-Step "Deteniendo servicios..."
Stop-Job  $be, $fe -ErrorAction SilentlyContinue
Remove-Job $be, $fe -ErrorAction SilentlyContinue
Write-OK "SkillNexus detenido. Hasta luego!"
Write-Host ""
