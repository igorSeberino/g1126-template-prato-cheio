# Prato Cheio — Grupo de Análise

Projeto da disciplina **Análise, Projeto e Desenvolvimento Ágil**.
Conecta doadores de alimentos excedentes a ONGs, antes que a comida se perca.

> Este repositório é a base do produto que evolui nas três unidades:
> walking skeleton (U1) → incremento guiado pelo projeto (U2) → produto refatorado (U3).

## Integrantes
- Adrian Cesar Gonçalves — @adrian-cesar
- Diego Nessler — @Diegonessler
- Gabriel Carvalho — @gabrielcarvallho
- Igor Thiago Seberino — @igorSeberino
- Renato Colin Neto — @rcolinneto

## Contribuições

### Trabalho 1

| Integrante | O que fez (commits reais) |
|---|---|
| Diego Nessler (@Diegonessler) | Histórias de usuário e seção "Uso de IA" no `docs/analise.md` (Aula 3) |
| Gabriel Carvalho (@gabrielcarvallho) | Walking skeleton — implementou `src/doacoes.js` e `src/repositorio.js`, os testes em `tests/doacoes.test.js`, as seções da Aula 4 e a retrospectiva; fez o merge do PR |
| Igor Seberino (@igorSeberino) | Commit inicial do grupo (README com os integrantes) |
| Renato Colin Neto (@rcolinneto) | Problema central e Incertezas do `docs/analise.md` |
| Adrian Cesar Gonçalves (@adrian-cesar) | Stakeholders, Objetivos de impacto e Regras de negócio do `docs/analise.md` |

### Trabalho 2 — responsável e revisor por etapa

