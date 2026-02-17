@echo off
echo =====================================================
echo   Mnandi Flame-Grilled - Full Stack Application
echo =====================================================
echo.

echo [1/2] Starting Java Spring Boot backend on port 8080...
start "Java Backend" cmd /k "cd /d %~dp0 && mvn spring-boot:run"

timeout /t 5 >nul

echo [2/2] Starting Next.js frontend on port 3000...
start "Next.js Frontend" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo =====================================================
echo   Both servers are starting!
echo =====================================================
echo.
echo   Backend API:  http://localhost:8080/api
echo   Frontend:     http://localhost:3000
echo.
echo   Press any key to close this window...
echo =====================================================
pause >nul
