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

## Refatoração 2 — Transições de status duplicadas em `src/doacoes.js`

- **Cheiro de código atacado:** duplicação. `aceitar`, `marcarColetada` e `cancelar` repetem
  o mesmo roteiro: busca por id → 404 → confere o status → `UPDATE` atômico → trata a corrida
  se o `UPDATE` não pegou a linha.
- **Qual dor concreta isso resolvia:** a próxima transição (ex.: "ONG desiste do aceite")
  copiaria esse bloco pela quarta vez. Se alguém esquecer o tratamento da corrida, quebra a
  decisão D1 (duas ONGs com a mesma doação) sem nenhum teste avisar.
- **O que vai mudar:** extrair uma função que busca a doação ou lança `NaoEncontrada`, e outra
  que lança `ErroDeRegra` quando o `UPDATE` atômico não pegou a linha. As três regras passam
  a usá-las.
- **Evidência (testes verdes antes e depois):** pendente. Refatoração escolhida e registrada
  em 05/11; será aplicada em PR à parte, depois do merge do PR #23, com a suíte verde antes e
  depois.

---

**Limitações e o que ficou de fora:** (o que vocês viram e decidiram não refatorar, e por quê)
