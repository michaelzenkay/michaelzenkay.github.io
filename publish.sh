#!/usr/bin/env bash
# Commit and push refreshed site artifacts to GitHub Pages.
# Run this locally after HPC regenerates the reports.
set -e
cd "$(dirname "$0")"

git -c core.filemode=false add reports/ results/ index.html breast-mri-artifacts.html
if git diff --cached --quiet; then
  echo "Nothing to commit -- site already up to date."
  exit 0
fi

ts=$(date "+%Y-%m-%d %H:%M")
git commit -m "refresh site artifacts ($ts)"
git push
echo "Published."
