#!/bin/bash

################################################################################
#                                                                              #
#                    PINOKIO — Setup & Launcher Script                       #
#                                                                              #
#  This script detects your environment and launches Pinokio with minimal    #
#  configuration. Supports both Desktop (Tauri) and Web (Flask) modes.       #
#                                                                              #
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FACE_DETECTOR_DIR="$PROJECT_ROOT/examples/face-detector"
TAURI_DIR="$PROJECT_ROOT/backend/tauri"
VENV_PATH="$FACE_DETECTOR_DIR/.venv"
NODE_VERSION_REQUIRED="16.0.0"
PYTHON_VERSION_REQUIRED="3.8"

################################################################################
# Helper Functions
################################################################################

print_header() {
  echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║${NC}  $1"
  echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}\n"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

version_gte() {
  printf '%s\n%s' "$2" "$1" | sort -V -C
}

################################################################################
# System Checks
################################################################################

check_system() {
  print_header "🔍 System Check"

  # Check OS
  if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="Linux"
  elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macOS"
  elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    OS="Windows"
  else
    OS="Unknown"
  fi
  print_info "Operating System: $OS"

  # Check Node.js
  if command_exists node; then
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    print_success "Node.js: $NODE_VERSION"
  else
    print_error "Node.js not found. Please install Node.js $NODE_VERSION_REQUIRED+"
    exit 1
  fi

  # Check Python
  if command_exists python3; then
    PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
    print_success "Python: $PYTHON_VERSION"
  else
    print_error "Python 3 not found. Please install Python $PYTHON_VERSION_REQUIRED+"
    exit 1
  fi

  # Check npm
  if command_exists npm; then
    NPM_VERSION=$(npm -v)
    print_success "npm: $NPM_VERSION"
  else
    print_error "npm not found. Please install npm"
    exit 1
  fi

  # Check Git
  if command_exists git; then
    GIT_VERSION=$(git --version | awk '{print $3}')
    print_success "Git: $GIT_VERSION"
  else
    print_warning "Git not found (optional, but recommended)"
  fi

  # Check Rust (for Tauri)
  if command_exists rustc; then
    RUST_VERSION=$(rustc --version | awk '{print $2}')
    print_success "Rust: $RUST_VERSION"
  else
    print_warning "Rust not found. For Tauri builds, install from https://rustup.rs/"
  fi
}

################################################################################
# Installation Functions
################################################################################

install_dependencies() {
  print_header "📦 Installing Dependencies"

  # Install Node dependencies
  print_info "Installing Node.js dependencies..."
  if [ -f "$TAURI_DIR/package.json" ]; then
    cd "$TAURI_DIR"
    npm install --legacy-peer-deps 2>&1 | tail -5
    print_success "Node dependencies installed"
    cd "$PROJECT_ROOT"
  fi

  # Create Python virtual environment
  print_info "Setting up Python virtual environment..."
  if [ ! -d "$VENV_PATH" ]; then
    python3 -m venv "$VENV_PATH"
    print_success "Virtual environment created"
  else
    print_warning "Virtual environment already exists"
  fi

  # Install Python dependencies
  print_info "Installing Python packages..."
  source "$VENV_PATH/bin/activate"
  pip install --upgrade pip setuptools wheel >/dev/null 2>&1
  pip install flask numpy opencv-python pillow requests >/dev/null 2>&1
  print_success "Python dependencies installed"
  deactivate
}

################################################################################
# Launcher Menu
################################################################################

show_menu() {
  print_header "🚀 Pinokio — Launch Menu"

  echo "Choose launch mode:"
  echo ""
  echo "  1️⃣  Face Detector (Web — Flask)"
  echo "       Fast development server on http://localhost:5000"
  echo ""
  echo "  2️⃣  Desktop App (Tauri)"
  echo "       Native desktop app with hot reload"
  echo ""
  echo "  3️⃣  Build Desktop (Production)"
  echo "       Create optimized Tauri binary"
  echo ""
  echo "  4️⃣  Install/Update Dependencies"
  echo "       Reinstall all packages"
  echo ""
  echo "  5️⃣  Show System Info"
  echo "       Display environment details"
  echo ""
  echo "  0️⃣  Exit"
  echo ""
  read -p "Enter choice [0-5]: " choice
}

