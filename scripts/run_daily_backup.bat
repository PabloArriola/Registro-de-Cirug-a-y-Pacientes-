@echo off
title CirugiaMed - Backup Diario Firestore
cd /d "%~dp0\.."
echo ===================================================
echo     CirugiaMed - Copia de Seguridad Diaria
echo ===================================================
echo Fecha y hora: %date% %time%
echo.

python scripts\backup_firestore.py

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [EXITO] Backup completado correctamente en la carpeta backups\
) else (
    echo.
    echo [AVISO] Revisa las instrucciones mostradas arriba para configurar las credenciales.
)

echo.
timeout /t 10
