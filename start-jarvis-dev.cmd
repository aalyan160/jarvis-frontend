@echo off
cd /d "%~dp0"
title JARVIS Dev Server
echo.
echo Starting JARVIS frontend...
echo Project: %cd%
echo.
echo Keep this terminal open while using the app.
echo Open this URL after it says Ready:
echo http://127.0.0.1:3000
echo.
npm run dev
echo.
echo JARVIS dev server stopped.
pause