launch_web_app() {
  print_header "🌐 Starting Face Detector (Web Server)"

  if [ ! -f "$FACE_DETECTOR_DIR/app.py" ]; then
    print_error "app.py not found in $FACE_DETECTOR_DIR"
    return 1
  fi

  print_info "Starting Flask server..."
  cd "$FACE_DETECTOR_DIR"
  source "$VENV_PATH/bin/activate"
  python3 app.py
}

launch_tauri_dev() {
  print_header "💻 Starting Tauri Desktop App"

  if [ ! -f "$PROJECT_ROOT/package.json" ]; then
    print_error "package.json not found in $PROJECT_ROOT"
    return 1
  fi

  if ! command_exists rustc; then
    print_error "Rust not installed. Install from https://rustup.rs/"
    return 1
  fi

  print_info "Building and launching Tauri app..."
  cd "$PROJECT_ROOT"
  npm run dev
}

build_tauri_release() {
  print_header "🔨 Building Tauri Release"

  if [ ! -f "$PROJECT_ROOT/package.json" ]; then
    print_error "package.json not found in $PROJECT_ROOT"
    return 1
  fi

  if ! command_exists rustc; then
    print_error "Rust not installed. Install from https://rustup.rs/"
    return 1
  fi

  print_warning "This may take 5-15 minutes..."
  cd "$PROJECT_ROOT"
  npm run build
  
  print_success "Build complete! Binary in: $PROJECT_ROOT/backend/tauri/target/release/bundle/"
}

show_system_info() {
  print_header "📊 System Information"

  echo "Operating System: $OS"
  echo "Node.js: $(node -v)"
  echo "npm: $(npm -v)"
  echo "Python: $(python3 --version)"
  if command_exists rustc; then
    echo "Rust: $(rustc --version)"
  fi
  echo ""
  echo "Project Paths:"
  echo "  Root: $PROJECT_ROOT"
  echo "  Face Detector: $FACE_DETECTOR_DIR"
  echo "  Tauri: $TAURI_DIR"
  echo "  Python venv: $VENV_PATH"
  echo ""
  echo "Installed packages:"
  source "$VENV_PATH/bin/activate" 2>/dev/null && pip list | grep -E "opencv|flask|numpy" || echo "  (Virtual environment not activated)"
}

################################################################################
# Main Loop
################################################################################

main() {
  check_system

  while true; do
    show_menu
    case $choice in
      1)
        launch_web_app
        ;;
      2)
        launch_tauri_dev
        ;;
      3)
        build_tauri_release
        ;;
      4)
        install_dependencies
        ;;
      5)
        show_system_info
        ;;
      0)
        print_info "Goodbye!"
        exit 0
        ;;
      *)
        print_error "Invalid choice. Try again."
        ;;
    esac
  done
}

################################################################################
# Argument Parsing
################################################################################

if [ $# -eq 0 ]; then
  main
else
  case "$1" in
    web|app|flask)
      check_system
      launch_web_app
      ;;
    tauri|desktop)
      check_system
      launch_tauri_dev
      ;;
    build)
      check_system
      build_tauri_release
      ;;
    install)
      check_system
      install_dependencies
      ;;
    info)
      check_system
      show_system_info
      ;;
    --help|-h)
      echo "Pinokio Setup Script"
      echo ""
      echo "Usage: $0 [COMMAND]"
      echo ""
      echo "Commands:"
      echo "  web          Start Face Detector web app"
      echo "  tauri        Start Tauri desktop app (dev mode)"
      echo "  build        Build Tauri release binary"
      echo "  install      Install/update all dependencies"
      echo "  info         Show system information"
      echo "  --help       Show this message"
      echo ""
      echo "Examples:"
      echo "  $0 web          # Start Flask server"
      echo "  $0 tauri        # Start desktop app"
      echo "  $0 build        # Build production binary"
      echo "  $0              # Show interactive menu"
      ;;
    *)
      print_error "Unknown command: $1"
      echo "Use '$0 --help' for usage information"
      exit 1
      ;;
  esac
fi
