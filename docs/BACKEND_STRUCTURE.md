# Backend Structure

A pasta `backend/` contém todo o código e scripts relacionados ao backend da aplicação Pinokio.

## 📁 Estrutura

```
backend/
├── src/                  # Código fonte do projeto
│   └── electron/         # Código Electron (desktop frontend bridge)
│       ├── main.js       # Entry point da aplicação
│       ├── full.js       # Modo desktop completo
│       ├── minimal.js    # Modo minimalista (tray only)
│       ├── config.js     # Configurações gerais
│       ├── webprefs.js   # Web preferences
│       ├── permissions.js # Controle de permissões
│       ├── preload.js    # Preload script
│       └── updater.js    # Update manager
│
├── build/                # Scripts e configurações de build
│   ├── after-pack.js     # Hook pós-build
│   ├── chmod.js          # Script de permissões
│   ├── sign.js           # Script de assinatura
│   ├── installer.nsh     # Instalador NSIS (Windows)
│   ├── wrap-linux-launcher.js  # Wrapper para Linux
│   └── linux_build.sh    # Script de build Linux
│
├── scripts/              # Scripts utilitários
│   ├── heartbeat.js      # Monitoramento de saúde
│   ├── sync-vendor.js    # Sincronização de vendor
│   ├── zip.js            # Compactação de arquivos
│   └── patch.command     # Patches do sistema
│
├── lib/                  # Bibliotecas compartilhadas
│   ├── index.js          # Export principal
│   ├── browser-logging.js # Logging do browser
│   ├── health.js         # Health check
│   ├── inspector.js      # Inspector tool
│   ├── ipc-handlers.js   # IPC handlers
│   ├── logger.js         # Logger
│   ├── security.js       # Funções de segurança
│   ├── splash.js         # Splash screen
│   ├── tauri-bridge.js   # Bridge Tauri
│   └── utils.js          # Utilidades gerais
│
├── node/                 # Pinokio Node backend
│   └── pinokiod/
│       ├── server/
│       │   └── views/
│       │       └── index.ejs
│       └── ...
│
├── tauri/                # Backend Tauri (alternativa)
│   ├── src/
│   │   ├── main.rs
│   │   ├── tests.rs
│   │   └── commands/
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── icons/
│
└── vendor/               # Código de terceiros/vendor
    ├── README.md
    └── server/
        ├── public/
        └── views/
```

## 🔑 Arquivos Chave

### `backend/src/electron/main.js`
- **Descrição:** Entry point da aplicação
- **Responsabilidades:**
  - Inicializa a aplicação Electron
  - Carrega configuração
  - Roteia para `full.js` ou `minimal.js` baseado no modo
  - Gerencia ciclo de vida da aplicação

### `backend/build/after-pack.js`
- **Descrição:** Hook executado após o build
- **Responsabilidades:**
  - Pós-processamento do aplicativo empacotado
  - Mudanças de permissões
  - Execução de scripts específicos do SO

### `backend/scripts/sync-vendor.js`
- **Descrição:** Script de sincronização de vendor
- **Responsabilidades:**
  - Sincroniza arquivos vendor
  - Copia dependências necessárias

## 🚀 Referências

- Entry point no `package.json`: `"main": "backend/src/electron/main.js"`
- Build hook no `package.json`: `"afterPack": "backend/build/after-pack.js"`
- Postinstall no `package.json`: `"node backend/scripts/sync-vendor.js"`

## 📝 Notas

- A pasta `backend/` foi consolidada para separar claramente o código backend do código frontend (em `ui/`)
- O código Electron (`backend/src/electron/`) faz a ponte entre o backend e o frontend
- Todos os caminhos relativos nos arquivos foram atualizados para refletir essa nova estrutura
