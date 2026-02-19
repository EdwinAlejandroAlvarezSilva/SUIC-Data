@echo off
REM Script para iniciar el servidor de almacenamiento sin necesidad de PowerShell/CMD
REM Simplemente haz doble clic en este archivo y el servidor se iniciará en background

REM Verificar si Node.js está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: Node.js no está instalado o no está en el PATH
    echo.
    echo Por favor instala Node.js desde: https://nodejs.org
    echo Después ejecuta este archivo de nuevo.
    echo.
    pause
    exit /b 1
)

REM Cambiar a la carpeta actual
cd /d "%~dp0"

REM Instalar dependencias si no existen
if not exist "node_modules" (
    echo Instalando dependencias (primera vez)...
    call npm install
    echo.
)

REM Iniciar el servidor en background (sin bloquear la consola)
echo.
echo ====================================================
echo   SERVIDOR DE ALMACENAMIENTO SUIC DATA
echo ====================================================
echo.
echo Estado: INICIANDO...
echo URL: http://localhost:3000
echo Carpeta: %cd%
echo.
echo El servidor está corriendo en background.
echo Mantén este programa abierto mientras uses SUIC Data.
echo.
echo Para detener: Cierra esta ventana
echo.
echo ====================================================
echo.

REM Ejecutar el servidor
node server.js

REM Si el servidor se detiene, esperar antes de cerrar
pause
