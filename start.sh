#!/bin/bash
################################################################################
# Pinokio - Setup e Inicialização Inteligente para Unix-like Systems
# Suporta: macOS, Linux, WSL
################################################################################

set -u

################################################################################
# CONFIGURAÇÕES
################################################################################

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="${SCRIPT_DIR}/setup.log"
QUIET_MODE=false
FORCE_INSTALL=false

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

################################################################################
# FUNÇÕES
################################################################################

log_info() {
    local message="$1"
    echo -e "${BLUE}[INFO]${NC} ${message}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO: ${message}" >> "${LOG_FILE}"
}

log_success() {
    local message="$1"
    echo -e "${GREEN}[SUCCESS]${NC} ${message}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: ${message}" >> "${LOG_FILE}"
}

log_warning() {
    local message="$1"
    echo -e "${YELLOW}[WARNING]${NC} ${message}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: ${message}" >> "${LOG_FILE}"
}

log_error() {
    local message="$1"
    echo -e "${RED}[ERROR]${NC} ${message}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: ${message}" >> "${LOG_FILE}"
}

separator() {
    local title="$1"
    echo ""
    echo -e "${BOLD}${BLUE}============================================================================${NC}"
    echo -e "${BOLD}${BLUE}${title}${NC}"
    echo -e "${BOLD}${BLUE}============================================================================${NC}"
    echo ""
}

prompt_yes_no() {
    local question="$1"
    local response
    
    while true; do
        read -p "$(echo -e ${BOLD}${BLUE})${question}${NC} (s/n): " -r response
        case "${response}" in
            [Ss]) return 0 ;;
            [Nn]) return 1 ;;
            *) echo "Por favor, digite 's' ou 'n'" ;;
        esac
    done
}

################################################################################
# VERIFICAÇÃO DE PRÉ-REQUISITOS
################################################################################

check_prerequisites() {
    separator "Verificando Pré-requisitos"
    
    local missing_tools=()
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js não encontrado"
        missing_tools+=("Node.js")
    else
        local node_version
        node_version=$(node --version)
        log_success "Node.js encontrado: ${node_version}"
    fi
    
    # Verificar npm
    if ! command -v npm &> /dev/null; then
        log_error "npm não encontrado"
        missing_tools+=("npm")
    else
        local npm_version
        npm_version=$(npm --version)
        log_success "npm encontrado: v${npm_version}"
    fi
    
    # Verificar Git (opcional mas recomendado)
    if ! command -v git &> /dev/null; then
        log_warning "Git não encontrado (opcional mas recomendado)"
    else
        local git_version
        git_version=$(git --version)
        log_success "${git_version}"
    fi
    
    # Se há ferramentas faltando
    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        echo ""
        log_error "Ferramentas necessárias faltando: ${missing_tools[*]}"
        echo ""
        echo "Instruções de instalação:"
        
        if [[ "$OSTYPE" == "darwin"* ]]; then
            echo "  macOS (Homebrew): brew install node"
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            echo "  Ubuntu/Debian: sudo apt-get update && sudo apt-get install nodejs npm"
            echo "  Fedora: sudo dnf install nodejs npm"
            echo "  Arch: sudo pacman -S nodejs npm"
        fi
        
        echo ""
        echo "  Ou acesse: https://nodejs.org/"
        echo ""
        return 1
    fi
    
    return 0
}

################################################################################
# SETUP DO AMBIENTE
################################################################################

setup_environment() {
    separator "Configurando Ambiente"
    
    # Mudar para diretório do script
    cd "${SCRIPT_DIR}" || {
        log_error "Falha ao mudar para diretório do projeto"
        return 1
    }
    
    log_success "Diretório do projeto: $(pwd)"
    
    # Detectar sistema operacional
    local os_type
    if [[ "$OSTYPE" == "darwin"* ]]; then
        os_type="macOS"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        os_type="Linux"
    else
        os_type="Desconhecido"
    fi
    
    log_info "Sistema Operacional: ${os_type}"
    
    # Verificar se é repositório Git
    if [[ -d ".git" ]]; then
        log_success "Repositório Git detectado"
    else
        log_warning "Não é um repositório Git"
    fi
    
    # Criar arquivo de log
    if [[ ! -f "${LOG_FILE}" ]]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Pinokio Setup Log" > "${LOG_FILE}"
        log_success "Arquivo de log criado: setup.log"
    fi
    
    return 0
}

################################################################################
# VERIFICAÇÃO E INSTALAÇÃO DE DEPENDÊNCIAS
################################################################################

