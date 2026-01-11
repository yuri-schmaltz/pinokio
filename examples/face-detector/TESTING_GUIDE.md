╔════════════════════════════════════════════════════════════════════════════════╗
║                         FASE 2: VALIDAÇÃO COM APP REAL                         ║
║                                                                                  ║
║                     Face Detector - Testing & Validation Guide                 ║
║                                                                                  ║
║                   Data: 11 de janeiro de 2026 | Status: PRONTO                ║
╚════════════════════════════════════════════════════════════════════════════════╝

📍 LOCALIZAÇÃO DO APP
────────────────────────────────────────────────────────────────────────────────
  /home/yurix/Documentos/my-pinokio/examples/face-detector/

📦 ARQUIVOS ENTREGUES
────────────────────────────────────────────────────────────────────────────────
  ✅ pinokio.js ................. Configuração launcher (Schema 2.0)
  ✅ install.json ............... Instalação (6 passos, idempotente)
  ✅ start.json ................. Iniciar servidor daemon
  ✅ stop.json .................. Parar servidor
  ✅ update.json ................ Atualizar dependências
  ✅ reset.json ................. Reset à fábrica
  ✅ diagnostics.json ........... Diagnósticos sistema
  ✅ check_gpu.json ............. Detecção GPU
  ✅ app.py ..................... Servidor Flask (414 linhas)
  ✅ templates/index.html ....... Dashboard web (380+ linhas)
  ✅ README.md .................. Documentação

═══════════════════════════════════════════════════════════════════════════════════

🧪 PLANO DE TESTES (5 FASES)
════════════════════════════════════════════════════════════════════════════════

┌─ FASE 1: VERIFICAÇÃO PRÉ-REQUISITOS ──────────────────────────────────────────┐
│                                                                                   │
│  OBJETIVO: Validar ambiente antes de instalar                                  │
│                                                                                   │
│  ✓ T1.1 - Python Version Check                                                │
│     └─ Comando: python3 --version                                             │
│        Esperado: Python 3.8 or higher                                         │
│        Resultado: ____________                                                 │
│                                                                                   │
│  ✓ T1.2 - Disk Space                                                          │
│     └─ Comando: df -h /home/yurix/Documentos                                 │
│        Esperado: >= 2GB available                                             │
│        Resultado: ____________                                                 │
│                                                                                   │
│  ✓ T1.3 - pip availability                                                    │
│     └─ Comando: python3 -m pip --version                                      │
│        Esperado: pip 20.0+                                                    │
│        Resultado: ____________                                                 │
│                                                                                   │
│  STATUS: [ ] PASS  [ ] FAIL                                                   │
│                                                                                   │
└───────────────────────────────────────────────────────────────────────────────────┘

┌─ FASE 2: INSTALAÇÃO & VALIDAÇÃO DE DEPENDÊNCIAS ──────────────────────────────┐
│                                                                                   │
│  OBJETIVO: Executar install.json e validar setup completo                     │
│                                                                                   │
│  ✓ T2.1 - Run install.json                                                    │
│     └─ Arquivo: /examples/face-detector/install.json                         │
│        Passos:                                                                 │
│          1/6 Criar .venv                                                     │
│          2/6 Ativar .venv                                                    │
│          3/6 Atualizar pip/setuptools                                        │
│          4/6 Instalar mediapipe, opencv, flask                               │
│          5/6 Baixar sample.jpg                                               │
│          6/6 Completado ✅                                                    │
│                                                                                   │
│        Tempo esperado: 3-5 minutos (primeiro run)                            │
│        Resultado: ____________                                                 │
│                                                                                   │
│  ✓ T2.2 - Verify Packages Installed                                           │
│     └─ Comando: cd examples/face-detector && .venv/bin/pip list | grep -E 'mediapipe|flask|opencv'
│        Esperado:                                                              │
│          mediapipe >= 0.8.11                                                 │
│          opencv-python >= 4.5.0                                              │
│          flask >= 2.0.0                                                      │
│                                                                                   │
│        Resultado:                                                              │
│          mediapipe: ____________                                              │
│          opencv-python: ____________                                          │
│          flask: ____________                                                  │
│                                                                                   │
│  ✓ T2.3 - Verify Virtual Environment                                          │
│     └─ Arquivo: .venv/bin/python3                                             │
│        Comando: ls -la examples/face-detector/.venv/bin/python3              │
│        Esperado: Arquivo executável existe                                    │
│        Resultado: ____________                                                 │
│                                                                                   │
│  STATUS: [ ] PASS  [ ] FAIL                                                   │
│                                                                                   │
└───────────────────────────────────────────────────────────────────────────────────┘

