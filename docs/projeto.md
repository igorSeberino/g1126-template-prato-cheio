# Documento de Projeto — Prato Cheio

*Trabalho 2 · máximo 4 páginas (fora diagramas) · entrega na Aula 10*

## Decisões de projeto
| # | Decisão | Alternativas | Requisito/risco da Análise que a motiva |
|---|---|---|---|

## Tabela de trade-offs (uma decisão em detalhe)
| Critério | Alternativa A | Alternativa B |
|---|---|---|

## Diagramas
(contexto + dados ou componentes — em `docs/` ou como imagem)

- [Diagrama de dados](diagramas/dados.md) — schema atual (SQLite) × alvo PostgreSQL, com as
  divergências em relação a `src/db.js` declaradas.

## ADRs
Ver `docs/adr/`.

| ADR | Decisão | Status |
|---|---|---|
| [ADR 0001](adr/0001-migracao-sqlite-postgresql.md) | Migrar de SQLite para PostgreSQL na Unidade 3, com PostgreSQL em contêiner | substituído por ADR 0002 · 08/10/2026 |
| [ADR 0002](adr/0002-postgresql-instalado-demo-offline.md) | PostgreSQL instalado em cada notebook, não em contêiner (revisão do ADR 0001 após o aviso de demo ao vivo, sem rede garantida) | aceito · 08/10/2026 |

## Requisitos não-funcionais

Três cenários, cada um no formato *quando · o sistema · medido por*, e a decisão que muda
por causa dele. "Orçamento próximo de zero" **não** aparece aqui: é restrição do caso, não
se mede, e está no contexto dos ADRs 0001 e 0002.

| Requisito | Como afeta o design |
|---|---|
| **1 — Publicar com conexão instável** (nasce da restrição do caso: o doador publica pelo celular, com conexão instável — `docs/analise.md` → `## Stakeholders`). **Quando** o doador envia uma doação válida pelo celular numa conexão lenta (perfil *Slow 4G* do DevTools do Chrome), **o sistema** devolve `201` com a doação criada **em até 3 s em pelo menos 9 de 10 envios**. **Medido por:** 10 envios pela tela `public/index.html` com o perfil de rede ligado; tempo de cada `POST /api/doacoes` lido na aba *Network*. Falha se 2 ou mais passarem de 3 s. | **Afeta o ADR 0002 e a história #8.** A publicação faz só validação no servidor e um `INSERT` no banco **local ao servidor** — nada de chamada externa síncrona na hora do envio. Isso reforça o descarte do PostgreSQL gerenciado (ADR 0001/0002: cada consulta pagaria uma ida à nuvem) e obriga o aviso à ONG (história #8) a ser **assíncrono**. **Custo:** a ONG pode saber da doação nova com atraso; quem paga é a ONG, e o aviso fica mais caro de construir. A tela continua HTML puro, sem framework — custo: menos recurso visual. |
| **2 — Aceite único sob corrida** (regra central do caso). **Quando** duas ONGs enviam `POST /api/doacoes/:id/aceitar` para a mesma doação **ao mesmo tempo**, **o sistema** responde `200` para exatamente uma e `400` para a outra, e a doação sai da lista. **Medido por:** o teste automatizado `aceita só uma de duas tentativas simultâneas` em `tests/doacoes.test.js` (duas requisições em paralelo com `Promise.all`), rodando em todo PR no CI — hoje em SQLite, depois da migração em PostgreSQL. Falha se as duas receberem `200`. | **Afeta a escolha do banco (ADR 0001) e o código de aceite.** A garantia fica na escrita atômica `UPDATE ... WHERE id = ? AND status = 'disponivel' RETURNING *` (`src/repositorio.js`), e o banco escolhido precisa suportá-la igual — PostgreSQL suporta; um armazenamento sem `UPDATE` condicional atômico estaria descartado. **Custo:** a lista não pode ser servida de cache em memória (a doação aceita reapareceria), e a ONG recusada recebe só "já foi aceita por outra ONG", sem saber qual — quem paga é a ONG que perdeu a corrida. |
| **3 — Trocar o banco sem tocar regra.** **Quando** o banco for trocado de SQLite para PostgreSQL (Unidade 3), **o sistema** mantém o comportamento sem nenhuma mudança fora de `src/db.js`. **Medido por:** `git diff --stat <commit-antes>..<commit-depois> -- src/` lista **só** `src/db.js`, conferido por um integrante que não escreveu o PR da migração; e `npm test` passa com o mesmo número de testes de antes. Falha se aparecer `src/repositorio.js`, `src/doacoes.js` ou `src/app.js` no diff. | **Afeta o ADR 0001 (critério de validação) e a forma de escrever SQL.** Toda consulta passa pela `query()` única de `src/db.js`, sempre com o marcador `?`, e o `db.js` traduz para `$1, $2…` no PostgreSQL. **Custo:** fica proibido SQL específico de um banco fora do `db.js` (nada de `$1`, `datetime()` ou `now()` em `repositorio.js`); quem paga é quem escreve consultas novas, que perde atalhos do dialeto. |

