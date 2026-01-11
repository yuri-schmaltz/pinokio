# Quick Start - Pinokio (Tauri Edition)

Como instalar e executar o Pinokio usando o framework **Tauri**.

## 📋 Pré-requisitos

- **Node.js 20+** - [Baixar aqui](https://nodejs.org/)
- **Rust** - [Instalar via rustup](https://rustup.rs/)
- **npm** - Geralmente instalado com Node.js
- **Dependências de Sistema (Linux)**: Veja o [guia do Tauri](https://tauri.app/v1/guides/getting-started/prerequisites) para bibliotecas necessárias como `libwebkit2gtk-4.0-dev`.

## 🚀 Começando

### 1️⃣ Instale as dependências Node.js
```bash
npm install
```

### 2️⃣ Inicie a aplicação em modo de desenvolvimento
```bash
npm run dev
```
Este comando executará automaticamente o backend Tauri em Rust e abrirá a interface.

### 3️⃣ Build para produção
```bash
npm run build
```
Os binários gerados estarão em `backend/tauri/target/release/bundle/`.

## 🎛️ Comandos Úteis

| Comando | O quê faz |
|---------|-----------|
| `npm run dev` | Inicia o Tauri em modo hot-reload |
| `npm run build` | Compila o executável final |
| `npm run lint` | Verifica erros de código |
| `npm run test:e2e` | Testes end-to-end com Playwright |

## 🗂️ Estrutura do Projeto Simples

```
my-pinokio/
├── backend/               # Lógica de Backend
│   ├── tauri/                # Configuração e código Rust Tauri
│   ├── node/                 # Motor pinokiod
│   ├── scripts/              # Scripts utilitários
│   └── vendor/               # Código vendored customizado
├── ui/                   # Views HTML e assets
└── package.json          # Manifesto raiz
```

---

**Precisa de ajuda?**
- 🐛 Reporte bugs em [GitHub Issues](https://github.com/pinokiocomputer/pinokio/issues)
- 📖 Leia mais em [tauri.app](https://tauri.app)