┌─ FASE 3: INICIAR SERVIDOR & VALIDAR DISPONIBILIDADE ──────────────────────────┐
│                                                                                   │
│  OBJETIVO: start.json inicia servidor e serve o dashboard                     │
│                                                                                   │
│  ✓ T3.1 - Run start.json                                                      │
│     └─ Arquivo: /examples/face-detector/start.json                           │
│        Esperado:                                                              │
│          ✅ Server running at http://localhost:5000                          │
│          ✅ Processo daemon ativo                                            │
│                                                                                   │
│        Resultado: ____________                                                 │
│                                                                                   │
│  ✓ T3.2 - Check Server Port                                                   │
│     └─ Comando: lsof -i :5000                                                │
│        Esperado: python3 listening on 5000                                    │
│        Resultado: ____________                                                 │
│                                                                                   │
│  ✓ T3.3 - Health Check                                                        │
│     └─ Comando: curl -s http://localhost:5000/api/health                     │
│        Esperado:                                                              │
│          {                                                                     │
│            "status": "running",                                               │
│            "app": "Face Detector",                                            │
│            "version": "1.0.0"                                                 │
│          }                                                                     │
│                                                                                   │
│        Resultado: ____________                                                 │
│                                                                                   │
│  STATUS: [ ] PASS  [ ] FAIL                                                   │
│                                                                                   │
└───────────────────────────────────────────────────────────────────────────────────┘

┌─ FASE 4: VALIDAR UI & FUNCIONALIDADES ────────────────────────────────────────┐
│                                                                                   │
│  OBJETIVO: Testar dashboard e endpoints API                                   │
│                                                                                   │
│  ✓ T4.1 - Load Dashboard                                                      │
│     └─ URL: http://localhost:5000/                                            │
│        Esperado:                                                              │
│          ✓ Página carrega sem erros                                          │
│          ✓ CSS carregado (não quebrado)                                      │
│          ✓ 5 abas visíveis (Overview/Upload/Results/Export/Settings)        │
│          ✓ Aba "Overview" mostra 4 cards com stats                          │
│                                                                                   │
│        Resultado:                                                              │
│          [ ] Página carrega                                                   │
│          [ ] CSS OK                                                            │
│          [ ] 5 abas                                                            │
│          [ ] 4 cards                                                           │
│                                                                                   │
│  ✓ T4.2 - Upload Image & Detect Faces                                         │
│     └─ Passos:                                                                │
│          1. Ir para aba "Upload Image"                                       │
│          2. Fazer upload de imagem com faces                                 │
│             (Sugestão: ~/input/sample.jpg ou própria foto)                  │
│          3. Clicar em "🚀 Detect Faces"                                      │
│          4. Aguardar processamento (~2-5s)                                   │
│                                                                                   │
│        Esperado:                                                              │
│          ✓ Mensagem: "✅ Detection complete! Found X face(s)"               │
│          ✓ Arquivo .jpg salvo em output/                                    │
│          ✓ Card "Total Detections" incrementa                               │
│          ✓ Card "Faces Found" mostra número correto                        │
│                                                                                   │
│        Resultado:                                                              │
│          Faces detectados: ____________                                       │
│          Output arquivo: ____________                                         │
│                                                                                   │
│  ✓ T4.3 - View Results                                                        │
│     └─ Passos:                                                                │
│          1. Ir para aba "Results"                                             │
│          2. Tabela mostra: Imagem | Faces | Hora | View                     │
│          3. Clicar em "View" abre imagem anotada                            │
│                                                                                   │
│        Esperado:                                                              │
│          ✓ Tabela com dados da detecção                                      │
│          ✓ Link "View" funciona                                              │
│          ✓ Imagem com bounding boxes visível                                │
│                                                                                   │
│        Resultado:                                                              │
│          [ ] Tabela OK                                                        │
│          [ ] Link OK                                                          │
│          [ ] Imagem anotada visível                                          │
│                                                                                   │
│  ✓ T4.4 - Export Results                                                      │
│     └─ Passos:                                                                │
│          1. Ir para aba "Export"                                              │
│          2. Clicar em "📥 Export as JSON"                                    │
│          3. Arquivo salvo em output/export_*.json                           │
│                                                                                   │
│        Esperado:                                                              │
│          ✓ Mensagem sucesso com nome do arquivo                             │
│          ✓ JSON válido com resultados                                       │
│          ✓ Contém: timestamp, results, face count                          │
│                                                                                   │
│        Resultado:                                                              │
│          Arquivo: ____________                                                │
│          [ ] JSON válido                                                      │
│                                                                                   │
│  ✓ T4.5 - Test Settings Tab                                                   │
│     └─ Aba "Settings" mostra:                                                 │
│          🔹 Model: MediaPipe Face Detection                                  │
│          🔹 Confidence Threshold: 50%                                        │
│          🔹 GPU Support: Optional (CPU by default)                           │
│                                                                                   │
│        Resultado: [ ] Configurações visíveis                                  │
│                                                                                   │
│  STATUS: [ ] PASS  [ ] FAIL                                                   │
│                                                                                   │
└───────────────────────────────────────────────────────────────────────────────────┘

