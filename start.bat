@echo off
REM Pinokio - Setup e Inicialização Inteligente para Windows
REM Este script configura o ambiente, instala dependências e inicia a aplicação

setlocal enabledelayedexpansion

REM ============================================================================
REM CONFIGURAÇÕES E CORES
REM ============================================================================
REM Cores (usando caracteres ASCII para compatibilidade)
for /F %%A in ('echo prompt $H ^| cmd') do set "BS=%%A"

set "SCRIPT_DIR=%~dp0"
set "LOG_FILE=%SCRIPT_DIR%setup.log"
set "QUIET_MODE=0"

REM ============================================================================
REM FUNÇÕES
REM ============================================================================

:log_info
echo [INFO] %~1
echo [%DATE% %TIME%] INFO: %~1 >> "%LOG_FILE%"
goto :eof

:log_success
echo [SUCCESS] %~1
echo [%DATE% %TIME%] SUCCESS: %~1 >> "%LOG_FILE%"
goto :eof

:log_warning
echo [WARNING] %~1
echo [%DATE% %TIME%] WARNING: %~1 >> "%LOG_FILE%"
goto :eof

:log_error
echo [ERROR] %~1
echo [%DATE% %TIME%] ERROR: %~1 >> "%LOG_FILE%"
goto :eof

:separator
echo.
echo ============================================================================
echo %~1
echo ============================================================================
echo.
goto :eof

REM ============================================================================
REM VERIFICAÇÃO DE PRÉ-REQUISITOS
REM ============================================================================

:check_prerequisites
call :separator "Verificando Pré-requisitos"

REM Verificar Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    call :log_error "Node.js não encontrado no PATH"
    echo.
    echo Por favor, instale Node.js v20+ de: https://nodejs.org/
    echo Após instalar, reinicie o terminal/cmd e tente novamente.
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set "NODE_VERSION=%%i"
call :log_success "Node.js encontrado: %NODE_VERSION%"

REM Verificar npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
    call :log_error "npm não encontrado. Reinstale Node.js com npm incluído."
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set "NPM_VERSION=%%i"
call :log_success "npm encontrado: v%NPM_VERSION%"

REM Verificar Git (opcional mas recomendado)
where git >nul 2>nul
if %errorlevel% neq 0 (
    call :log_warning "Git não encontrado. Recomenda-se instalar de: https://git-scm.com/"
) else (
    for /f "tokens=*" %%i in ('git --version') do set "GIT_VERSION=%%i"
    call :log_success "%GIT_VERSION%"
)

goto :eof

REM ============================================================================
REM SETUP DO AMBIENTE
REM ============================================================================

:setup_environment
call :separator "Configurando Ambiente"

cd /d "%SCRIPT_DIR%"
if %errorlevel% neq 0 (
    call :log_error "Falha ao mudar para diretório do projeto"
    exit /b 1
)

call :log_success "Diretório do projeto: %CD%"

REM Verificar se é um repositório git
if exist ".git" (
    call :log_success "Repositório Git detectado"
) else (
    call :log_warning "Não é um repositório Git. Execute 'git init' se necessário."
)

REM Criar arquivo de log se não existe
if not exist "%LOG_FILE%" (
    echo [%DATE% %TIME%] Pinokio Setup Log > "%LOG_FILE%"
    call :log_success "Arquivo de log criado: setup.log"
)

goto :eof

REM ============================================================================
REM VERIFICAÇÃO E INSTALAÇÃO DE DEPENDÊNCIAS
REM ============================================================================

:check_dependencies
call :separator "Verificando Dependências"

REM Verificar package.json
if not exist "package.json" (
    call :log_error "package.json não encontrado"
    pause
    exit /b 1
)

call :log_success "package.json encontrado"

REM Verificar node_modules
if not exist "node_modules" (
    call :log_warning "node_modules não encontrado"
    echo.
    echo Deseja instalar dependências agora?
    echo.
    set /p "INSTALL_DEPS=Digite 's' para sim ou 'n' para não: "
    
    if /i "!INSTALL_DEPS!"=="s" (
        call :install_dependencies
        if !errorlevel! neq 0 exit /b 1
    ) else (
        call :log_error "Dependências não instaladas. Abortando."
        pause
        exit /b 1
    )
) else (
    REM Verificar se há alterações em package.json
    call :check_package_json_changes
    if !errorlevel! neq 0 (
        call :log_warning "package.json foi modificado. Atualizando dependências..."
        call :install_dependencies
        if !errorlevel! neq 0 exit /b 1
    ) else (
        call :log_success "Dependências já instaladas e atualizadas"
    )
)

goto :eof

:install_dependencies
call :separator "Instalando Dependências"

echo.
echo Isso pode levar alguns minutos...
echo.

call npm install
if !errorlevel! neq 0 (
    call :log_error "Falha ao instalar dependências"
    echo.
    echo Sugestões:
    echo 1. Verifique sua conexão com a internet
    echo 2. Limpe o cache: npm cache clean --force
    echo 3. Tente novamente
    echo.
    pause
    exit /b 1
)

call :log_success "Dependências instaladas com sucesso"
goto :eof

:check_package_json_changes
REM Esta é uma verificação simplificada
if exist "package-lock.json" (
    exit /b 0
)
exit /b 1

REM ============================================================================
REM VALIDAÇÃO DO SETUP
REM ============================================================================

:validate_setup
call :separator "Validando Setup"

REM Verificar se electron está disponível
if not exist "node_modules\electron" (
    call :log_error "Electron não foi instalado. Abortando."
    pause
    exit /b 1
)

call :log_success "Electron disponível"

REM Verificar se main.js existe
if not exist "src\electron\main.js" (
    call :log_error "src\electron\main.js não encontrado"
    pause
    exit /b 1
)

call :log_success "Arquivo principal (src\electron\main.js) encontrado"

REM Verificar pasta ui
if not exist "ui" (
    call :log_error "Diretório ui\ não encontrado"
    pause
    exit /b 1
)

call :log_success "Diretório UI encontrado"

call :log_success "Validação concluída com sucesso!"

goto :eof

REM ============================================================================
REM INICIALIZAÇÃO DA APLICAÇÃO
REM ============================================================================

:start_application
call :separator "Iniciando Pinokio"

echo.
echo Pinokio está iniciando...
echo Pressione Ctrl+C para parar a aplicação.
echo.
echo Log de execução salvo em: %LOG_FILE%
echo.

call npm start
set "EXIT_CODE=!errorlevel!"

if !EXIT_CODE! neq 0 (
    call :log_error "Pinokio finalizou com código de erro: !EXIT_CODE!"
) else (
    call :log_success "Pinokio finalizou normalmente"
)

exit /b !EXIT_CODE!

REM ============================================================================
REM MAIN
REM ============================================================================

:main
call :log_info "======== Pinokio Setup e Inicialização ========"
call :log_info "Data/Hora: %DATE% %TIME%"
call :log_info "Diretório: %SCRIPT_DIR%"

call :check_prerequisites
if %errorlevel% neq 0 exit /b 1

call :setup_environment
if %errorlevel% neq 0 exit /b 1

call :check_dependencies
if %errorlevel% neq 0 exit /b 1

call :validate_setup
if %errorlevel% neq 0 exit /b 1

call :start_application
exit /b %errorlevel%

REM ============================================================================
REM ENTRYPOINT
REM ============================================================================

call :main
