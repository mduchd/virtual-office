@echo off
title Habblaud Server
cd /d "%~dp0"
echo ==========================================
echo       Khoi dong Habblaud Virtual Office
echo ==========================================
echo Dang mo trinh duyet tai http://localhost:4747...
start "" "http://localhost:4747"
set HABBLAUD_LANG=vi
npm start