┌─ FASE 5: STOP & RESET ────────────────────────────────────────────────────────┐
│                                                                                   │
│  OBJETIVO: Validar stop.json e reset.json                                     │
│                                                                                   │
│  ✓ T5.1 - Run stop.json                                                       │
│     └─ Arquivo: /examples/face-detector/stop.json                           │
│        Esperado: Processo mata-se cleanly                                     │
│        Comando: lsof -i :5000                                                │
│        Resultado: [ ] Nenhum processo em 5000                                 │
│                                                                                   │
│  ✓ T5.2 - Run reset.json                                                      │
│     └─ Arquivo: /examples/face-detector/reset.json                          │
│        Esperado:                                                              │
│          ✓ .venv removido                                                    │
│          ✓ Cache limpo                                                       │
│          ✓ Output files backed up                                            │
│                                                                                   │
│        Verificar:                                                              │
│          [ ] ls -la examples/face-detector/.venv => "No such file"          │
│          [ ] Backup .tar.gz criado                                           │
│                                                                                   │
│  ✓ T5.3 - Reinstall Validation                                                │
│     └─ Rodar install.json novamente para validar idempotência               │
│        Esperado: Install completa sem erro (2ª vez)                          │
│        Tempo: < 30 segundos (pip cache)                                     │
│        Resultado: [ ] PASS                                                    │
│                                                                                   │
│  STATUS: [ ] PASS  [ ] FAIL                                                   │
│                                                                                   │
└───────────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════════

