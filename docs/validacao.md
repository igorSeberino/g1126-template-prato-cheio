# Validação — Prato Cheio

*Trabalho 3 · confronto do produto com os critérios de aceite escritos na Unidade 1*

Critérios copiados sem reescrever de `docs/analise.md` → *Critérios de aceite* (histórias #1, #2,
#6 e #7). Status: **atende / parcial / não atende / não verificável**.

Evidências usadas (outra pessoa confere):

- **Testes:** `tests/doacoes.test.js`, nome do `it(...)` entre aspas.
- **Demo:** passo de `docs/demo.md` → *Passo a passo reproduzível*.
- **CI da `main`:** execução verde no commit `be4f5bd` (merge do PR #31), 37 testes em PostgreSQL:
  <https://github.com/igorSeberino/g1126-template-prato-cheio/actions/runs/43469326727>

| # | Critério de aceite (da Unidade 1) | Atende? | Evidência |
|:--:|---|:--:|---|
| 1 | **#1** — Dado que os campos tipo, quantidade e validade estão todos preenchidos, quando o doador publica a doação, então ela passa a aparecer na lista de doações disponíveis. | atende | Teste "mostra a doação publicada na lista de disponíveis"; demo, passo 2 (*Arroz — 10 kg (até 2026-11-30)* aparece em "Doações disponíveis"); CI da `main`. |
| 2 | **#1** — Dado que a doação foi enviada sem um dos campos obrigatórios, quando o doador tenta publicar, então o sistema recusa a publicação e informa qual campo está faltando. | atende | Teste "recusa doação sem os campos obrigatórios" (400 e a mensagem cita `validade`); demo, passo 7 (*campos obrigatórios ausentes: quantidade* e nada entra na lista); CI da `main`. |
| 3 | **#2** — Dado que existem duas doações publicadas em momentos diferentes e nenhuma foi aceita ainda, quando a ONG abre a lista de doações disponíveis, então as duas aparecem da mais antiga para a mais recente. | atende | Teste "lista as doações na ordem de publicação" (Arroz antes de Feijão); demo, passo 3 (*Arroz* antes de *Leite*); CI da `main`. |
| 4 | **#6** — Dado que existe uma doação publicada e ainda não aceita, quando a ONG a aceita, então a doação deixa de aparecer na lista de disponíveis e passa a constar como aceita por essa ONG. | atende | Testes "marca a doação como aceita pela ONG" (status `aceita`, `ong` = ONG A) e "remove a doação da lista de disponíveis depois de aceita"; demo, passo 4 (Arroz sai de "Doações disponíveis" e aparece *aceita por Casa Esperança*); CI da `main`. |
| 5 | **#6** — Dado que uma doação já foi aceita por uma ONG, quando uma segunda ONG tenta aceitar a mesma doação, então o sistema recusa a segunda tentativa e a doação continua registrada para a primeira ONG. | parcial | A recusa está provada: testes "recusa aceitar uma doação que já foi aceita por outra ONG" (400) e "aceita só uma de duas tentativas simultâneas" (um 200 e um 400); CI da `main`. A segunda metade ("continua registrada para a primeira ONG") **não é conferida** por nenhum teste nem pela demo — ver abaixo. |
| 6 | **#7, fatia 1** — Dado que existem doações disponíveis de tipos variados, quando a ONG pede a lista com `?tipo=Sopa`, então só as do tipo Sopa aparecem, na ordem de publicação. | atende | Testes "mostra só as doações do tipo filtrado" e "mantém a ordem de publicação dentro do tipo filtrado" (mais os de limite: "não mostra doação do tipo filtrado que já foi aceita", "tipo sem nenhuma doação disponível devolve lista vazia", "não mostra doação vencida do tipo filtrado"); CI da `main`. Fora da demo (a tela não usa o filtro). |
| 7 | **#7, fatia 2** — Dado uma doação do tipo "Pão", quando a ONG filtra por "pao", então ela aparece. | não atende | Nenhum teste. O filtro compara o texto exato: `src/repositorio.js`, `listarDisponiveis` usa `WHERE ... tipo = $1`, então `?tipo=pao` não encontra "Pão" — ver abaixo. |
| 8 | **#7, fatia 3** — Dado que a ONG está na tela de doações disponíveis, quando escolhe um tipo, então a lista mostra só as daquele tipo. | não atende | `public/index.html` não tem campo de tipo na lista nem chama `?tipo=`; `docs/demo.md` → *O que falta, dito na demo*: "a tela ainda não o usa". Nenhum teste. |

**Resumo:** 5 atendem, 1 parcial, 2 não atendem, 0 não verificáveis.

## Critérios que não atendem — por quê

**Critério 5 (parcial) — "continua registrada para a primeira ONG".**
- *O que falta:* um teste que, depois da recusa da ONG B, leia a doação e confira `ong = 'ONG A'`.
  O código protege isso (o aceite é um `UPDATE ... WHERE status = 'disponivel'`, decisão D1 de
  `docs/projeto.md`, então a segunda escrita não altera nada), mas o teste atual só confere o
  status 400 da segunda tentativa. Sem a asserção, uma mudança que gravasse a ONG B e ainda
  devolvesse 400 passaria no CI.
- *Por que ficou de fora:* o teste foi escrito na iteração 1 olhando para a recusa (o caminho
  proibido) e a segunda metade do critério não virou asserção.
- *O que seria preciso:* acrescentar a leitura da doação e o `expect(...ong).toBe('ONG A')` ao teste
  "recusa aceitar uma doação que já foi aceita por outra ONG". Hoje a API não tem `GET /api/doacoes/:id`;
  dá para conferir por `GET /api/doacoes/aceitas`, a lista "Aguardando coleta" que a tela usa no
  passo 4 da demo.

**Critério 7 (não atende) — filtro sem diferença de maiúsculas e acentos.**
- *O que falta:* normalizar o tipo antes de comparar. O filtro da fatia 1 compara o texto
  exato no banco.
- *Por que ficou de fora:* a Aula 11 entregou só a fatia 1 (PRs #18, #21 e #22); as fatias 2 e 3
  entraram no `analise.md` no mesmo dia (commit `b3caba8`, 29/10) como próximas fatias, sem
  implementação. Depois disso a prioridade foi a migração para PostgreSQL (Aula 12).
- *O que seria preciso:* comparar com a mesma normalização que o relatório já usa para o nome da
  ONG (`src/doacoes.js`: minúsculas + `normalize('NFD')` sem acentos) ou, no PostgreSQL, com a
  extensão `unaccent` + `lower()`; e um teste "Pão" × `?tipo=pao`.

**Critério 8 (não atende) — filtro na tela.**
- *O que falta:* um campo (ou lista de tipos) em "Doações disponíveis" que chame
  `GET /api/doacoes?tipo=...`, e um teste ou passo de demo que o exercite.
- *Por que ficou de fora:* mesma razão do critério 7 — só a fatia 1 (API) foi priorizada; a tela
  ficou como "o que falta" no roteiro da demo.
- *O que seria preciso:* o campo na tela, um passo novo em `docs/demo.md` e, se possível, depois do
  critério 7 (senão a ONG que digita "pao" na tela não acha o pão).

## Pendente de decisão do grupo

A issue #29 pede para decidir com o grupo; **não decidido nesta entrega**, só registrado:

- **Histórias #3 (coleta), #4 (relatório da Marta) e o cancelamento pelo doador (D4)** estão
  implementadas e testadas (`describe` "voluntário marca a doação como coletada", "relatório mensal
  da Marta (história #4)" e "doador cancela uma doação disponível (decisão D4)"), mas **não têm
  critério de aceite** no `analise.md`. Por isso não entraram na tabela: validá-las exigiria
  escrever o critério agora, depois de pronto, o que inverteria o processo.
- **Horário do aceite** (critério 8 de `docs/projeto.md`) consta como *Falta* no README: o banco grava
  `criada_em` e o horário da coleta, mas não o do aceite. O experimento da hipótese
  (`analise.md`) precisa desse horário para medir *publicação → aceite*.

## Mudanças de critério ao longo do semestre

- **História #7 ganhou critérios só na Aula 11** (commit `b3caba8`, 29/10). Na Unidade 1 ela tinha
  apenas o Dado/Quando/Então da coluna "Ação corretiva" das histórias. Ao dividir em três fatias,
  escrevemos critério para as três, mas implementamos uma. Aprendizado: critério de fatia que não
  vai ser feita na iteração vira "não atende" na validação — teria sido mais honesto marcá-las
  como próximas fatias, sem critério ainda.
- **O aceite passou a exigir o nome da ONG** (decisão D2, PR #8). O critério 4 diz "aceita por
  essa ONG"; antes da D2 o servidor gravava `'ONG'` genérico quando o nome não vinha, o que
  tornava o critério verdadeiro só no papel. O critério não mudou de texto, mas só passou a ter
  sentido depois da D2 (teste "recusa o aceite sem o nome da ONG e a doação continua disponível";
  demo, passo 6).
- **Nenhum critério da Unidade 1 se mostrou impossível.** O critério 5 mostrou que um critério com
  duas consequências ("recusa" **e** "continua com a primeira") precisa de uma asserção para cada.

## Uso de IA

- **O que a IA fez:** o Claude (Claude Code) leu `docs/analise.md`, `tests/doacoes.test.js`,
  `docs/demo.md`, `public/index.html` e `src/repositorio.js`, cruzou cada critério com o teste e o
  passo da demo, e redigiu este arquivo com uma proposta de status para cada linha. Foi ele quem
  apontou que o filtro compara o texto exato (critério 7) e que o teste do critério 5 não confere a
  primeira ONG.
- **O que foi verificado:** cada nome de teste citado existe em `tests/doacoes.test.js`; o link do CI
  é a execução verde da `main` no commit `be4f5bd`; os textos da demo foram copiados de
  `docs/demo.md`.
- **O que a IA não decidiu:** o status final de cada linha é do grupo, na revisão deste PR; a seção
  *Pendente de decisão do grupo* ficou aberta de propósito.
