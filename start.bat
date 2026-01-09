@echo off
REM Pinokio - Setup e Inicialização para Windows
REM Script simples e robusto para iniciar a aplicação

setlocal enabledelayedexpansion

REM ============================================================================
REM CONFIGURAÇÕES
REM ============================================================================

set "SCRIPT_DIR=%~dp0"
set "LOG_FILE=%SCRIPT_DIR%setup.log"
set "TIMESTAMP=%DATE% %TIME%"
set "FORCE_INSTALL=0"

REM ============================================================================
REM PROCESSAMENTO DE ARGUMENTOS
REM ============================================================================

:parse_args
if "%~1"=="" goto args_done
if "%~1"=="--help" goto show_help
if "%~1"=="-h" goto show_help
if "%~1"=="--force" goto set_force
if "%~1"=="-f" goto set_force

shift
goto parse_args

:set_force
set "FORCE_INSTALL=1"
shift
goto parse_args

:args_done

REM ============================================================================
REM LOGGING
REM ============================================================================

for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set "DATE_STAMP=%%c%%a%%b")
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set "TIME_STAMP=%%a%%b")

echo [%TIMESTAMP%] ========== Pinokio Setup iniciado ========== >> "%LOG_FILE%"

REM ============================================================================
REM VERIFICAÇÃO DE PRÉ-REQUISITOS
REM ============================================================================

echo.
echo Verificando pré-requisitos...
echo.

REM Verificar Node.js
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js não encontrado no PATH
    echo.
    echo Por favor, instale Node.js v20+ de: https://nodejs.org/
    echo Após instalar, reinicie o terminal e tente novamente.
    echo.
    echo [%TIMESTAMP%] ERRO: Node.js não encontrado >> "%LOG_FILE%"
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set "NODE_VERSION=%%i"
echo [SUCCESS] Node.js encontrado: %NODE_VERSION%
echo [%TIMESTAMP%] Node.js encontrado: %NODE_VERSION% >> "%LOG_FILE%"

REM Verificar npm
where npm >nul 2>nul
if errorlevel 1 (
    echo [ERROR] npm não encontrado
    echo.
    echo Reinstale Node.js com npm incluído.
    echo [%TIMESTAMP%] ERRO: npm não encontrado >> "%LOG_FILE%"
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set "NPM_VERSION=%%i"
echo [SUCCESS] npm encontrado: v%NPM_VERSION%
echo [%TIMESTAMP%] npm encontrado: v%NPM_VERSION% >> "%LOG_FILE%"

REM ============================================================================
REM SETUP DO AMBIENTE
REM ============================================================================

echo.
echo Configurando ambiente...
echo.

cd /d "%SCRIPT_DIR%"
if errorlevel 1 (
    echo [ERROR] Falha ao mudar para diretório do projeto
    echo [%TIMESTAMP%] ERRO: Falha ao mudar diretório >> "%LOG_FILE%"
    pause
    exit /b 1
)

echo [SUCCESS] Diretório do projeto: %CD%
echo [%TIMESTAMP%] Diretório do projeto: %CD% >> "%LOG_FILE%"

REM ============================================================================
REM VERIFICAÇÃO DE DEPENDÊNCIAS
REM ============================================================================

echo.
echo Verificando dependências...
echo.

REM Verificar package.json
if not exist "package.json" (
    echo [ERROR] package.json não encontrado
    echo [%TIMESTAMP%] ERRO: package.json não encontrado >> "%LOG_FILE%"
    pause
    exit /b 1
)

echo [SUCCESS] package.json encontrado
echo [%TIMESTAMP%] package.json encontrado >> "%LOG_FILE%"

REM Verificar node_modules
if "%FORCE_INSTALL%"=="1" (
    if exist "node_modules" (
        echo [WARNING] Removendo node_modules (--force ativado)...
        echo [%TIMESTAMP%] Removendo node_modules >> "%LOG_FILE%"
        rmdir /s /q "node_modules" 2>nul
        del /q "package-lock.json" 2>nul
    )
)

if not exist "node_modules" (
    echo [WARNING] node_modules não encontrado
    echo.
    echo Instalando dependências... (isto pode levar alguns minutos)
    echo.
    echo [%TIMESTAMP%] Iniciando instalação de dependências >> "%LOG_FILE%"
    
    call npm install
    if errorlevel 1 (
        echo.
        echo [ERROR] Falha ao instalar dependências
        echo.
        echo Sugestões:
        echo 1. Verifique sua conexão com a internet
        echo 2. Tente novamente: start.bat --force
        echo 3. Limpe o cache: npm cache clean --force
        echo.
        echo [%TIMESTAMP%] ERRO: Falha ao instalar dependências >> "%LOG_FILE%"
        pause
        exit /b 1
    )
    
    echo.
    echo [SUCCESS] Dependências instaladas com sucesso
    echo [%TIMESTAMP%] Dependências instaladas com sucesso >> "%LOG_FILE%"
) else (
    echo [SUCCESS] node_modules já existe
    echo [%TIMESTAMP%] node_modules já existe >> "%LOG_FILE%"
)

REM ============================================================================
REM VALIDAÇÃO DO SETUP
REM ============================================================================

echo.
echo Validando setup...
echo.

if not exist "node_modules\electron" (
    echo [ERROR] Electron não está instalado
    echo [%TIMESTAMP%] ERRO: Electron não instalado >> "%LOG_FILE%"
    pause
    exit /b 1
)

echo [SUCCESS] Electron disponível
echo [%TIMESTAMP%] Electron disponível >> "%LOG_FILE%"

if not exist "backend\src\electron\main.js" (
    echo [ERROR] backend\src\electron\main.js não encontrado
    echo [%TIMESTAMP%] ERRO: backend\src\electron\main.js não encontrado >> "%LOG_FILE%"
    pause
    exit /b 1
)

echo [SUCCESS] Arquivo principal encontrado: backend\src\electron\main.js
echo [%TIMESTAMP%] Arquivo principal encontrado >> "%LOG_FILE%"

REM ============================================================================
REM INICIAR APLICAÇÃO
REM ============================================================================

echo.
echo ============================================================================
echo Iniciando Pinokio...
echo ============================================================================
echo.
echo Pressione Ctrl+C para parar a aplicação.
echo Log de execução salvo em: %LOG_FILE%
echo.

REM ============================================================================
REM HELP
REM ============================================================================

:show_help
echo.
echo Pinokio - Setup e Inicialização
echo.
echo Uso: start.bat [OPTIONS]
echo.
echo Opções:
echo   -h, --help    Mostra esta ajuda
echo   -f, --force   Força reinstalação de dependências
echo.
echo Exemplos:
echo   start.bat              # Inicia normalmente
echo   start.bat --force      # Força reinstalação de dependências
echo.
exit /b 0

echo [%TIMESTAMP%] Iniciando Pinokio >> "%LOG_FILE%"

call npm start

set "EXIT_CODE=!errorlevel!"
echo [%TIMESTAMP%] Pinokio finalizou com código: %EXIT_CODE% >> "%LOG_FILE%"

exit /b %EXIT_CODE%

