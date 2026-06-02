# launch.ps1 — clone (or update) the Recipe Book Creator repo, install deps,
# start the Vite dev server, and open it in your default browser.
#
# Usage (in Windows PowerShell, from any folder you like):
#   1. Save this file somewhere (e.g. C:\Users\User\Desktop\launch.ps1)
#   2. Open PowerShell and run:
#        powershell -ExecutionPolicy Bypass -File "C:\Users\User\Desktop\launch.ps1"
#      (the ExecutionPolicy flag is only needed the first time)

$ErrorActionPreference = 'Stop'

# ── 1. Where to put the repo ────────────────────────────────────────────────
$RepoUrl    = 'https://github.com/alexcreates3301/Recipe-Book-Creator.git'
$Branch     = 'claude/test-delete-recipe-feature-10V9i'
$WorkRoot   = Join-Path $HOME 'recipe-book-creator'
$AppDir     = Join-Path $WorkRoot 'recipe-book'
$DevUrl     = 'http://localhost:5173'

Write-Host ''
Write-Host '=== Recipe Book Creator launcher ===' -ForegroundColor Cyan
Write-Host ''

# ── 2. Check for required tools ─────────────────────────────────────────────
function Require-Cmd($name, $installHint) {
    if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
        Write-Host "ERROR: '$name' is not installed or not on PATH." -ForegroundColor Red
        Write-Host "       $installHint" -ForegroundColor Yellow
        exit 1
    }
}

Require-Cmd 'git'  'Install Git for Windows: https://git-scm.com/download/win'
Require-Cmd 'node' 'Install Node.js LTS: https://nodejs.org/'
Require-Cmd 'npm'  'npm ships with Node.js; reinstall Node from https://nodejs.org/'

Write-Host ('git  : ' + (git --version))
Write-Host ('node : ' + (node --version))
Write-Host ('npm  : ' + (npm --version))
Write-Host ''

# ── 3. Clone or update the repo ─────────────────────────────────────────────
if (-not (Test-Path $WorkRoot)) {
    Write-Host "Cloning repo into $WorkRoot ..." -ForegroundColor Cyan
    git clone $RepoUrl $WorkRoot
} else {
    Write-Host "Repo already exists at $WorkRoot — pulling latest..." -ForegroundColor Cyan
    Set-Location $WorkRoot
    git fetch origin
}

Set-Location $WorkRoot
Write-Host "Checking out branch '$Branch' ..." -ForegroundColor Cyan
git checkout $Branch
git pull origin $Branch

# ── 4. Install dependencies if needed ───────────────────────────────────────
Set-Location $AppDir
if (-not (Test-Path (Join-Path $AppDir 'node_modules'))) {
    Write-Host 'Installing npm dependencies (first run, this may take a minute)...' -ForegroundColor Cyan
    npm install
} else {
    Write-Host 'node_modules already present — skipping npm install.' -ForegroundColor DarkGray
    Write-Host '(Delete node_modules and rerun if dependencies seem stale.)' -ForegroundColor DarkGray
}

# ── 5. Open the browser shortly after starting the dev server ───────────────
Write-Host ''
Write-Host "Starting Vite dev server. Your browser will open at $DevUrl" -ForegroundColor Green
Write-Host 'Press Ctrl+C in this window to stop the server.' -ForegroundColor Green
Write-Host ''

Start-Job -ScriptBlock {
    param($url)
    Start-Sleep -Seconds 4
    Start-Process $url
} -ArgumentList $DevUrl | Out-Null

npm run dev
