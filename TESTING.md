# Guia de Estratégia de Testes e Qualidade - My-Pinokio

Este documento define a estratégia de qualidade, padrões e processos de teste para o projeto My-Pinokio.

## 1. Pirâmide de Testes Adotada

Adotamos a estratégia focada em **Prevenção > Detecção**, distribuída da seguinte forma:

### 1.1. Camada de Base (Unitários & Componentes) - 60%
- **Objetivo:** Verificar a lógica isolada de funções e componentes.
- **Ferramentas:**
  - **Rust:** `cargo test` (Core logic).
  - **Node.js/Shared:** `mocha` (Smoke/Logic).
- **Quando rodar:** Pré-commit (local) e em todo Push (CI).
- **O que testar:** Lógica de negócio, parsers, utilitários, validadores.

### 1.2. Camada de Serviço/Integração - 30%
- **Objetivo:** Verificar a comunicação entre módulos (Node <-> Tauri, API calls).
- **Ferramentas:** `mocha` (com mocks de sistema), `playwright` (api tests se aplicável).
- **Quando rodar:** Em Pull Requests (CI).

### 1.3. Camada de Topo (E2E & UI) - 10%
- **Objetivo:** Simular o usuário final em fluxos críticos.
- **Ferramentas:** `playwright` (UI Automation).
- **Quando rodar:** Nightly ou Pre-Release.
- **Cenários Críticos:**
  - Inicialização do App (Splash -> Main)
  - Fluxo de Atualização (Updater)
  - Permissões de Sistema

## 2. Padrões de Qualidade

### 2.1. Definition of Ready (DoR) para QA
Uma task só inicia desenvolvimento quando:
- [ ] Critérios de Aceite estão claros e listados.
- [ ] Impacto em áreas existentes mapeado.

### 2.2. Definition of Done (DoD)
Uma task é considerada pronta quando:
- [ ] Testes Unitários criados/atualizados.
- [ ] Testes de Fumaça passando localmente.
- [ ] Sem novos warnings no Linter.
- [ ] CI/CD verde (GitHub Actions).

## 3. Comandos de Teste

| Tipo | Comando | Descrição |
| :--- | :--- | :--- |
| **Lint** | `npm run lint` | Verifica estilo e erros estáticos. |
| **Smoke** | `npm run test:smoke` | Testes rápidos de sanidade (Node). |
| **E2E** | `npm run test:e2e` | Testes de interface completos (Playwright). |
| **Rust** | `cd src-tauri && cargo test` | Testes unitários do backend Rust (Futuro). |

## 4. Métricas de Sucesso (KPIs)

- **Estabilidade do Build:** Manter > 95% de builds verdes na branch `main`.
- **Tempo de Feedback:** CI deve rodar em menos de 10 minutos.
- **Cobertura Crítica:** 100% dos fluxos P0 (Bloqueantes) cobertos por E2E ou Teste Manual documentado.

## 5. Governância
- **Owner de Qualidade:** QA Senior / Tech Lead.
- **Code Review:** QA deve aprovar PRs que tocam em áreas críticas ou alteram fluxos core.
