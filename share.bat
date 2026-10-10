@echo off
echo Starting Almaari Public Share Tunnel...
echo.
cd /d D:\Almaari
cloudflared.exe tunnel --url http://127.0.0.1:5173
pause
