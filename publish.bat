@echo off
setlocal
cd /d "%~dp0"

git fetch origin main --prune
if errorlevel 1 (
  echo Failed to fetch origin/main.
  exit /b 1
)
git pull --rebase origin main
if errorlevel 1 (
  echo Failed to rebase local branch onto origin/main.
  echo Resolve conflicts, then rerun publish.bat.
  exit /b 1
)

git -c core.filemode=false add reports/ results/ index.html breast-mri-artifacts.html
git diff --cached --quiet && echo Nothing to commit. && exit /b 0
git commit -m "refresh site artifacts"
git push origin main
if errorlevel 1 (
  echo Push rejected. Pulling latest and retrying once...
  git pull --rebase origin main
  if errorlevel 1 (
    echo Rebase failed during retry. Resolve conflicts manually.
    exit /b 1
  )
  git push origin main
)
endlocal