| Etapa | Responsável (autor do PR) | Revisor combinado | Aprovação registrada no GitHub | Defende na Aula 10 | PR |
|---|---|---|---|---|---|
| 0 — Organizar e proteger a `main` | Igor | Renato | Renato | Igor | #2 |
| 1 — Decisões de projeto e trade-offs | Igor | Renato | Renato (#2), Igor (#10) | Igor | #2 (texto final no #10) |
| 2 — Diagramas | Renato | Adrian | Igor | Adrian | #9 |
| 3 — ADRs | Renato | Adrian | Igor | Renato | #4 |
| 4 — Mudança de contexto (4a, 4b, 4c) | Renato | Adrian | Igor (#5, que levou o #6) | Renato | #5, #6 |
| 5 — Não-funcionais e critérios de validação | Renato | Adrian | Igor (#4; #6 via #5) | Renato | #4, #6 |
| 6 — Histórias novas | Renato | Gabriel | Igor (#7 via #5; #8 via #9) | Gabriel | #7, #8 |
| 7 — Uso de IA | Renato | Adrian | Igor | Adrian | #9 |
| 6 — Histórias novas (relatório mensal da Marta) | Diego | Renato | Igor | Diego | #11 |
| 8 — Conferência e limite de 4 páginas | Renato | Igor | Igor | Igor | #10 |
| 9 — Entrega (`entrega-2`) | Igor | Gabriel | — (branch, sem PR) | — | branch `entrega-2` |

"Revisor combinado" é a divisão feita no início do trabalho; "Aprovação registrada no GitHub"
é quem de fato aprovou o PR. Os PRs #6, #7 e #8 foram integrados pelo Gabriel em branches
intermediárias, sem aprovação registrada, e chegaram à `main` dentro dos PRs #5 e #9, que
passaram pela proteção da `main` (aprovação + CI verde).

O uso de IA em cada parte do trabalho está registrado em `docs/projeto.md` → `## Uso de IA`.

## Como rodar

Requisitos: **Node.js 22.13 ou superior** e **PostgreSQL 16** instalado na máquina
(decisão do [ADR 0002](docs/adr/0002-postgresql-instalado-demo-offline.md): roda sem internet,
sem Docker). O PostgreSQL 18 também funciona (testado num clone limpo, Postgres.app no macOS).

### 1. PostgreSQL — uma vez por máquina

Instale o PostgreSQL e deixe o serviço ligado na porta **5432**:

- **Windows / Linux:** instalador oficial em <https://www.postgresql.org/download/>.
- **macOS:** [Postgres.app](https://postgresapp.com/) (clique em *Start*). Na primeira conexão
  do Node ele pode perguntar se permite o acesso — clique em **Allow**.

Abra o `psql` como administrador (no Windows/Linux, usuário `postgres`; no Postgres.app,
dois cliques em qualquer banco da janela) e crie o usuário e os **dois** bancos:

```sql
CREATE USER pratocheio WITH PASSWORD 'pratocheio' CREATEDB;
CREATE DATABASE pratocheio       OWNER pratocheio;  -- desenvolvimento e demo
CREATE DATABASE pratocheio_teste OWNER pratocheio;  -- usado pelo npm test
```

- O `pratocheio_teste` é obrigatório: sem ele **todos os testes falham** com
  `database "pratocheio_teste" does not exist`.
- O `CREATEDB` é obrigatório: o teste "proteção do banco real" cria um banco temporário.

### 2. Projeto

Clone em uma pasta local comum (por exemplo `~/dev/`), **fora** de OneDrive, Google Drive ou iCloud.

```bash
npm install       # só na primeira vez
npm run db:migrar # cria a tabela no banco pratocheio; imprime "schema criado"
npm test          # roda os testes no banco pratocheio_teste (37 testes)
npm start         # sobe em http://localhost:3000
npm run dev       # sobe recarregando a cada alteração
```

### Conexão (`DATABASE_URL`)

Não precisa de `.env`. Sem `DATABASE_URL`, o app usa
`postgres://pratocheio:pratocheio@localhost:5432/pratocheio` (o mesmo do `.env.example`).
Para outro servidor, porta ou senha, defina antes de rodar:

```bash
export DATABASE_URL=postgres://usuario:senha@host:5432/pratocheio            # npm start / db:migrar
export DATABASE_URL_TESTE=postgres://usuario:senha@host:5432/pratocheio_teste # npm test
```

Os testes **nunca** usam o banco de desenvolvimento: o `vitest.config.js` aponta para o
`pratocheio_teste`, e `limparBanco()` se recusa a apagar qualquer banco com outro nome.
No CI, o GitHub Actions sobe um `postgres:16-alpine` como *service container* (`.github/workflows/ci.yml`).

> Avisos esperados no `npm install` (não impedem nada): `vulnerabilities` nas dependências e,
> no npm 12+, `install scripts blocked` para `esbuild`/`fsevents`.

> **Stack da disciplina:** repositório público com CI verde, rota de saúde (`/api/saude`),
> testes por um comando e banco relacional em PostgreSQL na Unidade 3.

## O banco: de SQLite a PostgreSQL

| Unidade | Banco | Registro |
|---|---|---|
| 1 — Análise | SQLite (`node:sqlite`, embutido) | — |
| 2 — Projeto | SQLite; decisão da troca registrada | [ADR 0001](docs/adr/0001-migracao-sqlite-postgresql.md) (contêiner) → [ADR 0002](docs/adr/0002-postgresql-instalado-demo-offline.md) (instalado) |
| 3 — Construção | **PostgreSQL 16** (feito, PR #23) | Refatoração 1 em `docs/refatoracoes.md` |

Por que **instalado** e não em contêiner: a demo é ao vivo, no notebook de um integrante
sorteado, sem garantia de internet na sala (ADR 0002). O CI continua com contêiner.

A troca ficou contida em `src/db.js`, que expõe `query()` devolvendo `{ rows }`; as regras
de negócio não mudaram e os mesmos testes provam que o comportamento se manteve.

## Estrutura

```
src/server.js        entrypoint (npm start)
src/db.js            conexão, schema e limpeza do banco de teste
src/app.js           rotas da API
src/doacoes.js       regras de negócio
src/repositorio.js   acesso ao banco (SQL)
public/index.html    interface (funciona no celular)
tests/               testes automatizados
docs/analise.md      documento de análise   (Trabalho 1)
docs/projeto.md      documento de projeto   (Trabalho 2)
docs/adr/            decisões arquiteturais (Trabalho 2)
docs/validacao.md    validação e testes     (Trabalho 3)
docs/refatoracoes.md refatorações feitas    (Trabalho 3)
docs/demo.md         roteiro da demo        (Trabalho 3)
docs/retrospectivas/ retrospectiva de cada iteração
.github/workflows/   pipeline de CI
```

## Como trabalhar (fluxo de Pull Request)

A partir da Unidade 2, **nada entra direto na `main`**:

```bash
git checkout -b historia/ong-aceita-doacao
# ... implementa, escreve o teste, roda npm test ...
git commit -m "ONG aceita uma doação e ela sai da lista"
git push -u origin historia/ong-aceita-doacao
```

Abra o Pull Request no GitHub, preencha o template, espere o **CI ficar verde** e
peça a revisão de **outro integrante**. Só então faça o merge.

## Definição de pronto

Pronto, no nosso grupo, é:

- [ ] CI verde no PR — onde se confere: aba Checks do PR (check `build-e-testes`)
- [ ] Aprovado por um integrante que não é o autor — onde se confere: aba Reviews do PR
- [ ] Cada critério de aceite da fatia tem um `it` com o nome do critério, não `it.todo` — onde se confere: diff do PR em `tests/doacoes.test.js`
- [ ] Descrição do PR com História / decisão, Como verificar e Uso de IA preenchidos — onde se confere: descrição do PR
- [ ] SQL só em `src/repositorio.js`, com marcadores `$1, $2…` e sem valor colado na string — onde se confere: diff do PR

## O que já está pronto e o que falta

**Pronto (até o Trabalho 2):**

- História zero ponta a ponta: o doador publica → a ONG vê a lista → a ONG aceita e a
  doação sai da lista, com o aceite único garantido no banco (decisão D1), inclusive sob corrida.
- A ONG informa o nome no aceite (decisão D2), o voluntário marca a doação como coletada
  com o horário do evento (história #3) e a Marta vê o relatório mensal (história #4).
- Proteção do banco real: a limpeza dos testes só apaga o banco de teste (mudança de
  contexto do Trabalho 2).
- Cada critério de aceite tem teste Dado/Quando/Então em `tests/doacoes.test.js`, rodando
  no CI a cada PR.
- Documentos: `docs/analise.md` (Trabalho 1); `docs/projeto.md`, ADRs 0001 e 0002,
  diagramas e evidência da proteção da `main` (Trabalho 2).

**Feito na Unidade 3:**

- Migração para PostgreSQL conforme o ADR 0002, com a troca contida em `src/db.js` (PR #23).
- `docs/refatoracoes.md` (Refatorações 1 e 2) e o roteiro `docs/demo.md`.

**Falta (Trabalho 3):**

- Gravar o horário do aceite no banco (critério 8 de `docs/projeto.md`).
- `docs/validacao.md`, `docs/retrospectivas/3.md` e o "Testado por" do `docs/demo.md`,
  incluindo o ensaio offline de cada integrante.

## Uso de IA

A IA pode participar da produção, mas o grupo é responsável por verificar, testar,
corrigir e **defender** o resultado. Registre em cada Pull Request o que foi gerado
com IA e o que vocês alteraram.