check_dependencies() {
    separator "Verificando Dependências"
    
    # Verificar package.json
    if [[ ! -f "package.json" ]]; then
        log_error "package.json não encontrado"
        return 1
    fi
    
    log_success "package.json encontrado"
    
    # Verificar node_modules
    if [[ ! -d "node_modules" ]]; then
        log_warning "node_modules não encontrado"
        echo ""
        
        if prompt_yes_no "Deseja instalar dependências agora?"; then
            install_dependencies || return 1
        else
            log_error "Dependências não instaladas. Abortando."
            return 1
        fi
    else
        # Verificar se package.json foi modificado
        if check_package_json_changes; then
            log_warning "package.json foi modificado. Atualizando dependências..."
            install_dependencies || return 1
        else
            log_success "Dependências já instaladas"
        fi
    fi
    
    return 0
}

install_dependencies() {
    separator "Instalando Dependências"
    
    log_info "Isso pode levar alguns minutos..."
    echo ""
    
    if npm install; then
        log_success "Dependências instaladas com sucesso"
        return 0
    else
        log_error "Falha ao instalar dependências"
        echo ""
        echo "Sugestões de solução:"
        echo "  1. Verifique sua conexão com a internet"
        echo "  2. Limpe o cache: npm cache clean --force"
        echo "  3. Aumente o timeout: npm install --no-audit --timeout 120000"
        echo "  4. Tente novamente"
        echo ""
        return 1
    fi
}

check_package_json_changes() {
    # Se há package-lock.json e node_modules, assume que está tudo OK
    if [[ -f "package-lock.json" && -d "node_modules" ]]; then
        return 1  # Nenhuma mudança detectada
    fi
    return 0  # Mudanças detectadas
}

################################################################################
# VALIDAÇÃO DO SETUP
################################################################################

validate_setup() {
    separator "Validando Setup"
    
    local validation_failed=false
    
    # Verificar se electron está disponível
    if [[ ! -d "node_modules/electron" ]]; then
        log_error "Electron não foi instalado"
        validation_failed=true
    else
        log_success "Electron disponível"
    fi
    
    # Verificar se main.js existe
    if [[ ! -f "src/electron/main.js" ]]; then
        log_error "src/electron/main.js não encontrado"
        validation_failed=true
    else
        log_success "Arquivo principal encontrado: src/electron/main.js"
    fi
    
    # Verificar se ui/ existe
    if [[ ! -d "ui" ]]; then
        log_error "Diretório ui/ não encontrado"
        validation_failed=true
    else
        log_success "Diretório UI encontrado"
    fi
    
    if [[ "${validation_failed}" == true ]]; then
        return 1
    fi
    
    log_success "Validação concluída com sucesso!"
    return 0
}

################################################################################
# INICIALIZAÇÃO DA APLICAÇÃO
################################################################################

start_application() {
    separator "Iniciando Pinokio"
    
    echo ""
    log_info "Pinokio está iniciando..."
    echo "Pressione Ctrl+C para parar a aplicação."
    echo ""
    log_info "Log de execução salvo em: ${LOG_FILE}"
    echo ""
    
    npm start
    local exit_code=$?
    
    if [[ ${exit_code} -eq 0 ]]; then
        log_success "Pinokio finalizou normalmente"
    else
        log_error "Pinokio finalizou com código de erro: ${exit_code}"
    fi
    
    return ${exit_code}
}

################################################################################
# PROCESSAMENTO DE ARGUMENTOS
################################################################################

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -q|--quiet)
                QUIET_MODE=true
                shift
                ;;
            -f|--force)
                FORCE_INSTALL=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                echo "Argumento desconhecido: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

show_help() {
    cat << EOF
Pinokio - Setup e Inicialização

Uso: ./start.sh [OPÇÕES]

Opções:
  -f, --force     Força reinstalação de dependências
  -q, --quiet     Modo silencioso
  -h, --help      Mostra esta ajuda

Exemplos:
  ./start.sh              # Setup normal e inicia
  ./start.sh --force      # Força reinstalação de dependências
  ./start.sh --quiet      # Modo silencioso

EOF
}

################################################################################
# MAIN
################################################################################

main() {
    log_info "======== Pinokio Setup e Inicialização ========"
    log_info "Data/Hora: $(date '+%Y-%m-%d %H:%M:%S')"
    log_info "Diretório: ${SCRIPT_DIR}"
    
    parse_arguments "$@"
    
    check_prerequisites || exit 1
    setup_environment || exit 1
    
    if [[ "${FORCE_INSTALL}" == true ]]; then
        log_warning "Modo --force ativado. Removendo node_modules..."
        rm -rf node_modules package-lock.json
    fi
    
    check_dependencies || exit 1
    validate_setup || exit 1
    start_application
    exit $?
}

################################################################################
# ENTRYPOINT
################################################################################

main "$@"
