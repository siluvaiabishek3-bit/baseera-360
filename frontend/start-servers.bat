@echo off
echo Starting JSON Server...
start cmd /k "npx json-server db.json --port 3000"

timeout /t 2

echo Starting Vite Dev Server...
start cmd /k "npm run dev"

echo Both servers started!
pause