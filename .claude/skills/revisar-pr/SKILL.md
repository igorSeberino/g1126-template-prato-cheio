---
name: revisar-pr
description: Ajuda um integrante a revisar o PR de um colega no Prato Cheio. Roda os testes, passa o checklist do projeto e da disciplina e rascunha os comentários. Use quando alguém pedir para revisar, conferir ou aprovar um PR. Quem aprova é sempre o integrante, na conta dele; a IA não aprova nem faz merge.
---

# Revisar um PR

A regra da `main` exige a aprovação de **outro integrante**: revisão de IA não conta. Esta
skill prepara o revisor para ele mesmo decidir e poder explicar a revisão na defesa.

## 1. Pegar o PR

```bash
gh pr view <N>                 # descrição, autor, checks
gh pr diff <N>                 # o que muda
gh pr checkout <N>             # traz a branch para rodar localmente
```

Sem `gh`, use `git fetch origin` e depois `git diff origin/main...origin/<branch>`.

Leia a descrição inteira. O que ela promete é o que você confere.

## 2. Rodar

```bash
npm ci
npm test
npm start      # siga os passos de "Como verificar" do PR, na tela
```

Anote o resultado real: quantos testes passaram e o que você viu na tela.

## 3. Passar o checklist

Use o [checklist.md](checklist.md) item a item. Para cada problema, anote `arquivo:linha`,
o que está errado e uma sugestão concreta.

## 4. Rascunhar a revisão

Entregue ao integrante:

- **Veredito sugerido:** aprovar, ou pedir mudanças, com o motivo em uma frase.
- **Comentários:** em português, específicos e educados, cada um com arquivo, linha e
  sugestão. Separe o que **bloqueia** o merge do que é sugestão.
- **3 perguntas de entendimento** sobre o PR, com as respostas, para o revisor confirmar
  que entendeu. O professor pode perguntar "você revisou isso; por que está certo?".

## 5. O que o revisor faz (não a IA)

- Lê os comentários, ajusta o que achar necessário e posta pela conta dele.
- Aprova no GitHub (*Review changes → Approve*) só se concordar.
- O merge só acontece com a aprovação e o check `build-e-testes` verde. Um commit novo
  depois da aprovação derruba a aprovação, e a revisão precisa ser refeita.
