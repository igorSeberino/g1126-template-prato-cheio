# Trabalho 2 — pacotes prontos (entrega quinta, 22/10)

Cada pacote é um `.patch` que **você aplica e commita da sua conta**. Assim a contribuição fica registrada no seu nome, como o enunciado exige. Cada patch foi testado em sequência: todos aplicam sem conflito e a suíte termina com **13 testes verdes**.

**A ordem importa.** Cada patch foi gerado em cima do anterior, então só comece o seu quando o passo anterior estiver na `main`.

| Passo | Quem | O quê | Revisor |
|:--:|---|---|---|
| 1 | Renato | Aprovar o PR #2 do Igor | — |
| 2 | Igor | Fechar o PR #3 (versão concorrente) e mergear o #2 | Renato |
| 3 | Renato | Mergear #4 → #5 → #6, depois da aprovação do Adrian | Adrian |
| 4 | Gabriel | Patch 1 (coletada), depois patch 2 (ONG obrigatória) | Igor |
| 5 | Adrian | Patch de diagramas e Uso de IA | Gabriel |
| 6 | Igor | Patch que enxuga o `projeto.md` e completa o README | Renato |
| 7 | Gabriel | Conferência (checklist no fim deste arquivo) | — |
| 8 | Igor | Criar o branch `entrega-2` | Gabriel confere |
| 9 | Todos | Colar no Teams o repositório e o branch | — |

## Como aplicar um pacote (igual para todos)

Os patches estão no branch `pacotes-trabalho-2` do próprio repositório (ele nunca é mergeado). Na pasta do repositório clonado — **no Windows, use o Git Bash, não o PowerShell** (o PowerShell estraga os acentos do patch):

```bash
git checkout main && git pull
git fetch origin pacotes-trabalho-2
git checkout -b <nome-do-branch>
git show origin/pacotes-trabalho-2:<arquivo>.patch | git apply --3way
npm test                      # tem que passar tudo
git add -A
git commit -m "<mensagem>"
git push -u origin <nome-do-branch>
```

Depois, no GitHub: abrir o PR para `main`, preencher o template, pedir revisão ao revisor da tabela, esperar o CI verde e a aprovação, e fazer o merge.

---

## Gabriel — duas histórias novas (revisor: Igor)

**Patch 1 — `gabriel-1-coletada.patch`**
- Branch: `historia/voluntario-marca-coletada`
- Commit: `Voluntário marca a doação como coletada (história #3)`
- O que faz: coluna `coletada_em` (bancos antigos ganham a coluna sem perder dados), rotas `GET /api/doacoes/aceitas` e `POST /api/doacoes/:id/coletar`, seção "Aguardando coleta" na tela e diagrama de dados atualizado. Entram 3 testes:
  - doação aceita vira coletada;
  - grava o horário do evento, não o da sincronização;
  - recusa coletar uma doação ainda não aceita.

**Patch 2 — `gabriel-2-ong-obrigatoria.patch`** (só depois do patch 1 estar na main)
- Branch: `historia/ong-se-identifica-no-aceite`
- Commit: `ONG informa o nome no aceite (decisão D2)`
- O que faz: implementa a D2. O aceite sem nome da ONG é recusado, o servidor para de gravar `'ONG'` por padrão e a tela pede o nome. Entra 1 teste.

