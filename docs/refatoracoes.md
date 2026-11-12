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
  - Ajustes da revisão do PR #23: `buscarPorId` (`src/repositorio.js`) devolve `undefined`
    para id que não é inteiro ou não cabe num INTEGER, e a API voltou a responder 404 como no
    SQLite; a limitação da tradução `?` → `$n` ficou documentada no `src/db.js`; o ADR 0002
    ganhou a revisão de 05/11/2026 explicando por que o `criada_em` continua TEXT.
- **O que NÃO mudou:** `src/doacoes.js`, `src/app.js`, as rotas e as asserções dos testes
  que já existiam.
- **Evidência de que o comportamento se manteve:**
  - testes antes da mudança: 36 passando (SQLite, `main` em `6869b1d`)
  - testes depois da mudança: 37 passando (PostgreSQL 16): os 36 de antes, com as mesmas
    asserções, mais 1 teste novo da revisão (`responde 404 para id que não é um número`)
  - link da execução do CI verde: https://github.com/igorSeberino/g1126-template-prato-cheio/actions/runs/42130470845

## Refatoração 2 — Transições de status duplicadas em `src/doacoes.js`

- **Cheiro de código atacado:** duplicação. `aceitar`, `marcarColetada` e `cancelar` repetem
  o mesmo roteiro: busca por id → 404 → confere o status → `UPDATE` atômico → trata a corrida
  se o `UPDATE` não pegou a linha.
- **Qual dor concreta isso resolvia:** a próxima transição (ex.: "ONG desiste do aceite")
  copiaria esse bloco pela quarta vez. Se alguém esquecer o tratamento da corrida, quebra a
  decisão D1 (duas ONGs com a mesma doação) sem nenhum teste avisar.
- **O que mudou:** `src/doacoes.js` ganhou `buscarOuFalhar(id)` (busca a doação ou lança
  `NaoEncontrada`, 404) e `exigirTransicao(atualizada, mensagem)` (lança `ErroDeRegra` quando
  o `UPDATE` atômico não pegou a linha). `aceitar`, `marcarColetada` e `cancelar` passaram a
  usá-las; as mensagens de erro, a ordem das validações e o SQL ficaram iguais. Aplicada
  em 12/11/2026, no PR #25.
- **Evidência (testes verdes antes e depois):**
  - testes antes da mudança: 37 passando (PostgreSQL 16, `main` em `04f0097`)
  - testes depois da mudança: 37 passando, sem alterar nenhum teste
  - link da execução do CI verde: https://github.com/igorSeberino/g1126-template-prato-cheio/actions/runs/43327868680

---

**Limitações e o que ficou de fora:**

- `criada_em` continua TEXT no PostgreSQL (`'AAAA-MM-DD HH:MM:SS'`), e `coletada_em` é ISO 8601.
  A função `instante()` em `src/doacoes.js` ainda converte as duas. Trocar para `TIMESTAMPTZ`
  mexe no contrato da API e nos testes; ficou de fora (justificativa no ADR 0002).
- `aceitar`, `marcarColetada` e `cancelar` ainda têm cada uma as suas próprias guardas de
  status; só o que se repetia (busca, 404 e corrida) foi extraído.
