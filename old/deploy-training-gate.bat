@echo off
setlocal
cd /d "%~dp0workers\training-report-gate"
npx wrangler deploy
set EXIT_CODE=%ERRORLEVEL%
if not "%EXIT_CODE%"=="0" (
  echo deploy-training-gate failed with exit code %EXIT_CODE%.
)
exit /b %EXIT_CODE%

