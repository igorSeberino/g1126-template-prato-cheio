# Refatorações — Prato Cheio

*Trabalho 3 · uma seção por refatoração · o que importa é o motivo e a evidência*

## Refatoração 1 — Migração de SQLite para PostgreSQL

- **Motivo:** o ADR 0001 decidiu migrar de SQLite para PostgreSQL na Unidade 3. Ele foi
  substituído pelo ADR 0002, que definiu como: PostgreSQL 16 instalado no notebook de cada
  integrante (a demo precisa rodar offline) e contêiner só no CI. Trabalho feito no PR #23.
- **O que mudou:**
  - `src/db.js`: troca o `node:sqlite` pelo pacote `pg`, mantendo o contrato `query()` →
    `{ rows }`; a trava do `limparBanco()` passa a perguntar o nome do banco ao servidor
    (`current_database()`) e só apaga o `pratocheio_teste`.
  - `src/repositorio.js`: marcadores `$1, $2…` do PostgreSQL no lugar de `?`.
  - `.github/workflows/ci.yml`: `services: postgres` (`postgres:16-alpine`) e `DATABASE_URL`
    apontando para o banco `pratocheio_teste`.
  - `vitest.config.js`: os testes usam o banco `pratocheio_teste` (ou `DATABASE_URL_TESTE`).
  - Preparação do teste de proteção: cria um banco temporário no PostgreSQL em vez de um
    arquivo SQLite.
- **O que NÃO mudou:** `src/doacoes.js`, `src/app.js`, as rotas e as asserções dos testes.
- **Evidência de que o comportamento se manteve:**
  - testes antes da mudança: 36 passando (SQLite, `main` em `6869b1d`)
  - testes depois da mudança: 36 passando (PostgreSQL 16)
  - link da execução do CI verde: https://github.com/igorSeberino/g1126-template-prato-cheio/actions/runs/42126821110

## Refatoração 2 — (nome)

- **Cheiro de código atacado:** (duplicação, função longa, nome que engana, regra na rota…)
- **Qual dor concreta isso resolvia:**
- **O que mudou:**
- **Evidência (testes verdes antes e depois):**

---

**Limitações e o que ficou de fora:** (o que vocês viram e decidiram não refatorar, e por quê)
