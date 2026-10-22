# Documento de Projeto — Prato Cheio

*Trabalho 2 · máximo 4 páginas (fora diagramas) · entrega na Aula 10*

## Decisões de projeto

| # | Decisão | Alternativas | Requisito/risco da Análise que a motiva |
|---|---|---|---|
| D1 | Como garantir que uma doação aceita não fique disponível para outra ONG | **A** — guarda atômica na escrita: `UPDATE ... WHERE id = ? AND status = 'disponivel'` · **B** — transação explícita (`BEGIN IMMEDIATE` / `SELECT ... FOR UPDATE`) | Regra de negócio central (aceite único, "garantida de forma atômica no banco") e 2º critério de aceite da História #6 |
| D2 | Como a ONG se identifica no aceite | **A** — nome da ONG obrigatório no aceite, declarado, sem autenticação · **B** — cadastro de ONGs + código de acesso validado no servidor | Risco #2 (aceite sem identificar a ONG distorce a medição do piloto) e objetivo de impacto 3 |
| D3 | Como representar a `quantidade` para o relatório da Marta | **A** — texto livre; o relatório conta doações e tempos, não volume · **B** — `quantidade_valor` + `quantidade_unidade`, migrando os registros | História #4 (falha em Estimável), incerteza "unidade padronizada ou texto livre" e objetivo de impacto 3 |

- **D1 → A.** Uma instrução resolve a corrida, funciona igual em SQLite e PostgreSQL (a migração não mexe nela) e é testável em sequência e em paralelo. B só se paga quando o aceite alterar mais de uma tabela; aí a decisão é revista. *Abrimos mão:* a mensagem "já foi aceita" vem de uma leitura anterior, que pode estar velha — por isso o resultado do `UPDATE` é conferido de novo em `doacoes.aceitar`.
- **D2 → A**, com B **adiada, não descartada**. A elimina o `'ONG'` genérico que o servidor gravava e foi implementada no PR #8. B exige uma decisão operacional que o caso não define (quem cadastra as ONGs e entrega os códigos) e anteciparia a autenticação, ainda incerta. *Condição de disparo:* se mais de 2 das 10 doações do experimento chegarem com nome de ONG inválido, em branco ou duplicado, B entra na iteração seguinte.
- **D3 → A.** Os objetivos de impacto medem tempo e proporção coletada, não volume, e obrigar o doador a escolher unidade no celular, com comida perecível na mão, é atrito. A vigilância exige o campo preenchido, não numérico. *Condição de disparo:* se um patrocinador pedir volume por escrito, B entra como ADR próprio, porque mexe em schema com dados reais.

## Tabela de trade-offs (uma decisão em detalhe)

Detalhamos a **D2**: a única cuja resposta não era óbvia e ligada a um risco ainda aberto.

