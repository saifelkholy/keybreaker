@echo off
echo Starting CTF Platform with Ngrok Integration...
echo.
echo Make sure you have 'ngrok' installed and in your PATH.
echo.
cd /d "%~dp0"
node scripts/start-dev.js
pause
