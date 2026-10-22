---
name: preparar-defesa
description: Prepara um integrante do Prato Cheio para a defesa individual de um trabalho. Descobre o que ele defende, monta perguntas prováveis com respostas tiradas do repositório e propõe treinos de modificação ao vivo. Use quando alguém pedir para se preparar para a defesa, apresentação ou arguição.
---

# Preparar a defesa individual

A defesa costuma ter três partes, e esta skill cobre as três: defender uma decisão ou ADR
que a pessoa ajudou a tomar, responder sobre **outra** parte do trabalho e fazer uma
pequena modificação ao vivo. Confira no enunciado o peso de cada uma.

## 1. Quem é e o que defende

- Pergunte o nome ou o usuário do GitHub.
- No `README.md`, procure a tabela de responsáveis (colunas "Responsável", "Revisor" e
  "Defende na Aula N").
- Liste os PRs e commits da pessoa:
  - `gh pr list --state all --author <usuario>`
  - `git log --author="<nome>" --oneline`

## 2. A parte que ela defende

Para cada decisão, ADR, não-funcional ou história dela, leia o artefato e escreva respostas
curtas, **tiradas do texto do repositório**, para:

1. Por que esta alternativa e não as outras?
2. Quem paga o custo da decisão?
3. Como saberíamos que falhou? Qual teste ou comando mostra isso?
4. Como a mudança de contexto afetou esta decisão?
5. O que veio da IA e o que o grupo mudou ou conferiu? Veja o `## Uso de IA` em
   `docs/projeto.md` e a descrição dos PRs.

Se o repositório não responde, escreva "não registrado" e sugira uma resposta honesta.
**Nunca invente** fato, número ou fala.

## 3. As outras partes

Faça um resumo de até 5 linhas de cada etapa que a pessoa **não** fez, com o arquivo onde
está. A pergunta sobre "outra parte do trabalho" sai daqui.

## 4. Inconsistências que o professor pode notar

Procure e aponte, com uma frase honesta de resposta para cada uma:
- a tabela do README diferente do GitHub (quem revisou, quem fez);
- números desatualizados nos documentos;
- critério de validação respondido "não";
- PR mergeado sem revisão.

## 5. Treino de modificação ao vivo

Proponha 3 mudanças pequenas e realistas, cada uma com arquivo, trecho, o que mudar e o
comando que prova que deu certo. Por exemplo:
- mudar uma mensagem de erro em `src/doacoes.js` e o teste que a confere;
- acrescentar uma validação simples com um teste Dado/Quando/Então;
- ajustar uma linha de critério de validação ou de não-funcional em `docs/projeto.md`.

A pessoa deve treinar num clone **fora** do OneDrive e descartar a mudança depois
(`git restore .`).

## Saída

Uma folha de cola de no máximo 2 páginas, em tópicos curtos, mostrada na conversa: a parte
dela com perguntas e respostas, o resumo das outras partes, as inconsistências com a
resposta e os 3 treinos. **Não salve a folha de cola no repositório.**
