# 🔧 Troubleshooting: Menu Not Visible

## Problem
Menu items are not showing up on the website.

## Root Cause
When opening HTML files directly using `file://` protocol, browsers block API requests to `http://localhost:8080` due to **CORS (Cross-Origin Resource Sharing)** security restrictions.

## Solution ✅

### Use a Local Web Server

Instead of opening the HTML file directly, you need to serve it through a web server.

**I've started a Python HTTP server for you!**

### Access Your Website

Open your browser and go to:
```
http://localhost:3000
```

The frontend is now being served on **port 3000** and can communicate with the backend on **port 8080**.

---

## How It Works

- **Frontend**: http://localhost:3000 (Python HTTP Server)
- **Backend API**: http://localhost:8080 (Spring Boot)
- **Same origin** = No CORS issues! ✅

---

## Manual Start (if needed)

If the server stops, restart it using one of these methods:

### Option 1: Batch File
```bash
c:\Users\Themba\mnandi-flamed-grilled-1\start-frontend.bat
```

### Option 2: PowerShell
```powershell
cd c:\Users\Themba\mnandi-flamed-grilled-1\public
python -m http.server 3000
```

### Option 3: Node.js (if you have it)
```bash
cd c:\Users\Themba\mnandi-flamed-grilled-1\public
npx http-server -p 3000
```

---

## Stop the Servers

### Stop Frontend Server
- Close the PowerShell window running the Python server
- Or press `Ctrl+C` in the terminal

### Stop Backend Server
```powershell
Get-Process java | Stop-Process
```

---

## Alternative: VS Code Live Server

If you have VS Code:
1. Install "Live Server" extension
2. Right-click `index.html`
3. Select "Open with Live Server"
4. It will open on `http://127.0.0.1:5500` or similar

---

## Verification

Once the server is running, test these URLs in your browser:

1. **Frontend Homepage**:  
   http://localhost:3000

2. **Menu Page**:  
   http://localhost:3000/menu.html

3. **Backend API (menu)**:  
   http://localhost:8080/api/menu

If you see JSON data in #3 and the menu page (#2) shows items, everything is working!

---

## Summary

✅ **Backend**: Running on port 8080  
✅ **Frontend**: Now running on port 3000  
✅ **No CORS issues**: Both on localhost  
✅ **Menu should be visible**: Try http://localhost:3000/menu.html

The website should now work perfectly! 🎉
