# 🐛 Bug: Erro ao Renomear Aplicação Durante Instalação

## Problema

Quando você tenta instalar um app no Pinokio e **dá um nome diferente** (ex: "Song Generation Studio" em vez do nome padrão), o sistema pode:

1. **Falhar silenciosamente** (não mostra erro claro)
2. **Rejeitar nomes com espaços** (mostra "Folder already exists" mesmo que não exista)
3. **Não sanitizar caracteres especiais** corretamente

### Exemplo do erro:

```
Usuário tenta: "Song Generation Studio"
Sistema valida: FAIL (espaços não são convertidos para hífens)
Resultado: Diálogo "Save as" fica travado ou mostra erro genérico
```

---

## Causa Raiz

**Arquivo:** `backend/node_modules/pinokiod/server/public/install.js`

**Linha 38-45:** A função `preConfirm` não sanitiza nomes com espaços antes de validar:

```javascript
preConfirm: async () => {
  const folderName = (Swal.getPopup().querySelector("#swal-input1").value || "").trim()
  const validationError = validateInstallFolderName(folderName) // ❌ Valida com espaços
  if (validationError) {
    Swal.showValidationMessage(validationError)
    return false
  }
  // ...
}
```

**Linha 88:** `validateInstallFolderName` rejeita nomes com `/` ou `\`, mas **não trata espaços**:

```javascript
if (/[\\/]/.test(folderName)) {
  return "Name cannot include / or \\\\"
}
// ❌ Não remove/substitui espaços
```

---

## Solução

### Opção 1: Usar nomes sem espaços (Workaround)

```
✅ song-generation-studio
✅ song_generation_studio
✅ song.generation.studio
✅ songGenerationStudio
❌ Song Generation Studio (com espaços)
```

### Opção 2: Aplicar o Patch (Solução Definitiva)

1. **Abra o arquivo:**
   ```bash
   nano /home/yurix/Documentos/my-pinokio/backend/node_modules/pinokiod/server/public/install.js
   ```

2. **Substitua a função `installname`** (linhas 1-56) pelo código em:
   ```
   /home/yurix/Documentos/my-pinokio/docs/PATCH_INSTALL_NAME.js
   ```

3. **Reinicie o Pinokio:**
   ```bash
   cd /home/yurix/Documentos/my-pinokio
   npm run dev
   ```

---

## O que o Patch Faz

### Antes (Bugado):
```
Input: "Song Generation Studio"
Validação: FAIL (não sanitiza)
Resultado: Erro
```

### Depois (Com Patch):
```
Input: "Song Generation Studio"
Sanitização automática:
  1. Remove caracteres inválidos
  2. Substitui espaços por hífens
  3. Converte para minúsculas
  4. Remove hífens duplicados

Resultado: "song-generation-studio" ✅
Mensagem: "Will be saved as: song-generation-studio"
```

### Recursos do Patch:

✅ **Preview em tempo real:** Mostra como o nome será salvo  
✅ **Sanitização automática:** Espaços → hífens, remove caracteres especiais  
✅ **Validação inteligente:** Permite "Song Generation Studio" e salva como "song-generation-studio"  
✅ **Mensagens claras:** "Folder 'x' already exists" em vez de mensagem genérica  
✅ **Mantém compatibilidade:** Não quebra instalações existentes  

---

## Teste

### Antes do Patch:
```bash
1. Abra Pinokio
2. Instale um app (ex: https://github.com/cocktailpeanut/comfyui.git)
3. Digite: "My ComfyUI Studio"
4. Clique Download
5. ❌ ERRO: "something went wrong" ou travamento
```

### Depois do Patch:
```bash
1. Abra Pinokio
2. Instale um app (ex: https://github.com/cocktailpeanut/comfyui.git)
3. Digite: "My ComfyUI Studio"
4. Veja: "Will be saved as: my-comfyui-studio"
5. Clique Download
6. ✅ SUCESSO: App instalado em ~/pinokio/api/my-comfyui-studio
```

---

## Arquivos Relacionados

- **Código bugado:** `backend/node_modules/pinokiod/server/public/install.js` (linhas 1-56)
- **Patch:** `docs/PATCH_INSTALL_NAME.js`
- **UI Dialog:** `backend/pinokio_vendor/server/views/download.ejs` (linha 274)
- **Validação:** `backend/node_modules/pinokiod/server/public/install.js` (linhas 84-95)

---

## Alternativas

### 1. Modificar diretamente no node_modules (Temporário)
```bash
nano backend/node_modules/pinokiod/server/public/install.js
# Copiar código do PATCH_INSTALL_NAME.js
# ⚠️ Será perdido ao rodar npm install
```

### 2. Criar override no pinokio_vendor (Permanente)
```bash
cp backend/node_modules/pinokiod/server/public/install.js \
   backend/pinokio_vendor/server/public/install.js
# Editar arquivo no pinokio_vendor
# Modificar download.ejs para usar versão do pinokio_vendor
```

### 3. Fork do pinokiod e publicar no npm (Definitivo)
```bash
git clone https://github.com/cocktailpeanut/pinokiod
cd pinokiod
# Aplicar patch
# Publicar como @yurix/pinokiod
# Modificar package.json para usar @yurix/pinokiod
```

---

## Status

| Item | Status |
|------|--------|
| Bug identificado | ✅ |
| Patch criado | ✅ |
| Testes manuais | ⏳ Pendente |
| PR upstream | ❌ Não enviado |
| Documentação | ✅ Este arquivo |

---

## Próximos Passos

1. **Aplicar o patch** e testar instalação com nomes variados
2. **Enviar PR** para o repositório oficial: https://github.com/cocktailpeanut/pinokiod
3. **Adicionar testes** para validação de nomes
4. **Melhorar UX** do diálogo "Save as" (sugestões de nomes, autocompletar)

---

**Data:** 11 de janeiro de 2026  
**Reportado por:** @yurix  
**Severidade:** MÉDIA (workaround existe, mas UX ruim)  
**Impacto:** Usuários não conseguem usar nomes personalizados com espaços
