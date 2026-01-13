#!/bin/bash
# check-no-generated-files.sh
# Verifica que arquivos gerados não estão versionados

set -e

echo "🔍 Verificando arquivos gerados não versionados..."

# Patterns de arquivos gerados que NÃO devem estar no git
PATTERNS=(
    "*.log"
    ".DS_Store"
    "Thumbs.db"
    "*.tmp"
    "*.bak"
    "*~"
    "*.swp"
    "coverage/"
    ".nyc_output/"
    "node_modules/"
    "dist/"
    "build/"
)

FOUND=0

for pattern in "${PATTERNS[@]}"; do
    # Verifica se há arquivos tracked que correspondem ao pattern
    matches=$(git ls-files "$pattern" 2>/dev/null || true)
    if [ -n "$matches" ]; then
        echo "❌ Arquivos gerados encontrados no git: $pattern"
        echo "$matches"
        FOUND=1
    fi
done

if [ $FOUND -eq 0 ]; then
    echo "✅ Nenhum arquivo gerado encontrado no git"
    exit 0
else
    echo ""
    echo "❌ FALHA: Arquivos gerados estão versionados. Adicione ao .gitignore e remova com:"
    echo "   git rm --cached <arquivo>"
    exit 1
fi