📊 MÉTRICAS DE ACEITE (SEÇÃO 7 DO DIRECTIVE)
════════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────┬──────────────┬───────────────────────────┐
│ Critério                        │ Esperado     │ Resultado                 │
├─────────────────────────────────┼──────────────┼───────────────────────────┤
│ 1. Instalação Sem Erros         │ ✓ Sim        │ [ ] Sim  [ ] Não         │
│    └─ install.json executa até  │              │                           │
│       step 6/6 com sucesso      │              │                           │
│                                 │              │                           │
│ 2. Execução Sem Crashes         │ ✓ Sim        │ [ ] Sim  [ ] Não         │
│    └─ start.json inicia daemon  │              │                           │
│       que rodapor >= 2 minutos  │              │                           │
│                                 │              │                           │
│ 3. Output Correto               │ ✓ Sim        │ [ ] Sim  [ ] Não         │
│    └─ Detecções salvas em       │              │                           │
│       output/*.jpg + export JSON │              │                           │
│                                 │              │                           │
│ 4. UI Launcher Funcional        │ ✓ Sim        │ [ ] Sim  [ ] Não         │
│    └─ pinokio.js com 6 tabs +   │              │                           │
│       menu dinâmico funciona    │              │                           │
│                                 │              │                           │
│ 5. UI Web Profissional          │ ✓ Sim        │ [ ] Sim  [ ] Não         │
│    └─ Design system CSS         │              │                           │
│       (dark mode, responsive)   │              │                           │
│                                 │              │                           │
│ 6. Segurança                    │ ✓ Sim        │ [ ] Sim  [ ] Não         │
│    └─ CSP meta tag presente     │              │                           │
│       sem vulnerabilidades      │              │                           │
│                                 │              │                           │
│ 7. Idempotência Scripts         │ ✓ Sim        │ [ ] Sim  [ ] Não         │
│    └─ install.json roda 2x sem  │              │                           │
│       erro; reset.json prepara  │              │                           │
│       para novo install         │              │                           │
│                                 │              │                           │
│ 8. GPU Detection                │ ✓ Opcional   │ [ ] Sim  [ ] Não         │
│    └─ check_gpu.json detecta    │              │                           │
│       CUDA/ROCm (ou CPU OK)     │              │                           │
│                                 │              │                           │
└─────────────────────────────────┴──────────────┴───────────────────────────┘

RESUMO DE ACEITE:
└─ Passado: ___/8 critérios
   Status: [ ] APROVADO  [ ] COM RESSALVAS  [ ] REJEITADO

═══════════════════════════════════════════════════════════════════════════════════

🔍 DETALHES TÉCNICOS DE TESTE
════════════════════════════════════════════════════════════════════════════════

📂 Diretórios Criados Durante Testes
───────────────────────────────────
  .venv/                    Virtual env Python
  input/                    Imagens enviadas para detecção
  output/                   Imagens anotadas + JSONs exportados

📄 Arquivos Criados
───────────────────
  input/sample.jpg          Amostra baixada no install
  output/annotated_*.jpg    Imagens com bounding boxes
  output/export_*.json      Resultados exportados
  output/output_backup_*.tar.gz  Backup feito no reset

🔗 URLs Importantes
──────────────────
  Dashboard:                http://localhost:5000/
  API Health:               http://localhost:5000/api/health
  Detection API:            http://localhost:5000/api/detect (POST)
  Results API:              http://localhost:5000/api/results (GET)
  Export API:               http://localhost:5000/api/export (POST)

🕐 Tempos Esperados
──────────────────
  install.json:             3-5 min (primeira vez)
  install.json (2ª vez):    < 30 seg
  start.json:               2-3 seg
  Detecção (por imagem):    1-5 seg
  stop.json:                < 1 seg
  reset.json:               < 1 seg
  diagnostics.json:         < 5 seg

═══════════════════════════════════════════════════════════════════════════════════

✅ CHECKLIST FINAL
════════════════════════════════════════════════════════════════════════════════

ANTES DE COMEÇAR
────────────────
  [ ] Python 3.8+ instalado
  [ ] Mínimo 2GB disco livre
  [ ] pip funcionando
  [ ] Conexão internet (para baixar samples)
  [ ] Terminal bash disponível
  [ ] Imagens com faces para testar

DURANTE TESTES
──────────────
  [ ] Fase 1: Pré-requisitos OK
  [ ] Fase 2: Install OK
  [ ] Fase 3: Server inicia OK
  [ ] Fase 4: UI funciona + detecção OK
  [ ] Fase 5: Stop + Reset OK

RESULTADO FINAL
───────────────
  [ ] 8/8 critérios de aceite PASS
  [ ] Documentação validada
  [ ] Exemplos funcionando
  [ ] Pronto para Fase 3 (otimizações)

═══════════════════════════════════════════════════════════════════════════════════

📝 OBSERVAÇÕES & ISSUES ENCONTRADOS
════════════════════════════════════════════════════════════════════════════════

Issue                          Severidade    Status      Ação
─────────────────────────────  ────────────  ──────────  ───────────────
(Preencher durante testes)
                                             
_________________________      [ ] Alta      [ ] Open    [ ] Resolvido
Descrição: _______________
Fix: ___________________

_________________________      [ ] Média     [ ] Open    [ ] Resolvido
Descrição: _______________
Fix: ___________________

═══════════════════════════════════════════════════════════════════════════════════

🎯 PRÓXIMOS PASSOS (SE APROVADO)
════════════════════════════════════════════════════════════════════════════════

✓ FASE 3: Otimizações Avançadas
   ├─ Code-splitting CSS/JS
   ├─ Service worker offline support
   ├─ WebSocket para streaming de logs
   ├─ IndexedDB cache
   └─ Performance budgeting (< 100KB gzip)

✓ FASE 4: Documentação & Comunidade
   ├─ 5 guias por tipo de app
   ├─ Vídeos tutoriais
   ├─ Exemplos GitHub
   ├─ CI/CD integration
   └─ Community templates

═══════════════════════════════════════════════════════════════════════════════════

ASSINATURA & DATA
════════════════════════════════════════════════════════════════════════════════

Testador: ______________________    Data: ____________

Validador: ______________________   Data: ____________

═══════════════════════════════════════════════════════════════════════════════════
