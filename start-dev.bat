@echo off
title BASEERA 360 Development Environment
color 0A

echo.
echo ============================================
echo   BASEERA 360 - Starting Development
echo ============================================
echo.

cd /d C:\Users\siluv\OneDrive\Desktop\baseera-360\frontend

echo Starting Frontend on http://localhost:5173...
echo.

start cmd /k "npm run dev"

echo.
echo ============================================
echo   Frontend is starting...
echo   Open browser: http://localhost:5173
echo   Login: test@baseera.ae / password123
echo ============================================
echo.

pause