# Aula 13 — divisão por integrante

*Arquivo de trabalho do grupo. Apagar do PR da entrega se não quiserem entregá-lo.*

Entrega do encontro: **um PR** (branch `entrega/aula-13`) com `docs/demo.md`, `docs/validacao.md`
e `docs/retrospectivas/3.md`, revisado por quem não o escreveu, com CI verde.
Cada integrante entrega no Teams até 23h59: link do repositório, link do PR e **um commit seu de hoje**.

## Estado de partida (conferido em 12/11)

- `main`: 36 testes passando (SQLite). Ainda **sem** PostgreSQL.
- PR #23 (migração para PostgreSQL, Igor): CI verde, aprovado, mergeável.
- PR #24 (`docs/refatoracoes.md`, Adrian): CI verde, **aguarda revisão** de quem não é o Adrian.
- README ainda diz "banco SQLite / PostgreSQL depois"; o #23 não o altera.
- A demo é offline, em notebook sorteado, com PostgreSQL instalado (ADR 0002).

## Ordem

Faixa A: A1 → A2 → A3 → A4. Faixa B: B1 → B2 → B3.

| Pessoa | Tarefa | Seu commit de hoje |
|---|---|---|
| **Gabriel** | Revisar o #24 (A1). Escrever `docs/demo.md` (A3). | `docs/demo.md` |
| **Igor** | Executar o roteiro da demo sem ajuda (A4). Registrar o "Testado por". | ajuste no `docs/demo.md` (Testado por) |
| **Adrian** | Integrar os PRs, um por vez (A1). Montar o PR da entrega (B3). | merge dos PRs e `docs/retrospectivas/3.md` (abertura) |
| **Diego** | Clone limpo (A2): subir o produto só pelo README. Corrigir o README. | `README.md` |
| **Renato** | `docs/validacao.md` (B1). | `docs/validacao.md` |

Todos: sua linha da autoavaliação em `docs/retrospectivas/3.md` (B2) e o ensaio cruzado (B3).

## Passo a passo

### Adrian
1. Pedir a revisão do #24 a Gabriel ou Renato (o autor não revisa o próprio PR).
2. Ordem: **#23** (código) primeiro, depois **#24** (só documento).
3. Em cada um: atualizar a branch, CI do PR verde, revisão, merge, conferir o CI da `main`.
4. Se a `main` ficar vermelha, parar: ninguém integra até consertar ou reverter.
5. Settings → Branches: "Require branches to be up to date before merging".
6. Abrir `docs/retrospectivas/3.md` a partir do `modelo.md`; no fim, abrir o PR da entrega.

### Diego (não pode ter escrito o README)
1. Depois do #23 na `main`, clonar numa pasta nova fora do OneDrive.
2. Seguir só o README: instalar o PostgreSQL 16, `.env` a partir do `.env.example`, `npm install`,
   `npm run db:migrar`, `npm start`, `npm test`.
3. Anotar cada passo em que o README falha (hoje ele fala em SQLite).
4. Corrigir o README (banco, `DATABASE_URL`, como subir o PostgreSQL, ADR 0002) em PR pequeno.

### Gabriel
1. Revisar o #24: cada refatoração tem motivo, o que mudou e testes antes/depois com número real.
2. Escrever `docs/demo.md`:
   - "Antes de começar": PostgreSQL local (ADR 0002), `.env`, `npm install`, `npm run db:migrar` (banco limpo), `npm start`, navegador em modo celular, **sem internet**.
   - Passo a passo: ação exata → resultado esperado, com dados concretos. Fluxo: doador publica, ONG vê, ONG aceita e a doação sai da lista, ONG vê em "Minhas aceitas".
   - Um caso de erro com a mensagem real (por exemplo, aceitar uma doação já aceita).
   - "O que falta e por quê" com um limite real.

### Igor (não pode ter escrito o roteiro)
1. Executar o `docs/demo.md` no modo celular, sem perguntar nada ao Gabriel.
2. Corrigir ou pedir a correção de cada passo em que travar; executar de novo.
3. Preencher "Testado por: Igor Thiago Seberino, em <data>" e o que mudou depois do teste.

### Renato
1. Copiar **sem reescrever** todos os critérios de `docs/analise.md`: histórias #1 (2), #2 (1), #6 (2) e #7 (3 fatias) — 8 critérios.
2. Para cada um: status (atende / parcial / não atende / não verificável) e evidência (nome do teste, passo da demo, link do CI da `main`). "Testado" não vale.
3. Conferir se existe critério sem teste ou teste que só confere o status HTTP.
4. Preencher "Critérios que não atendem", "Mudanças de critério" e "Uso de IA".
5. Pendência conhecida: o README lista "gravar o horário do aceite" (critério 8 de `docs/projeto.md`) como falta.
   Se não foi feito, declarar.
6. Atenção: as histórias #3, #4 e o cancelamento estão implementados, mas **não** têm critérios no `analise.md`.
   O quadro copia só o que lá está; o grupo decide se registra isso em "Mudanças de critério".

### Todos
1. **Retrospectiva 3**: cada um escreve a própria linha (pontos, o que fez, link de PR ou commit); soma 100.
   Decisões = escolha + porquê. "O que mudaríamos" = um fato da iteração. Próximos passos até 03/12 com dono e data.
2. **Ensaio cruzado** (10 min): cada um explica em 2 min uma parte que não escreveu. Anotar quem travou e o que estudar.
3. **Teams**: repositório, PR da entrega, seu commit de hoje.

## IA

Pode ajudar em conflito de merge, sugerir o caso de erro e procurar "atende" sem evidência.
Não decide status nem escreve a retrospectiva ou a autoavaliação. Registrar em `docs/validacao.md` → Uso de IA.
