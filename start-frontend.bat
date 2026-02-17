@echo off
echo Starting Mnandi Flamed Grilled Frontend Server...
echo.
echo Frontend will be available at: http://localhost:3000
echo Backend API is running at: http://localhost:8080
echo.
echo Press Ctrl+C to stop the server
echo.

cd /d c:\Users\Themba\mnandi-flamed-grilled-1\public
python -m http.server 3000