## Critérios de validação do projeto

Cada linha se responde com **sim** ou **não** olhando só o repositório, na fonte indicada.
Tipo: **V** = verificar (projeto × o que foi especificado) · **C** = cobrir o caso (validar).

| # | Tipo | Critério | Fonte | Resposta em 08/10/2026 |
|:--:|:--:|---|---|:--:|
| 1 | V | O ADR da migração diz **o que precisa continuar igual** e **qual comando** mostra isso (`npm test` com o mesmo número de testes e `git diff --stat ... -- src/` só com `src/db.js`). | `docs/adr/0001-migracao-sqlite-postgresql.md` → `## Critério de validação`; `docs/adr/0002-postgresql-instalado-demo-offline.md` → `## Critério de validação` | sim |
| 2 | V | Depois da migração, `npm test` passa com PostgreSQL (`DATABASE_URL` definida) com **8 de 8** testes, e o diff de `src/` mostra só `src/db.js`. | `docs/adr/0001-migracao-sqlite-postgresql.md` → `## Critério de validação`; execução do CI no PR da migração | não — a migração é da Unidade 3 |
| 3 | V | Só `src/db.js` importa `node:sqlite`, e nenhum arquivo de regra ou rota (`src/doacoes.js`, `src/app.js`) importa `src/db.js`. Confere-se com `grep -rn "node:sqlite\|db.js" src/`. | `src/` | sim |
| 4 | V | O ADR substituído mantém as seções originais: `git log -p docs/adr/0001-migracao-sqlite-postgresql.md` mostra, depois do commit que o criou, só a linha `Status` alterada; e o ADR novo cita o antigo. | `docs/adr/0001-migracao-sqlite-postgresql.md`; `docs/adr/0002-postgresql-instalado-demo-offline.md` → cabeçalho `Substitui` | sim |
| 5 | V | Cada ADR tem status e data no cabeçalho e uma seção `## Rastreabilidade` que cita uma regra, restrição ou risco existente em `docs/analise.md`. | `docs/adr/` × `docs/analise.md` → `## Regras de negócio`, `## Riscos` | sim |
| 6 | V | Toda divergência entre o diagrama de dados e o `src/db.js` está declarada. | `docs/diagramas/dados.md` → `## Divergências declaradas` | sim |
| 7 | V | Cada requisito não-funcional tem um número, um procedimento de medição e a condição em que falha. | `docs/projeto.md` → `## Requisitos não-funcionais` | sim |
| 8 | V | A regra "doação aceita não fica disponível para outra ONG" tem teste automatizado em sequência **e** em paralelo. | `tests/doacoes.test.js` → `recusa aceitar uma doação que já foi aceita por outra ONG` e `aceita só uma de duas tentativas simultâneas` | sim |
| 9 | C | Cada stakeholder de `## Stakeholders` tem ao menos uma história ou decisão que o atende (doador → #1; ONG → #2, #6, #7, #8; voluntário → #3; Marta → #4; vigilância → #5 e regra de campos obrigatórios). | `docs/analise.md` → `## Stakeholders` × `## Histórias de usuário` | sim |
| 10 | C | Os três horários do experimento da hipótese (publicação, aceite, coleta) têm onde ser gravados no banco. | `docs/diagramas/dados.md`; `docs/analise.md` → `## Hipótese e experimento` | não — só `criada_em` existe (divergência declarada) |
| 11 | V | Cada integrante registrou o ensaio offline exigido pelo ADR 0002 antes da aula da demo. | `docs/demo.md` → `### Ensaio offline (ADR 0002)` | não — previsto para antes da demo da Unidade 3 |

### Fragilidades apontadas pelo revisor interno

> **Revisor interno:** [PREENCHER — nome do integrante que não escreveu este checklist].
> Ele lê só o repositório e comenta no PR do grupo. As duas fragilidades abaixo foram
> encontradas lendo o repositório e estão **pendentes de confirmação** do revisor no PR: ele
> confirma, troca ou acrescenta, e o texto daqui é atualizado com o link do comentário dele.

1. **Regra sem teste sob corrida.** "A regra central (aceite único) só era testada com dois
   aceites **em sequência**. O que a protege numa corrida de verdade é o
   `AND status = 'disponivel'` do `UPDATE`, e nada falhava se alguém o removesse. Com
   PostgreSQL e conexões concorrentes (ADR 0001), é justamente aí que a regra quebraria sem
   ninguém ver." — Fonte: `tests/doacoes.test.js`, `src/repositorio.js`.
   **Resposta da equipe: corrigida** no commit
   [`d642de7`](https://github.com/igorSeberino/g1126-template-prato-cheio/commit/d642de7552cdc6b810c18500899f8be7741f6059)
   (teste `aceita só uma de duas tentativas simultâneas`, que também mede o requisito
   não-funcional 2). Com ele a suíte passou de 7 para 8 testes: o "7 de 7" escrito nos
   critérios dos ADRs 0001 e 0002 passa a ser lido como "todos os testes da suíte, 8 de 8
   hoje". Não editamos os ADRs para isso, porque as seções originais não se reescrevem.

2. **Ponto único de falha no dia da demo.** "O ADR 0002 depende de os cinco notebooks terem
   o PostgreSQL 16 instalado e configurado igual ao `.env.example`, mas nada no repositório
   mostra que alguém já instalou: a tabela do ensaio offline em `docs/demo.md` está vazia, e
   o critério 11 está 'não'. Se o sorteado não tiver instalado, a demo para." — Fonte:
   `docs/adr/0002-postgresql-instalado-demo-offline.md`, `docs/demo.md`.
   **Resposta da equipe: aceita como limitação.** A migração e a instalação são da Unidade
   3; hoje não há o que instalar contra o código. Plano: cada integrante preenche a própria
   linha de `docs/demo.md` antes da aula da demo, e o critério 11 vira "sim" só quando as
   cinco linhas estiverem preenchidas. Se faltar alguém, outro integrante assume a demo com
   o próprio notebook (consequência já registrada no ADR 0002).

## Uso de IA

Nível declarado na Aula 8: **IA para consulta**. Nesta entrega, os rascunhos dos ADRs 0001
e 0002, do diagrama de dados, dos três requisitos não-funcionais, do checklist e da
Retrospectiva 2 foram gerados com IA (Claude Code), a partir da leitura do repositório
(`docs/analise.md`, `src/`, `tests/`, `.github/workflows/ci.yml`) e do aviso de mudança de
contexto dado em aula. **O que o grupo precisa conferir antes do merge:** os números dos
requisitos não-funcionais (3 s, 9 de 10), a escolha da instalação nativa no ADR 0002 e as
duas fragilidades, que só valem depois de confirmadas pelo revisor interno no PR.