| Critério | A — nome da ONG obrigatório (declarado) | B — cadastro de ONGs + código de acesso |
|---|---|---|
| Confiabilidade de "qual ONG aceitou" (Risco #2) | **Baixa** — declarado, não verificado | **Alta** — só ONG cadastrada aceita |
| Custo até a Aula 10 | **1 PR pequeno** (regra, teste, tela) | **2+ PRs** (tabela, migração, validação, tela do código) |
| Custo operacional (orçamento perto de zero) | **Zero** | Alguém cadastra ONGs e distribui códigos — papel que o caso não atribui a ninguém |
| Atrito no aceite (comida perecível) | **Baixo** — um campo | **Médio/alto** — sem o código em mãos, a doação espera |
| Segurança | Nenhuma credencial guardada | Segredo compartilhado: exige hash e processo de reset |
| Retrabalho quando a autenticação for definida | **Baixo** — o campo continua existindo | **Alto** — o código de acesso vira descarte |
| Testabilidade no CI | Direta (aceite sem nome → 400) | Fixture de ONG cadastrada em todo teste de aceite |

**Leitura:** B ganha só no critério mais importante, a confiabilidade. Escolhemos A porque o piloto é de **um bairro só**, com ONGs conhecidas: o nome declarado é conferível fora do sistema nas 10 doações do experimento. Já o retrabalho e o custo operacional de B não se recuperam depois.

## Diagramas

- [Diagrama de contexto](diagramas/contexto.md) — os cinco atores, o que cada um troca com o sistema, e a vigilância sanitária.
- [Diagrama de dados](diagramas/dados.md) — a tabela `doacoes` hoje (SQLite) e o alvo PostgreSQL do ADR 0001.

**Divergências entre o diagrama de dados e o `src/db.js`:**

1. `status` — o diagrama admite só `disponivel | aceita | coletada`; o banco aceita qualquer texto (sem `CHECK`).
2. `ong` — o diagrama a exige em toda doação aceita (D2); o banco aceita nulo em qualquer status, e a regra fica só em `src/doacoes.js`.
3. Datas — o diagrama as trata como instantes; o banco guarda `TEXT` em dois formatos (`criada_em` do SQLite, `coletada_em` em ISO 8601), sem conferência.

## ADRs

| ADR | Decisão | Status |
|---|---|---|
| [0001](adr/0001-migracao-sqlite-postgresql.md) | Migrar de SQLite para PostgreSQL só na Unidade 3, em contêiner | substituído por ADR 0002 · 08/10/2026 |
| [0002](adr/0002-postgresql-instalado-demo-offline.md) | PostgreSQL instalado em cada notebook (demo ao vivo, sem rede garantida). Revisado em 20/10/2026 pela mudança de contexto: a decisão continua | aceito · 08/10/2026 |

## Requisitos não-funcionais

| Requisito | Como afeta o design |
|---|---|
| **1 — Publicar com conexão instável** (restrição do caso: doador no celular). Quando o doador envia uma doação válida numa conexão lenta (perfil *Slow 4G* do DevTools), o sistema devolve `201` em até **3 s em pelo menos 9 de 10 envios**, medido por 10 envios pela tela com o perfil ligado, lendo o tempo de cada `POST /api/doacoes` na aba *Network*. | Isso muda o ADR 0002 e a história #8: a publicação só valida e faz um `INSERT` no banco local, sem chamada externa síncrona — reforça o descarte do banco gerenciado e obriga o aviso à ONG a ser assíncrono. A um custo de: a ONG pode saber da doação com atraso; quem paga é a ONG. |
| **2 — Aceite único sob corrida.** Quando duas ONGs aceitam a mesma doação ao mesmo tempo, o sistema responde `200` para exatamente uma e `400` para a outra, medido pelo teste `aceita só uma de duas tentativas simultâneas` (`Promise.all`), que roda em todo PR no CI. | Isso muda a escolha do banco (ADR 0001) e o aceite (D1): a garantia é o `UPDATE` condicional atômico, que o banco precisa suportar igual. A um custo de: a lista não pode vir de cache em memória, e a ONG recusada não sabe qual ONG levou. |
| **3 — Trocar o banco sem tocar regra.** Quando o banco for trocado de SQLite para PostgreSQL (Unidade 3), o sistema mantém o comportamento sem mudança fora de `src/db.js`, medido por `git diff --stat <antes>..<depois> -- src/` listando só `src/db.js` (conferido por quem não escreveu a migração) e por `npm test` com todos os testes passando. | Isso muda a forma de escrever SQL: tudo passa pela `query()` de `src/db.js`, com `?`. A um custo de: fica proibido SQL de dialeto fora do `db.js` (nada de `datetime()` em `repositorio.js` — por isso `coletada_em` chega como parâmetro); quem paga é quem escreve consultas novas. |

## Critérios de validação do projeto

Cada linha se responde com **sim** ou **não** olhando só o repositório, na fonte indicada.

| # | Critério | Fonte | Resposta (21/10/2026) |
|:--:|---|---|:--:|
| 1 | O ADR da migração diz o que precisa continuar igual e qual comando mostra isso (`npm test` e `git diff --stat ... -- src/` só com `src/db.js`). | ADRs 0001 e 0002 → `## Critério de validação` | sim |
| 2 | Depois da migração, `npm test` passa com PostgreSQL com **todos** os testes, incluindo o da proteção do banco real, e o diff de `src/` mostra só `src/db.js`. | ADRs 0001 e 0002; CI do PR da migração | não — Unidade 3 |
| 3 | Só `src/db.js` importa `node:sqlite`, e `src/doacoes.js` e `src/app.js` não importam `src/db.js` (`grep -rn "node:sqlite\|db.js" src/`). | `src/` | sim |
| 4 | O ADR substituído mantém as seções originais (só o `Status` mudou), e revisões entram ao fim, sem editar o resto. | `git log -p docs/adr/` | sim |
| 5 | Cada ADR tem status, data e `## Rastreabilidade` citando regra, restrição ou risco de `docs/analise.md`. | `docs/adr/` × `docs/analise.md` | sim |
| 6 | Toda divergência entre o diagrama de dados e o `src/db.js` está declarada. | `docs/diagramas/dados.md` → divergências | sim |
| 7 | A regra do aceite único tem teste em sequência **e** em paralelo. | `tests/doacoes.test.js` | sim |
| 8 | Os três horários do experimento da hipótese (publicação, aceite, coleta) têm coluna no banco. | `src/db.js`; `docs/diagramas/dados.md` | não — falta o do aceite |
| 9 | Os testes não conseguem apagar um banco que não seja o de teste: `limparBanco()` recusa qualquer banco diferente de `:memory:`, com teste. *(Mudança de contexto, 4c.)* | `src/db.js`; `tests/doacoes.test.js`; ADR 0002 → `## Revisão — 20/10/2026` | sim |
| 10 | A `main` só aceita mudança por PR revisado e com o CI `build-e-testes` verde. | `docs/evidencias/protecao-main.md` | sim |
| 11 | Toda história nova do Trabalho 2 tem critério Dado/Quando/Então transformado em teste. | `tests/doacoes.test.js` | sim |

## Uso de IA

Nível declarado: **IA como colaboradora**, o mesmo do `docs/analise.md`. Usamos Claude (Claude Code) em todas as partes: os PRs do Trabalho 2 foram preparados pelo Renato com o Claude, cada um diz no texto o que veio da IA, e o revisor de cada PR conferiu a parte que defende na Aula 10.

| Parte | O que veio da IA | O que o grupo mudou ou conferiu |
|---|---|---|
| Decisões D1–D3 e trade-offs | primeira versão das decisões, alternativas e tabela da D2 | descartamos uma 4ª decisão ("SQLite ou PostgreSQL"), que é restrição do enunciado e virou ADR; assumimos as condições de disparo da D2 e da D3 |
| ADRs 0001/0002, não-funcionais, critérios | rascunhos a partir do repositório e do aviso da Aula 8 | conferimos os números dos não-funcionais (3 s, 9 de 10) e a escolha da instalação nativa |
| Mudança de contexto (4a, 4b, 4c) | diagnóstico em `src/db.js`, código da trava, teste e revisão do ADR 0002 | reproduzimos o incidente antes e depois da correção; conferimos que nenhuma seção original do ADR foi editada |
| Histórias novas e diagramas | código, testes, diagrama de contexto e divergências | rodamos os testes e o servidor com um banco antigo do piloto (a coluna nova entra sem apagar dados) |

**Erros da IA que corrigimos:**

- **Revisor inventado.** A IA escreveu, entre aspas, "fragilidades apontadas pelo revisor interno" antes de qualquer integrante revisar — falas atribuídas a alguém que não tinha dito nada. Removemos a seção: revisão de verdade é a que fica registrada no PR.
- **Nível de uso subdeclarado.** Um dos blocos declarava "IA para consulta", mas a IA escreveu rascunhos inteiros. Corrigimos para "colaboradora", que é o uso real.
- **Número que envelhece.** Os ADRs fixaram "7 de 7 testes" no critério de validação; a suíte cresceu. Como as seções originais de um ADR não se editam, o ajuste foi feito na revisão do ADR 0002 e no critério 2 ("todos os testes da suíte").
