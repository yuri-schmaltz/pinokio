#!/usr/bin/env python3

"""
╔════════════════════════════════════════════════════════════════════════════╗
║                                                                            ║
║                    PINOKIO — Setup & Launcher (Python)                   ║
║                                                                            ║
║  Interactive setup and launcher for Pinokio Tauri desktop application.   ║
║  Supports both Web (Flask) and Desktop (Tauri) modes.                    ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝
"""

import os
import sys
import subprocess
import platform
import shutil
from pathlib import Path
from packaging import version

################################################################################
# Configuration
################################################################################

PROJECT_ROOT = Path(__file__).parent.absolute()
FACE_DETECTOR_DIR = PROJECT_ROOT / "examples" / "face-detector"
TAURI_DIR = PROJECT_ROOT / "backend" / "tauri"
VENV_PATH = FACE_DETECTOR_DIR / ".venv"

NODE_VERSION_REQUIRED = "16.0.0"
PYTHON_VERSION_REQUIRED = "3.8"

# ANSI Colors
class Colors:
    RED = "\033[0;31m"
    GREEN = "\033[0;32m"
    YELLOW = "\033[1;33m"
    BLUE = "\033[0;34m"
    CYAN = "\033[0;36m"
    NC = "\033[0m"  # No Color

################################################################################
# Helper Functions
################################################################################

def print_header(text: str) -> None:
    """Print a formatted header."""
    print(f"\n{Colors.BLUE}╔════════════════════════════════════════════════════════════════╗{Colors.NC}")
    print(f"{Colors.BLUE}║{Colors.NC}  {text}")
    print(f"{Colors.BLUE}╚════════════════════════════════════════════════════════════════╝{Colors.NC}\n")

def print_success(text: str) -> None:
    """Print success message."""
    print(f"{Colors.GREEN}✅ {text}{Colors.NC}")

def print_error(text: str) -> None:
    """Print error message."""
    print(f"{Colors.RED}❌ {text}{Colors.NC}")

def print_warning(text: str) -> None:
    """Print warning message."""
    print(f"{Colors.YELLOW}⚠️  {text}{Colors.NC}")

def print_info(text: str) -> None:
    """Print info message."""
    print(f"{Colors.BLUE}ℹ️  {text}{Colors.NC}")

def command_exists(cmd: str) -> bool:
    """Check if a command exists in PATH."""
    return shutil.which(cmd) is not None

def run_command(cmd: list, cwd: Path = None, check: bool = True) -> subprocess.CompletedProcess:
    """Run a shell command and return result."""
    try:
        return subprocess.run(cmd, cwd=cwd, check=check, capture_output=False, text=True)
    except subprocess.CalledProcessError as e:
        print_error(f"Command failed: {' '.join(cmd)}")
        if check:
            sys.exit(1)
        return e

################################################################################
# System Checks
################################################################################

def check_system() -> dict:
    """Check system requirements and environment."""
    print_header("🔍 System Check")

    info = {}

    # OS Detection
    os_name = platform.system()
    info["os"] = os_name
    print_info(f"Operating System: {os_name}")

    # Node.js
    if command_exists("node"):
        try:
            result = subprocess.run(["node", "-v"], capture_output=True, text=True)
            node_version = result.stdout.strip().lstrip("v")
            info["node"] = node_version
            print_success(f"Node.js: {node_version}")
        except Exception as e:
            print_error(f"Error detecting Node.js: {e}")
    else:
        print_error("Node.js not found. Install from https://nodejs.org/")
        sys.exit(1)

    # Python
    if command_exists("python3"):
        try:
            result = subprocess.run(
                ["python3", "-c", "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')"],
                capture_output=True,
                text=True
            )
            python_version = result.stdout.strip()
            info["python"] = python_version
            print_success(f"Python: {python_version}")
        except Exception as e:
            print_error(f"Error detecting Python: {e}")
    else:
        print_error("Python 3 not found. Install Python 3.8+")
        sys.exit(1)

    # npm
    if command_exists("npm"):
        try:
            result = subprocess.run(["npm", "-v"], capture_output=True, text=True)
            npm_version = result.stdout.strip()
            info["npm"] = npm_version
            print_success(f"npm: {npm_version}")
        except Exception as e:
            print_error(f"Error detecting npm: {e}")
    else:
        print_error("npm not found")
        sys.exit(1)

    # Git (optional)
    if command_exists("git"):
        try:
            result = subprocess.run(["git", "--version"], capture_output=True, text=True)
            print_success(result.stdout.strip())
        except:
            pass
    else:
        print_warning("Git not found (optional)")

    # Rust (for Tauri)
    if command_exists("rustc"):
        try:
            result = subprocess.run(["rustc", "--version"], capture_output=True, text=True)
            print_success(result.stdout.strip())
            info["rust"] = True
        except:
            info["rust"] = False
    else:
        print_warning("Rust not found. For Tauri, install from https://rustup.rs/")
        info["rust"] = False

    return info

