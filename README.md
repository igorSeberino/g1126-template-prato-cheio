# Prato Cheio — Grupo de Análise

Projeto da disciplina **Análise, Projeto e Desenvolvimento Ágil**.
Conecta doadores de alimentos excedentes a ONGs, antes que a comida se perca.

> Este repositório é a base do produto que evolui nas três unidades:
> walking skeleton (U1) → incremento guiado pelo projeto (U2) → produto refatorado (U3).

## Integrantes
- Adrian Cesar Gonçalves — @adrian-cesar
- Diego Nessler — @Diegonessler
- Gabriel Carvalho — @gabrielcarvallho
- Igor Thiago seberino — @igorSeberino
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

Requisito: **Node.js 22.13 ou superior**. Mais nada — o banco da Unidade 1 é SQLite, embutido no próprio Node.

> Esta é a **stack preferencial** da disciplina. Se o seu grupo optar por outra, registre o ADR de justificativa e garanta os mesmos compromissos: repositório público com CI verde, rota de saúde, testes por um comando, os três comandos documentados aqui no README e banco relacional migrado para PostgreSQL na Unidade 3.

```bash
npm install       # só na primeira vez
npm run db:migrar # cria o schema (arquivo dados.sqlite)
npm start         # sobe em http://localhost:3000
npm test          # roda os testes
npm run dev       # sobe recarregando a cada alteração
```

Os testes usam SQLite **em memória**, então não sujam o banco de desenvolvimento.

> Ao rodar `npm test` o Node imprime `ExperimentalWarning: SQLite is an experimental feature`.
> É esperado — o módulo embutido `node:sqlite` ainda é marcado como experimental. Não é erro e não reprova o CI.

> **Atenção:** não deixe o repositório dentro de uma pasta sincronizada (OneDrive, Google Drive, Dropbox) nem em disco de rede. O SQLite precisa de trava de arquivo e nesses lugares falha com `disk I/O error`. Clone em uma pasta local comum, por exemplo `~/dev/`.

## O banco: SQLite agora, PostgreSQL depois

| Unidade | Banco | O que precisa instalar |
|---|---|---|
| 1 — Análise | **SQLite** (`node:sqlite`, embutido) | nada além do Node |
| 2 — Projeto | SQLite | nada |
| 3 — Construção | **PostgreSQL** (após refatorar) | um PostgreSQL acessível — o caminho é escolha do grupo |

A troca não é acidente de percurso: na Unidade 2 vocês registram a decisão em um **ADR** (alternativas, consequências, riscos) e na Unidade 3 executam a **refatoração** — com os testes existentes provando que o comportamento se manteve.

O `src/db.js` foi desenhado para isso: ele expõe `query()` devolvendo `{ rows }`, então a troca do banco fica contida nele e não vaza para as regras de negócio.

**Como o PostgreSQL vai subir é decisão do grupo**, comparada no mesmo ADR: instalar o PostgreSQL na máquina, subir um contêiner, ou usar um serviço gerenciado gratuito (Neon, Supabase, Render). A disciplina não impõe o caminho — exige o banco alcançável por `DATABASE_URL`, o schema migrado e o CI verde. Cada opção tem custo e risco diferentes, e reconhecê-los é parte da decisão.

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
- [ ] SQL só em `src/repositorio.js`, com marcador `?` e sem valor colado na string — onde se confere: diff do PR

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

**Falta (Unidade 3 / Trabalho 3):**

- Migrar para PostgreSQL conforme o ADR 0002, com a troca contida em `src/db.js`.
- Gravar o horário do aceite no banco (critério 8 de `docs/projeto.md`).
- `docs/validacao.md`, `docs/refatoracoes.md` e `docs/demo.md`, incluindo o ensaio offline
  de cada integrante.

## Uso de IA

A IA pode participar da produção, mas o grupo é responsável por verificar, testar,
corrigir e **defender** o resultado. Registre em cada Pull Request o que foi gerado
com IA e o que vocês alteraram.
