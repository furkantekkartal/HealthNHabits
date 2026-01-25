@echo off
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "Run_All.ps1"
pause
