@echo off
echo ========================================
echo   Diet Tracker - Server Manager
echo ========================================
echo.

echo [1/2] Stopping existing servers...
echo.

REM Kill processes on port 5000 (backend)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING') do (
    echo Killing process on port 5000 (PID: %%a)
    taskkill /F /PID %%a 2>nul
)

REM Kill processes on port 5173 (frontend)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do (
    echo Killing process on port 5173 (PID: %%a)
    taskkill /F /PID %%a 2>nul
)

echo.
echo Ports cleared!
echo.

echo [2/2] Starting servers...
echo.

REM Start backend in new window
echo Starting Backend (port 5000)...
start "Diet Tracker Backend" cmd /k "cd /d %~dp0backend && npm run dev"

REM Wait a moment for backend to initialize
timeout /t 3 /nobreak >nul

REM Start frontend in new window
echo Starting Frontend (port 5173)...
start "Diet Tracker Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================
echo   Servers starting in new windows!
echo ========================================
echo.
echo   Backend:  http://localhost:5000
echo   Frontend: http://localhost:5173
echo.
echo Press any key to close this window...
pause >nul
