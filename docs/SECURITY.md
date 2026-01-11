# Segurança do Pinokio (Desktop)

## Permissões do Electron
- Permissões permitidas por padrão: `display-capture` e `desktopCapture` (compartilhamento de tela).
- Todas as demais permissões (câmera, microfone, etc.) são negadas.
- Erros de certificado TLS bloqueiam o carregamento de páginas.
- Logs de decisões aparecem como `[PERMISSION]` no console principal; erros de certificado como `[CERT-ERROR]`.

### Ajustando permissões
Edite `ALLOWED_PERMISSIONS` em `full.js` para incluir novas permissões quando necessário. Mantenha o conjunto mínimo para reduzir superfície de ataque.

## Isolamento do renderer
- Para ligar o modo endurecido (contextIsolation + webSecurity + sem Node em subframes), inicie com:
  - `PINOKIO_HARDEN_RENDERER=1 npm run start`
- Por padrão ele permanece desligado para evitar regressões; ao habilitar, use a ponte exposta no preload (`window.electronAPI`, `window.prompt`) em vez de acessar APIs Node diretamente.

## Verificações rápidas
1. Compartilhamento de tela deve ser permitido; câmera/microfone devem ser negados.
2. Uma página com certificado inválido deve ser bloqueada e logar `[CERT-ERROR]`.
3. Em modo endurecido, `typeof process` no renderer deve ser `undefined`.
