# 📚 Guia de Implementação — Templates Pinokio Professional

Este diretório contém **templates profissionais** para criar apps Pinokio com UI moderna, scripts robustos e design system coerente.

## 🎯 O que você tem aqui

### **Templates JSON (Scripts)**
Copie para `PINOKIO_HOME/api/seu-app/`:

| Arquivo | Propósito | O que faz |
|---------|-----------|----------|
| `pinokio.js.template` | Launcher config | Define interface no Pinokio (tabs, menu, ações) |
| `install.json.template` | Setup inicial | Cria venv, pip install, baixa modelos |
| `start.json.template` | Inicia app | Detecta GPU, sobe daemon, logging |
| `stop.json.template` | Para app | Kill process seguro |
| `update.json.template` | Atualização | Git pull + pip upgrade (preserva dados) |
| `reset.json.template` | Reset factory | Limpa venv/cache (preserva source/output) |
| `diagnostics.json.template` | Diagnósticos | CPU/MEM/GPU/VRAM/disk/Python |
| `check_python.json.template` | Valida Python | Verifica versão e pacotes críticos |
| `check_gpu.json.template` | Valida GPU | Detecta CUDA/ROCm/PyTorch |

### **Assets UI**
Copie para `PINOKIO_HOME/api/seu-app/assets/`:

| Arquivo | Propósito |
|---------|-----------|
| `/ui/assets/design-system.css` | **749 linhas de CSS profissional** com tokens, componentes e dark mode |
| `/ui/assets/ai-sidebar.css` | Sidebar acessível (melhorado com focus-visible) |
| `/ui/assets/skeleton.css` | Loading skeletons |

### **HTML Template**
Copie para `PINOKIO_HOME/api/seu-app/`:

| Arquivo | Propósito |
|---------|-----------|
| `app.html.template` | **Página exemplo com 7 tabs**, dashboard, tabelas, forms, dark mode |

---

## 🚀 QUICK START (5 minutos)

### **1. Preparar estrutura**
```bash
PINOKIO_HOME="$HOME/.pinokio"  # ou seu path
mkdir -p "$PINOKIO_HOME/api/meu-app"
cd "$PINOKIO_HOME/api/meu-app"
```

### **2. Copiar templates**
```bash
# Clone ou copie do repo original
cp /path/to/pinokio/docs/*.template .
cp /path/to/pinokio/ui/assets/design-system.css assets/
cp /path/to/pinokio/ui/assets/ai-sidebar.css assets/

# Renomear extensões
mv pinokio.js.template pinokio.js
mv install.json.template install.json
mv start.json.template start.json
mv stop.json.template stop.json
mv update.json.template update.json
mv reset.json.template reset.json
mv diagnostics.json.template diagnostics.json
mv check_python.json.template check_python.json
mv check_gpu.json.template check_gpu.json
mv app.html.template app.html
```

### **3. Customizar pinokio.js**
Edite o campo `"title"` e `"description"`:
```json
{
  "title": "Meu App Incrível",
  "description": "Faz algo muito legal com IA",
  "author": "Seu Nome",
  "homepage": "https://github.com/seu-nome/seu-app"
}
```

### **4. Customizar scripts JSON**
- Edite `install.json`: mudar `requirements.txt`, adicionar lógica
- Edite `start.json`: substituir `app.py` pelo seu script principal
- Edite `diagnostics.json`: adicionar checks específicos

### **5. Customizar app.html**
- Substitua os textos/ícones pelos seus
- Customize os tabs para seu workflow
- Conecte os botões à sua lógica (fetch, WebSocket, etc.)

### **6. Testar**
```bash
# Abrir Pinokio (desktop app)
# Settings → Add Folder → apontar para ~/.pinokio/api/meu-app
# Clicar em "Install"
```

---

## 📋 CHECKLIST DE CUSTOMIZAÇÃO

- [ ] **pinokio.js**
  - [ ] Mudar `title`, `description`
  - [ ] Adicionar seu `icon` (URL ou caminho)
  - [ ] Atualizar `homepage` (GitHub/docs)
  - [ ] Revisar pré-requisitos (`pre` array)
  - [ ] Adicionar env vars customizadas (ex.: `API_KEY`)