################################################################################
# Installation Functions
################################################################################

def install_dependencies() -> None:
    """Install all project dependencies."""
    print_header("📦 Installing Dependencies")

    # Install Node dependencies
    print_info("Installing Node.js dependencies...")
    tauri_package = TAURI_DIR / "package.json"
    if tauri_package.exists():
        try:
            run_command(["npm", "install", "--legacy-peer-deps"], cwd=TAURI_DIR)
            print_success("Node dependencies installed")
        except SystemExit:
            print_error("Failed to install Node dependencies")
            return

    # Create Python virtual environment
    print_info("Setting up Python virtual environment...")
    if not VENV_PATH.exists():
        run_command(["python3", "-m", "venv", str(VENV_PATH)])
        print_success("Virtual environment created")
    else:
        print_warning("Virtual environment already exists")

    # Install Python packages
    print_info("Installing Python packages...")
    venv_python = VENV_PATH / "bin" / "python"
    venv_pip = VENV_PATH / "bin" / "pip"

    if sys.platform == "win32":
        venv_python = VENV_PATH / "Scripts" / "python.exe"
        venv_pip = VENV_PATH / "Scripts" / "pip.exe"

    try:
        run_command([str(venv_pip), "install", "--upgrade", "pip", "setuptools", "wheel"])
        run_command([str(venv_pip), "install", "flask", "numpy", "opencv-python", "pillow", "requests"])
        print_success("Python dependencies installed")
    except SystemExit:
        print_error("Failed to install Python dependencies")

################################################################################
# Launch Functions
################################################################################

def launch_web_app() -> None:
    """Launch the Flask web application."""
    print_header("🌐 Starting Face Detector (Web Server)")

    app_file = FACE_DETECTOR_DIR / "app.py"
    if not app_file.exists():
        print_error(f"app.py not found in {FACE_DETECTOR_DIR}")
        return

    print_info("Starting Flask server on http://localhost:5000...")
    print_info("Press Ctrl+C to stop the server")

    venv_python = VENV_PATH / "bin" / "python"
    if sys.platform == "win32":
        venv_python = VENV_PATH / "Scripts" / "python.exe"

    try:
        run_command([str(venv_python), "app.py"], cwd=FACE_DETECTOR_DIR, check=False)
    except KeyboardInterrupt:
        print_info("Server stopped")

def launch_tauri_dev() -> None:
    """Launch Tauri in development mode."""
    print_header("💻 Starting Tauri Desktop App")

    if not (PROJECT_ROOT / "package.json").exists():
        print_error(f"package.json not found in {PROJECT_ROOT}")
        return

    print_info("Building and launching Tauri app...")
    try:
        run_command(["npm", "run", "dev"], cwd=PROJECT_ROOT)
    except KeyboardInterrupt:
        print_info("Tauri app closed")

def build_tauri_release() -> None:
    """Build Tauri for production."""
    print_header("🔨 Building Tauri Release")

    if not (PROJECT_ROOT / "package.json").exists():
        print_error(f"package.json not found in {PROJECT_ROOT}")
        return

    print_warning("This may take 5-15 minutes...")
    try:
        run_command(["npm", "run", "build"], cwd=PROJECT_ROOT)
        print_success(f"Build complete! Binary in: {PROJECT_ROOT / 'backend' / 'tauri' / 'target' / 'release' / 'bundle'}/")
    except SystemExit:
        print_error("Build failed")

