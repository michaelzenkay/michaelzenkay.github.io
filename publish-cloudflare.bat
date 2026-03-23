@echo off
setlocal
cd /d "%~dp0"

set PROJECT_NAME=%~1
if "%PROJECT_NAME%"=="" set PROJECT_NAME=michaelzenkay

where wrangler >nul 2>&1
if errorlevel 1 (
  echo Wrangler CLI not found.
  echo Install with: npm install -g wrangler
  exit /b 1
)

if "%CLOUDFLARE_API_TOKEN%"=="" (
  echo CLOUDFLARE_API_TOKEN is not set.
  exit /b 1
)

if "%CLOUDFLARE_ACCOUNT_ID%"=="" (
  echo CLOUDFLARE_ACCOUNT_ID is not set.
  exit /b 1
)

wrangler pages deploy . --project-name=%PROJECT_NAME% --branch=main
endlocal