- [ ] **install.json**
  - [ ] Cria diretórios corretos (`MODEL_PATH`, `OUTPUT_PATH`)
  - [ ] Instala suas dependências (pip install seu-pacote)
  - [ ] Baixa modelos se necessário
  - [ ] Valida integridade (checksums)

- [ ] **start.json**
  - [ ] Aponta para seu script principal (ex.: `python app.py`)
  - [ ] Define porta correta (default: 5000)
  - [ ] Detecta GPU (mantém como está ou customize)
  - [ ] Registra URL em `$local.url` (para "Open UI")

- [ ] **app.html**
  - [ ] Substituir "My App" pelo seu nome
  - [ ] Adaptar tabs para seu workflow
  - [ ] Implementar fetch/API calls
  - [ ] Estilizar para sua marca (cores, logos)

- [ ] **Assets CSS**
  - [ ] Revisar `design-system.css` (não mude, reutilize)
  - [ ] Sobrescrever cores se necessário (CSS variables em `:root`)

---

## 🎨 CUSTOMIZANDO CORES (Design System)

No seu `app.html` ou CSS novo, sobrescreva variáveis:

```css
:root {
  --color-primary: #9333ea;  /* sua cor primária */
  --color-success: #06b6d4;
  --color-error: #f43f5e;
}
```

Todos os componentes usarão suas cores automaticamente.

---

## 🔌 CONECTANDO À SUA API

### **Exemplo: POST request ao iniciar**
```javascript
// No seu app.html
async function startProcessing() {
  try {
    const response = await fetch('/api/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        input_path: document.getElementById('input-file').value,
        batch_size: 50
      })
    });
    const data = await response.json();
    showToast('✅ Processing started!', 'success');
  } catch (error) {
    showToast('❌ ' + error.message, 'error');
  }
}
```

### **Exemplo: WebSocket para streaming**
```javascript
// Conectar a um WebSocket do seu backend
const ws = new WebSocket('ws://localhost:5000/stream');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  updateProgress(data.percent);  // atualizar barra
};
```

---

## 📊 ESTRUTURA TÍPICA DE UM APP

```
~/.pinokio/api/meu-app/
├── pinokio.js                 [Config do launcher]
├── install.json               [Instala deps]
├── start.json                 [Inicia servidor]
├── stop.json                  [Para servidor]
├── update.json                [Atualiza]
├── reset.json                 [Reset factory]
├── diagnostics.json           [Diagnósticos]
├── check_python.json          [Valida Python]
├── check_gpu.json             [Valida GPU]
├── app.html                   [UI web]
├── app.py                     [Seu backend Flask/FastAPI/etc]
├── requirements.txt           [Python deps]
├── assets/
│   ├── design-system.css      [Design tokens + componentes]
│   ├── ai-sidebar.css         [Sidebar customizado]
│   ├── logo.png               [Seu logo]
│   └── style.css              [CSS customizado]
├── models/                    [Modelos baixados (será criado)]
├── output/                    [Output do app (será criado)]
└── src/                       [Seu código]
    ├── __init__.py
    ├── core.py                [Lógica principal]
    ├── models.py              [Data models]
    └── utils.py               [Utilidades]
```

---

## 🧪 TESTANDO LOCALMENTE (Antes de enviar ao Pinokio)

### **Testar scripts JSON**
```bash
# Simular install.json (sem realmente instalar)
cat install.json | jq .  # valida JSON

# Testar start (daemon)
bash <(jq -r '.run[] | select(.command) | .command' start.json)
```

### **Testar app.html**
```bash
# Abrir em navegador local
python3 -m http.server 5000  # servidor simples
# Visitar http://localhost:5000/app.html
```

### **Testar com Tauri Bridge**
Se seu app usa Tauri (detecção de GPU, comandos), teste:
```javascript
// No console do navegador
window.tauriBridge.getSystemResources()
  .then(res => console.log(res))
  .catch(err => console.error(err))
```

---

## 🔍 DEBUGGING

### **Logs do Pinokio**
```bash
# Linux/Mac
tail -f ~/.pinokio/logs/app.log
tail -f ~/.pinokio/logs/latest.log

# Windows
Get-Content "$env:USERPROFILE\.pinokio\logs\app.log" -Tail 20 -Wait
```

