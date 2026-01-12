#!/bin/bash

################################################################################
#                       Pinokio Cleanup Script                                 #
#                                                                              #
# Limpa artifacts de build, arquivos temporários e logs antigos para          #
# manter o workspace otimizado e prevenir disk full.                          #
################################################################################

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           🧹 Pinokio Workspace Cleanup                   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Measure before
BEFORE=$(du -sb "$PROJECT_ROOT" 2>/dev/null | cut -f1)

echo -e "${YELLOW}📊 Disk usage before:${NC}"
du -sh "$PROJECT_ROOT"
echo ""

# 1. Clean Rust artifacts
echo -e "${YELLOW}🦀 Cleaning Rust build artifacts...${NC}"
if [ -d "$PROJECT_ROOT/backend/tauri/target" ]; then
  cd "$PROJECT_ROOT/backend/tauri"
  
  # Clean release artifacts
  if [ -d "target/release" ]; then
    cargo clean --release 2>/dev/null || true
    echo -e "   ${GREEN}✅${NC} Cleaned release artifacts"
  fi
  
  # Remove intermediate files
  find target -name "*.rlib" -delete 2>/dev/null || true
  find target -name "*.rmeta" -delete 2>/dev/null || true
  echo -e "   ${GREEN}✅${NC} Removed .rlib and .rmeta files"
  
  # Remove fingerprint directories (can be regenerated)
  find target -type d -name ".fingerprint" -exec rm -rf {} + 2>/dev/null || true
  echo -e "   ${GREEN}✅${NC} Cleaned fingerprint directories"
fi

# 2. Clean temporary files
echo ""
echo -e "${YELLOW}🗑️  Cleaning temporary files...${NC}"
cd "$PROJECT_ROOT"

# Remove temp files
TEMP_COUNT=$(find . -type f \( -name "*.tmp" -o -name "*.bak" -o -name "*~" -o -name "*.swp" \) 2>/dev/null | wc -l)
find . -type f \( -name "*.tmp" -o -name "*.bak" -o -name "*~" -o -name "*.swp" \) -delete 2>/dev/null || true
echo -e "   ${GREEN}✅${NC} Removed $TEMP_COUNT temporary files"

# 3. Clean empty directories
echo ""
echo -e "${YELLOW}📂 Cleaning empty directories...${NC}"
EMPTY_COUNT=$(find . -type d -empty 2>/dev/null | wc -l)
find . -type d -empty -delete 2>/dev/null || true
echo -e "   ${GREEN}✅${NC} Removed $EMPTY_COUNT empty directories"

# 4. Clean old logs (keep last 30 days)
echo ""
echo -e "${YELLOW}📝 Cleaning old logs...${NC}"
OLD_LOGS=$(find . -name "*.log" -type f -mtime +30 2>/dev/null | wc -l)
if [ "$OLD_LOGS" -gt 0 ]; then
  find . -name "*.log" -type f -mtime +30 -delete 2>/dev/null || true
  echo -e "   ${GREEN}✅${NC} Removed $OLD_LOGS old log files (>30 days)"
else
  echo -e "   ${BLUE}ℹ️${NC}  No old logs found"
fi

# 5. Clean node_modules cache (optional, commented by default)
# Uncomment if you want to clean node module caches
# echo ""
# echo -e "${YELLOW}📦 Cleaning npm cache...${NC}"
# npm cache clean --force 2>/dev/null || true
# echo -e "   ${GREEN}✅${NC} npm cache cleaned"

# Measure after
AFTER=$(du -sb "$PROJECT_ROOT" 2>/dev/null | cut -f1)
SAVED=$((BEFORE - AFTER))
SAVED_MB=$((SAVED / 1024 / 1024))

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                  Cleanup Complete                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}📊 Disk usage after:${NC}"
du -sh "$PROJECT_ROOT"
echo ""
echo -e "${GREEN}💾 Space freed: ${SAVED_MB} MB${NC}"
echo ""

# Summary
echo -e "${YELLOW}Summary:${NC}"
echo -e "  • Rust artifacts cleaned"
echo -e "  • $TEMP_COUNT temporary files removed"
echo -e "  • $EMPTY_COUNT empty directories removed"
echo -e "  • $OLD_LOGS old log files removed"
echo ""
echo -e "${GREEN}✨ Cleanup completed successfully!${NC}"
