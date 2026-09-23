@echo off
title CirugiaMed - Backup Diario Firestore
cd /d "%~dp0\.."
echo ===================================================
echo     CirugiaMed - Copia de Seguridad Diaria
echo ===================================================
echo Fecha y hora: %date% %time%
echo.

node scripts\backup_firestore.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [EXITO] Backup completado correctamente en la carpeta backups\
) else (
    echo.
    echo Reintentando con Python...
    python scripts\backup_firestore.py
)

echo.
timeout /t 8
