@echo off
cd /d "%~dp0backend"
node scripts/clone-products.js
pause