def show_system_info(info: dict) -> None:
    """Display detailed system information."""
    print_header("📊 System Information")

    print(f"Operating System: {info.get('os', 'Unknown')}")
    print(f"Node.js: {info.get('node', 'Not found')}")
    print(f"npm: {info.get('npm', 'Not found')}")
    print(f"Python: {info.get('python', 'Not found')}")
    print(f"Rust: {'✓' if info.get('rust') else '✗'}")

    print("\nProject Paths:")
    print(f"  Root: {PROJECT_ROOT}")
    print(f"  Face Detector: {FACE_DETECTOR_DIR}")
    print(f"  Tauri: {TAURI_DIR}")
    print(f"  Python venv: {VENV_PATH}")

    # Show installed packages
    venv_pip = VENV_PATH / "bin" / "pip"
    if sys.platform == "win32":
        venv_pip = VENV_PATH / "Scripts" / "pip.exe"

    if venv_pip.exists():
        print("\nInstalled Python packages:")
        try:
            result = subprocess.run([str(venv_pip), "list"], capture_output=True, text=True)
            for line in result.stdout.split("\n"):
                if any(pkg in line.lower() for pkg in ["opencv", "flask", "numpy", "pillow"]):
                    print(f"  {line}")
        except:
            print("  (Could not list packages)")

################################################################################
# Interactive Menu
################################################################################

def show_menu() -> str:
    """Display interactive menu and get user choice."""
    print_header("🚀 Pinokio — Launch Menu")

    print("Choose launch mode:")
    print("")
    print("  1️⃣  Face Detector (Web — Flask)")
    print("       Fast development server on http://localhost:5000")
    print("")
    print("  2️⃣  Desktop App (Tauri)")
    print("       Native desktop app with hot reload")
    print("")
    print("  3️⃣  Build Desktop (Production)")
    print("       Create optimized Tauri binary")
    print("")
    print("  4️⃣  Install/Update Dependencies")
    print("       Reinstall all packages")
    print("")
    print("  5️⃣  Show System Info")
    print("       Display environment details")
    print("")
    print("  0️⃣  Exit")
    print("")

    while True:
        try:
            choice = input("Enter choice [0-5]: ").strip()
            if choice in ["0", "1", "2", "3", "4", "5"]:
                return choice
            print_error("Invalid choice. Please enter 0-5.")
        except KeyboardInterrupt:
            print_info("Goodbye!")
            sys.exit(0)

################################################################################
# Main
################################################################################

def main(args: list = None) -> None:
    """Main entry point."""
    # Check system first
    info = check_system()

    # Handle command-line arguments
    if args is None:
        args = sys.argv[1:]

    if args:
        cmd = args[0].lower()

        if cmd in ["web", "app", "flask"]:
            install_dependencies()
            launch_web_app()
        elif cmd in ["tauri", "desktop"]:
            install_dependencies()
            launch_tauri_dev()
        elif cmd == "build":
            install_dependencies()
            build_tauri_release()
        elif cmd == "install":
            install_dependencies()
        elif cmd == "info":
            show_system_info(info)
        elif cmd in ["--help", "-h"]:
            print_help()
        else:
            print_error(f"Unknown command: {cmd}")
            print_help()
            sys.exit(1)
    else:
        # Interactive menu
        while True:
            choice = show_menu()

            if choice == "1":
                install_dependencies()
                launch_web_app()
            elif choice == "2":
                install_dependencies()
                launch_tauri_dev()
            elif choice == "3":
                install_dependencies()
                build_tauri_release()
            elif choice == "4":
                install_dependencies()
            elif choice == "5":
                show_system_info(info)
            elif choice == "0":
                print_info("Goodbye!")
                break

def print_help() -> None:
    """Print help message."""
    print("""
Pinokio Setup Script (Python)

Usage: python3 setup.py [COMMAND]

Commands:
  web          Start Face Detector web app (Flask)
  tauri        Start Tauri desktop app (development)
  build        Build Tauri release binary
  install      Install/update all dependencies
  info         Show system information
  --help, -h   Show this message

Examples:
  python3 setup.py web          # Start Flask server
  python3 setup.py tauri        # Start desktop app
  python3 setup.py build        # Build production binary
  python3 setup.py              # Show interactive menu (no args)
    """)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print_info("\nInterrupted by user")
        sys.exit(0)
    except Exception as e:
        print_error(f"Unexpected error: {e}")
        sys.exit(1)
