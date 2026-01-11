#!/bin/bash
# 🚀 Face Detector - Quick Start Script
# Run this script to set up and start the Face Detector app

set -e

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "📁 App directory: $APP_DIR"
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🎬 Face Detector - Quick Start${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Step 1: Check Python
echo -e "${YELLOW}Step 1: Checking Python...${NC}"
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.8+"
    exit 1
fi
PYTHON_VERSION=$(python3 --version | awk '{print $2}')
echo -e "${GREEN}✅ Python $PYTHON_VERSION found${NC}"
echo ""

# Step 2: Create virtual environment
echo -e "${YELLOW}Step 2: Setting up virtual environment...${NC}"
if [ ! -d "$APP_DIR/.venv" ]; then
    python3 -m venv "$APP_DIR/.venv"
    echo -e "${GREEN}✅ Virtual environment created${NC}"
else
    echo -e "${GREEN}✅ Virtual environment already exists${NC}"
fi
echo ""

# Step 3: Activate and install dependencies
echo -e "${YELLOW}Step 3: Installing dependencies...${NC}"
source "$APP_DIR/.venv/bin/activate"
pip install --upgrade pip setuptools wheel > /dev/null 2>&1
pip install mediapipe opencv-python numpy pillow flask flask-cors > /dev/null 2>&1
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Step 4: Create directories
echo -e "${YELLOW}Step 4: Creating directories...${NC}"
mkdir -p "$APP_DIR/input" "$APP_DIR/output"
echo -e "${GREEN}✅ Directories ready${NC}"
echo ""

# Step 5: Download sample image
echo -e "${YELLOW}Step 5: Downloading sample image...${NC}"
if [ ! -f "$APP_DIR/input/sample.jpg" ]; then
    if command -v curl &> /dev/null; then
        curl -s -o "$APP_DIR/input/sample.jpg" \
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400" 2>/dev/null || true
    elif command -v wget &> /dev/null; then
        wget -q -O "$APP_DIR/input/sample.jpg" \
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400" 2>/dev/null || true
    fi
    
    if [ -f "$APP_DIR/input/sample.jpg" ]; then
        echo -e "${GREEN}✅ Sample image downloaded${NC}"
    else
        echo -e "${YELLOW}⚠️ Could not download sample image (no curl/wget)${NC}"
        echo -e "${YELLOW}   You can upload your own image manually${NC}"
    fi
else
    echo -e "${GREEN}✅ Sample image already exists${NC}"
fi
echo ""

# Step 6: Start server
echo -e "${YELLOW}Step 6: Starting server...${NC}"
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🎬 Face Detector Server Starting${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📊 Dashboard:${NC} http://localhost:5000"
echo -e "${BLUE}📁 Input:${NC}     $APP_DIR/input"
echo -e "${BLUE}📁 Output:${NC}    $APP_DIR/output"
echo ""
echo "Press Ctrl+C to stop server"
echo ""

cd "$APP_DIR"
python3 app.py
