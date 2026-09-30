@echo off
cd /d "%~dp0"
set PYTHONDONTWRITEBYTECODE=1
python scanner.py
pause