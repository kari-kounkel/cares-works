@echo off
title CARES deploy - ITA BEL KOO
cd /d C:\dev\cares-works
echo Fetching latest from GitHub...
git fetch origin
echo Adding the ITA BEL KOO files...
git add public\proposals\itabelkoo api\itabelkoo-training.js
git commit -m "ITA BEL KOO: Stripe pay link + updated invoice"
echo Merging (keeping your local versions where they differ)...
git merge -X ours origin/main -m "Merge remote itabelkoo files"
echo Pushing to GitHub...
git push origin main
echo.
echo ==========================================================
echo  DONE. Vercel is rebuilding tools.caresmn.com right now.
echo  Give it about one minute, then the pay link is live.
echo  You can close this window.
echo ==========================================================
pause
