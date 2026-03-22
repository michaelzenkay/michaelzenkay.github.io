@echo off
cd /d "%~dp0"
git -c core.filemode=false add reports/ results/ index.html breast-mri-artifacts.html
git diff --cached --quiet && echo Nothing to commit. && exit /b 0
git commit -m "refresh site artifacts"
git push