**Na defesa:**
- Por que guardar o horário que vem do celular? Porque o voluntário está na rua com conexão instável (história #3). O horário que importa é o da coleta, não o da sincronização.
- Por que `coletada_em` chega como parâmetro, e não com `datetime('now')`? Por causa do não-funcional 3: SQL de dialeto fica só no `db.js`, senão a migração para PostgreSQL vaza para o resto.
- Como saberiam que falhou? Pelo teste "recusa marcar como coletada uma doação que ainda não foi aceita". O `AND status = 'aceita'` do `UPDATE` garante isso no banco.

## Adrian — diagramas e Uso de IA (revisor: Gabriel)

**`adrian-diagramas-uso-de-ia.patch`** (depois dos dois do Gabriel)
- Branch: `docs/diagramas-e-uso-de-ia`
- **Antes do commit**, troque `<hash>` pelo commit atual da main nos dois diagramas:
  `sed -i "s/<hash>/$(git rev-parse --short HEAD)/" docs/diagramas/contexto.md docs/diagramas/dados.md`
  (ou troque à mão pelo resultado de `git rev-parse --short HEAD`)
- Commit: `Diagrama de contexto, divergências do diagrama de dados e Uso de IA unificado`
- O que faz:
  - cria `docs/diagramas/contexto.md`: 6 elementos, toda seta rotulada, com a vigilância sanitária;
  - completa o cabeçalho do `dados.md` (Pergunta, Decisão que sustenta e Situação) e as 3 divergências com o `src/db.js`;
  - reescreve `## Diagramas` e `## Uso de IA` no `projeto.md`, com 3 erros da IA corrigidos;
  - remove a seção de "fragilidades" que a IA atribuiu a um revisor inexistente.

**Na defesa:**
- As 3 divergências: `status` sem `CHECK`, `ong` aceitando nulo, e datas em `TEXT` com dois formatos.
- Por que a vigilância sanitária entra no contexto: ela exige tipo, quantidade e validade e recebe o registro em fiscalização.
- Um erro da IA: ela inventou falas de um "revisor interno" que ainda não tinha revisado.

## Igor — texto final e entrega (revisor: Renato)

**`igor-enxuga-projeto-e-readme.patch`** (por último, depois do Adrian)
- Branch: `docs/enxuga-projeto`
- Commit: `Enxuga o projeto.md para o limite de 4 páginas e registra responsáveis por etapa`
- O que faz:
  - reescreve curto as Decisões D1–D3, a tabela de trade-offs, os ADRs, os não-funcionais (no formato "Quando…, o sistema…, medido por…. Isso muda…, a um custo de…") e os critérios (11, com fonte). As seções do Adrian ficam intactas;
  - renderizado em A4, o documento dá **3 páginas**;
  - o README ganha a tabela de responsável e revisor por etapa (etapa 0).
- Depois do merge, a entrega:
  ```bash
  git checkout main && git pull
  git checkout -b entrega-2
  git push -u origin entrega-2
  ```

**Na defesa:**
- Por que a D2 ficou com a alternativa A, se a B ganha em confiabilidade? Porque o piloto é de um bairro só e o nome declarado é conferível fora do sistema. A condição de disparo para mudar para B: mais de 2 nomes inválidos em 10 doações.
- Proteção da main: só entra mudança por PR revisado e com o CI `build-e-testes` verde.

## Renato — já está no GitHub

- **PR #4:** ADRs 0001/0002, não-funcionais e critérios (Aula 8). Já integra o #2, então não tem conflito.
- **PR #5:** história 4b. A limpeza recusa qualquer banco que não seja `:memory:`.
- **PR #6:** 4a e 4c. Revisão do ADR 0002 e o critério novo (no texto final é o critério 9). A base é o branch do #4: quando o #4 for mergeado e o branch apagado, a base vira `main` sozinha.

**Na defesa:**
- A causa do incidente: o `src/db.js` cai em `dados.sqlite` quando o `vitest.config.js` não é aplicado, e o `limparBanco()` não conferia o banco.
- Por que o ADR 0002 continua: ele decide *onde* o PostgreSQL roda, e contêiner ou banco gerenciado não evitariam o incidente.
- O que muda na migração: no PostgreSQL não existe `:memory:`. A proteção vira banco de teste separado mais a conferência de `current_database()`.
- Quem paga: cada integrante, com um segundo banco no notebook.

---

## Conferência (Gabriel, depois do passo 6) — olhando só o repositório

- [ ] ADR 0001 tem Contexto (por que migrar e por que só na U3), Alternativas (incluindo ficar em SQLite e como subir o PostgreSQL), Decisão, Consequências (com quem paga), Rastreabilidade, Critério de validação, Status e Data.
- [ ] ADR 0002 termina com `## Revisão — 20/10/2026`, e nenhuma seção original foi editada.
- [ ] `docs/diagramas/contexto.md` e `dados.md` começam com Pergunta, Decisão que sustenta e Situação (com hash de verdade, não `<hash>`).
- [ ] O diagrama de contexto tem no máximo 9 elementos, toda seta rotulada e a vigilância sanitária.
- [ ] `## Diagramas` traz os dois links e as 3 divergências.
- [ ] 3 decisões com 2 alternativas cada e origem na Análise, e uma tabela de trade-offs.
- [ ] 3 não-funcionais com "Quando…, o sistema…, medido por…", decisão afetada e custo; um deles nasce do celular ou da conexão instável.
- [ ] 6 ou mais critérios com fonte, pelo menos um sobre a migração.
- [ ] Mudança de contexto: revisão do ADR (4a), história com teste na main (4b) e critério (4c).
- [ ] Todas as histórias entraram por PR revisado com CI verde.
- [ ] `docs/evidencias/protecao-main.md` existe na main.
- [ ] `## Uso de IA` diz o que veio da IA e traz pelo menos um erro corrigido.
- [ ] `docs/projeto.md` cabe em 4 páginas.
- [ ] Cada integrante tem pelo menos um commit ou PR no Trabalho 2.
