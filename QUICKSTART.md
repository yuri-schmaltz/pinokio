# Quick Start - Pinokio

Como instalar e executar o Pinokio para desenvolvimento.

## 📋 Pré-requisitos

- **Node.js 20+** - [Baixar aqui](https://nodejs.org/)
- **npm** - Geralmente instalado com Node.js
- **Git** - [Opcional mas recomendado](https://git-scm.com/)

## 🚀 Começando

### 1️⃣ Clone o repositório

```bash
git clone https://github.com/pinokiocomputer/pinokio.git
cd pinokio
```

### 2️⃣ Inicie a aplicação

Escolha uma das opções abaixo:

#### ⭐ Opção A: npm (Recomendado)
```bash
npm start
```

#### Opção B: Node.js direto
```bash
node start.js
```

#### Opção C: Scripts da plataforma

**Windows:**
```bash
.\start.bat
```
Ou clique 2x em `start.bat`

**macOS/Linux:**
```bash
./start.sh
```
Ou execute com shell:
```bash
bash start.sh
```

### ✨ O que cada script faz:

Todos os 3 scripts (`start.bat`, `start.sh`, `start.js`) fazem o setup **automático e inteligente**:

1. ✅ Verifica Node.js, npm e Git
2. ✅ Valida estrutura do projeto
3. ✅ Instala dependências (se necessário)
4. ✅ Valida setup antes de iniciar
5. ✅ Inicia a aplicação Pinokio
6. ✅ Registra logs de setup

## 🎛️ Opções Avançadas

### Forçar Reinstalação de Dependências

```bash
# Via npm
npm start --force

# Via Node.js
node start.js --force

# Via Shell (macOS/Linux)
./start.sh --force
```

### Modo Silencioso

```bash
# Via Shell (macOS/Linux)
./start.sh --quiet
```

### Ajuda

```bash
# Via Node.js
node start.js --help

# Via Shell (macOS/Linux)
./start.sh --help
```

## 📚 Comandos Úteis

| Comando | O quê faz |
|---------|-----------|
| `npm start` | Inicia com setup automático (recomendado) |
| `npm run dev` | Alias para `npm start` |
| `npm run test:smoke` | Executa testes rápidos |
| `npm run test:e2e` | Testes end-to-end com Playwright |
| `npm run lint` | Verifica erros de código |
| `npm run dist` | Compila para distribuição |
| `npm run pack` | Cria pacote destribuível |

## 🗂️ Estrutura do Projeto

```
my-pinokio/
├── backend/               # Código backend (centralizado)
│   ├── src/electron/          # Código principal Electron
│   │   ├── main.js           # Entry point
│   │   ├── full.js           # Modo desktop completo
│   │   └── minimal.js        # Modo minimalista
│   ├── build/                # Scripts de build e empacotamento
│   ├── lib/                  # Bibliotecas compartilhadas
│   ├── scripts/              # Scripts utilitários
│   ├── tauri/                # Build Tauri (alternativa)
│   ├── vendor/               # Código do vendor
│   └── node/                 # Pinokio backend
├── ui/                   # Views HTML e assets consolidados
├── tests/                # Testes e configurações
├── docs/                 # Documentação
└── package.json          # Dependências e scripts
```

## 🔧 Variáveis de Ambiente

```bash
# Modo de teste (usa mock do pinokiod)
export PINOKIO_TEST_MODE=1

# Ativar logging do browser
export PINOKIO_BROWSER_LOG=1

# Modo hardened renderer (segurança aumentada)
export PINOKIO_HARDEN_RENDERER=1

# Linux: Especificar display Wayland ou X11
export ELECTRON_OZONE_PLATFORM_HINT=wayland
```

## 📊 Logs de Setup

Os scripts criam um arquivo `setup.log` na raiz com informações detalhadas:

```bash
# Ver logs de setup
cat setup.log              # macOS/Linux
type setup.log             # Windows
```

## ❓ Solução de Problemas

### "Node.js não encontrado"
- **Solução:** Instale Node.js v20+ em https://nodejs.org/
- Após instalar, reinicie seu terminal/cmd

### "npm: comando não encontrado"
- **Solução:** npm vem com Node.js. Reinstale ou adicione ao PATH
- Windows: Execute como Administrador

### Build falha no Windows
- **Solução:** Use `start.bat` ou execute `npm install` manualmente
- Se persistir: `npm cache clean --force`

### Porta já em uso
- **Solução:** Feche outros Pinokio ou mude a porta em `backend/src/electron/config.js`

### Dependências não instaladas
- **Solução:** Execute manualmente:
  ```bash
  npm install --no-audit --timeout 120000
  ```

## 📈 Recursos Adicionais

### Documentação
- [Estratégia de Testes](./docs/Testes%20e%20Qualidade.md)
- [Política de Scripts](./README.md)
- [Segurança](./SECURITY.md)
- [Release Notes](./RELEASE.md)

### Desenvolvimento
- ESLint para linting: `npm run lint`
- Testes com Mocha e Playwright
- Build com Electron Builder e Tauri

## 🤝 Contribuindo

1. Faça um fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/minha-feature`)
3. Commit suas mudanças (`git commit -m 'Add nova feature'`)
4. Execute testes: `npm run test:smoke && npm run lint`
5. Push para a branch (`git push origin feature/minha-feature`)
6. Abra um Pull Request

## 📝 Licença

MIT - Veja [LICENSE](./LICENSE) para detalhes

---

**Precisa de ajuda?**
- 🐛 Reporte bugs em [GitHub Issues](https://github.com/pinokiocomputer/pinokio/issues)
- 💬 Converse conosco em [X/Twitter](https://twitter.com/cocktailpeanut)
- 📖 Leia mais em [pinokio.co](https://pinokio.co)
