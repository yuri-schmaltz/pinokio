#!/bin/bash
# smoke.sh — Teste de fumaça para validação rápida do Pinokio
# Valida: Startup do servidor, health check, resposta HTTP, shutdown limpo

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TIMEOUT=15 # seconds
HEALTH_ENDPOINT="http://localhost:42424/health"
TEST_START=$(date +%s)

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       PINOKIO — SMOKE TEST             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Stage 1: Check prerequisites
echo -e "${YELLOW}[1/5]${NC} Verificando pré-requisitos..."

if ! command -v node &> /dev/null; then
  echo -e "${RED}❌ Node.js não encontrado${NC}"
  exit 1
fi

if ! command -v cargo &> /dev/null; then
  echo -e "${RED}❌ Cargo não encontrado${NC}"
  exit 1
fi

NODE_VERSION=$(node --version)
CARGO_VERSION=$(cargo --version | cut -d' ' -f2)
echo -e "   ✅ Node.js: ${NODE_VERSION}"
echo -e "   ✅ Cargo: ${CARGO_VERSION}"

# Stage 2: Start server in background
echo -e "\n${YELLOW}[2/5]${NC} Iniciando servidor Pinokio..."

# Kill any existing process on port 42424
if lsof -Pi :42424 -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo -e "   ⚠️  Porta 42424 ocupada, finalizando processo..."
  kill $(lsof -t -i:42424) 2>/dev/null || true
  sleep 1
fi

# Start server in background
cd "$(dirname "$0")/.."
npm run dev > /tmp/pinokio-smoke.log 2>&1 &
SERVER_PID=$!

echo -e "   ✅ Servidor iniciado (PID: ${SERVER_PID})"

# Cleanup function
cleanup() {
  if [ ! -z "$SERVER_PID" ] && kill -0 $SERVER_PID 2>/dev/null; then
    echo -e "\n${YELLOW}[5/5]${NC} Finalizando servidor..."
    kill $SERVER_PID 2>/dev/null || true
    wait $SERVER_PID 2>/dev/null || true
    echo -e "   ✅ Servidor finalizado"
  fi
}

trap cleanup EXIT

# Stage 3: Wait for health endpoint
echo -e "\n${YELLOW}[3/5]${NC} Aguardando health endpoint..."

ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT ]; do
  if curl -s -f "$HEALTH_ENDPOINT" > /dev/null 2>&1; then
    echo -e "   ✅ Health endpoint respondendo em ${ELAPSED}s"
    break
  fi
  
  # Check if process died
  if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo -e "${RED}❌ Servidor crashed durante startup${NC}"
    cat /tmp/pinokio-smoke.log | tail -n 20
    exit 1
  fi
  
  sleep 1
  ELAPSED=$((ELAPSED + 1))
done

if [ $ELAPSED -ge $TIMEOUT ]; then
  echo -e "${RED}❌ Timeout aguardando health endpoint (${TIMEOUT}s)${NC}"
  cat /tmp/pinokio-smoke.log | tail -n 20
  exit 1
fi

# Stage 4: Verify HTTP response
echo -e "\n${YELLOW}[4/5]${NC} Verificando resposta HTTP..."

RESPONSE=$(curl -s "$HEALTH_ENDPOINT")
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_ENDPOINT")

if [ "$HTTP_CODE" != "200" ]; then
  echo -e "${RED}❌ HTTP code inválido: ${HTTP_CODE} (esperado: 200)${NC}"
  exit 1
fi

echo -e "   ✅ HTTP 200 OK"
echo -e "   Response: ${RESPONSE}"

# Stage 5: Calculate test duration
TEST_END=$(date +%s)
DURATION=$((TEST_END - TEST_START))

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║       ✅ SMOKE TEST PASSED             ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo -e "${GREEN}Duration: ${DURATION}s${NC}"
echo ""

exit 0