### **Console do navegador**
Ao abrir seu app.html no Pinokio, pressione **F12** para DevTools (Ctrl+Shift+I no Linux).

### **Validar JSON**
```bash
python3 -m json.tool install.json   # deve retornar sem erros
```

---

## 📦 COMPONENTES DISPONÍVEIS (Design System)

Use no seu HTML. Exemplos:

### **Buttons**
```html
<button class="btn btn-primary">Action</button>
<button class="btn btn-secondary">Secondary</button>
<button class="btn btn-success">Success</button>
<button class="btn btn-danger">Delete</button>
<button class="btn btn-sm">Small</button>
<button class="btn btn-lg">Large</button>
```

### **Forms**
```html
<input type="text" class="input" placeholder="Name">
<select class="input">
  <option>Option 1</option>
  <option>Option 2</option>
</select>
```

### **Cards**
```html
<div class="card">
  <div class="card-header">Title</div>
  <div class="card-body">Content</div>
  <div class="card-footer">Footer</div>
</div>
```

### **Tabs**
```html
<div class="tabs">
  <button class="tab-button active">Tab 1</button>
  <button class="tab-button">Tab 2</button>
</div>
<div class="tab-content active">Content 1</div>
<div class="tab-content">Content 2</div>
```

### **Tables**
```html
<table class="table">
  <thead>
    <tr><th>Column</th></tr>
  </thead>
  <tbody>
    <tr><td>Data</td></tr>
  </tbody>
</table>
```

### **Badges & Status**
```html
<span class="badge badge-success">Active</span>
<span class="badge badge-error">Failed</span>
```

### **Progress**
```html
<div class="progress">
  <div class="progress-bar" style="width: 75%;"></div>
</div>
```

### **Notifications**
```javascript
showToast('Message', 'success');   // ou 'error', 'info'
```

---

## ⚡ PERFORMANCE TIPS

1. **Lazy-load imagens**
   ```html
   <img src="..." loading="lazy">
   ```

2. **Minificar CSS**
   ```bash
   npx cssnano design-system.css -o design-system.min.css
   ```

3. **Usar skeleton loading**
   ```html
   <div class="skeleton skeleton-text"></div>
   ```

4. **Evitar re-renders**
   - Use `requestAnimationFrame` para animações
   - Debounce inputs (300ms)

---

## 🔒 SEGURANÇA

- ✅ **CSP** incluído em todas as páginas
- ✅ **Sanitize** inputs (use textContent, não innerHTML)
- ✅ **CORS** permitir only localhost:5000
- ✅ **No eval()** — nunca!

---

## 📚 REFERÊNCIAS

- [Design System](../ui/assets/design-system.css) — 50+ CSS variables
- [Auditoria Completa](./AUDITORIA_COMPLETA.md) — Detalhes técnicos
- [App HTML Exemplo](./app.html.template) — Todos os componentes
- [Pinokio Docs](https://pinokio.computer) — Schema oficial

---

## ❓ FAQ

**P: Posso mudar as cores do design system?**  
R: Sim! Mude `:root` variables em seu CSS. Todos os componentes herdarão.

**P: Como adicionar mais env vars?**  
R: Edite `pinokio.js` → seção `"pre"` → array `"prompt"`.

**P: E se meu app precisar de GPU especial?**  
R: Customize `check_gpu.json` para detectar sua plataforma (NVIDIA/AMD/Intel).

**P: Posso usar React/Vue no app.html?**  
R: Sim! Mas implemente você mesmo o bundle. Recomendo vanilla JS para simplicidade.

**P: Como persistir dados?**  
R: Use `localStorage` para pequenos dados ou API backend para grandes.

---

## 🚀 Próximos Passos

1. ✅ Copiar templates
2. ✅ Customizar para seu app
3. ✅ Testar localmente (JSON + HTML)
4. ✅ Abrir no Pinokio (clique "Install")
5. ✅ Validar logs e UI
6. ✅ Compartilhar seu app! 🎉

---

**Versão:** 1.0.0  
**Última atualização:** 11 de janeiro de 2026  
**Suporte:** [GitHub Issues](https://github.com/cocktailpeanutlabs/pinokio)
