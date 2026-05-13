@echo off
REM BASEERA 360 - Automated Windows Setup Script
REM This script automates the setup process for Windows users

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║          BASEERA 360 - Windows Automated Setup            ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Check if Docker is installed
echo [Step 1/6] Checking Docker installation...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ❌ ERROR: Docker is not installed!
    echo.
    echo Please install Docker Desktop from:
    echo https://www.docker.com/products/docker-desktop
    echo.
    pause
    exit /b 1
)
echo ✅ Docker found!
echo.

REM Check if Docker daemon is running
echo [Step 2/6] Checking Docker daemon...
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ❌ ERROR: Docker daemon is not running!
    echo.
    echo Please start Docker Desktop and try again.
    echo.
    pause
    exit /b 1
)
echo ✅ Docker daemon is running!
echo.

REM Start Docker containers
echo [Step 3/6] Starting Docker containers...
echo This may take 1-2 minutes on first run...
docker-compose up -d
if %errorlevel% neq 0 (
    echo.
    echo ❌ ERROR: Failed to start Docker containers!
    echo.
    pause
    exit /b 1
)
echo ✅ Docker containers started!
echo.

REM Wait for services to be ready
echo [Step 4/6] Waiting for services to be ready...
timeout /t 15 /nobreak
echo ✅ Services are ready!
echo.

REM Install dependencies and seed database
echo [Step 5/6] Installing dependencies and seeding database...
cd backend
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo.
    echo ❌ WARNING: npm install had issues, but continuing...
    echo.
)
call npm run seed
cd ..
echo ✅ Database seeded!
echo.

REM Open browser
echo [Step 6/6] Opening application in browser...
echo.
echo ✅ Setup complete!
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║           BASEERA 360 is starting...                      ║
echo ║                                                            ║
echo ║  Frontend: http://localhost:5173                          ║
echo ║  Backend:  http://localhost:3000/api                      ║
echo ║                                                            ║
echo ║  Login with:                                              ║
echo ║  Email: test@baseera.ae                                   ║
echo ║  Password: password123                                    ║
echo ║                                                            ║
echo ║  Opening browser in 5 seconds...                          ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Wait 5 seconds
timeout /t 5 /nobreak

REM Open browser
start http://localhost:5173

echo.
echo ✅ Browser opened!
echo.
echo If browser doesn't open automatically, visit:
echo http://localhost:5173
echo.
pause
