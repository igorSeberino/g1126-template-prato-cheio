# Retrospectiva da Iteração 1

- **Data:** 27/08/2026 · **Grupo:** g1126 — Prato Cheio

## O que decidimos nesta iteração
<!-- 2 a 3 decisões que tomamos, não tarefas que fizemos. -->

- **Recorte da história zero:** fatia mínima (publicar → listar → aceitar), sem
  autenticação e sem tela de confirmação antes do aceite. Registrado em
  `docs/analise.md` → `## Decisão de análise`.
- **Proteção contra aceite duplo no banco:** em vez de checar no código e depois gravar,
  o `UPDATE doacoes SET status = 'aceita' ... WHERE id = ? AND status = 'disponivel'`
  garante na própria escrita que duas ONGs não aceitem a mesma doação.
- **"Ordem de publicação" = ordem do `id`:** `SELECT ... ORDER BY id` em vez de criar um
  campo de ordenação dedicado; o `id` autoincremento já reflete a ordem em que as doações
  entraram.

## O que funcionou

- O template já entregava `src/db.js` e `src/app.js` prontos — só as duas camadas
  (`repositorio.js` e `doacoes.js`) precisaram de código.
- Os `it.todo` de `tests/doacoes.test.js` serviram de backlog: cada critério de aceite do
  `analise.md` virou um `it()` de verdade, um para um.
- SQLite em memória (`DATABASE_FILE=:memory:`) deixou os testes rápidos e sem sujar o
  banco de desenvolvimento.

## O que mudaríamos

- Ter começado o código logo depois da Aula 3, em vez de deixar o walking skeleton para a
  véspera da entrega da Aula 4.
- PRs menores e mais frequentes, em vez de um PR grande com skeleton + documentação juntos.

## Próximos passos (para a próxima iteração)

- Preencher as seções ainda vazias de `docs/analise.md` (`## Problema central`,
  `## Incertezas`, `## Stakeholders`, `## Objetivos de impacto`, `## Regras de negócio`)
  — necessárias para o `entrega-1`.
- Criar o branch `entrega-1` em 03/09 e preparar a defesa individual + Prova 1.
- Rodar o experimento da hipótese (planilha de 10 doações, horários publicação/aceite/coleta).
- Confirmar com o professor a seção `## Conflitos de prioridade` citada no enunciado da
  Aula 4 — ela não existe no template do grupo.

## Autoavaliação de contribuição
Distribuam 100 pontos entre os integrantes conforme a contribuição desta iteração
(inclui código, análise, documentação, revisão de PR). Cada integrante assina.

| Integrante | Pontos | O que fez de mais relevante |
|---|:--:|---|
| Adrian Cesar Gonçalves |  |  |
| Diego Nessler |  |  |
| Gabriel Carvalho |  |  |
| Igor Thiago Seberino |  |  |
| Renato Colin Neto |  |  |

**Total: 100**
