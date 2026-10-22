---
name: conferir-entrega
description: Confere uma entrega da disciplina (Trabalho N) cruzando o enunciado com o repositório do grupo e diz o que está pronto, o que falta e o que pode custar nota. Somente leitura. Use quando um integrante pedir para conferir a entrega, ver o que falta antes do prazo ou passar o checklist de correção.
---

# Conferir a entrega

**Somente leitura:** não faça checkout, commit, merge, push nem `npm install` na pasta de
trabalho de quem pediu. Para rodar os testes, use um clone separado.

## 0. Entrada

Peça o **enunciado do trabalho** (PDF ou texto). Sem ele, não há como conferir. Anote:
- cada etapa e o seu "Pronto quando";
- o checklist de correção ("Como é corrigido");
- as regras gerais: PR revisado, CI verde, limite de páginas, contribuição registrada de
  cada integrante, branch de entrega e prazo.

## 1. Estado do repositório

```bash
git fetch origin
git log --graph --format='%h %ad %an | %s' --date=short origin/main | head -60
git rev-parse --short origin/main origin/entrega-N   # a entrega aponta para a main?
```

Se o `git status` mostrar todos os arquivos como modificados só por fim de linha (CRLF),
rode os comandos com `git -c core.autocrlf=true ...`. Não é mudança real.

## 2. PRs, revisões e CI

```bash
gh pr list --state all --limit 50
gh pr view <N> --json number,title,author,baseRefName,headRefName,mergedBy,reviews,statusCheckRollup
```

Para cada PR, anote:
- o autor e quem aprovou;
- a base: PR mergeado numa branch intermediária, e não na `main`, pode não ter tido revisão;
- se o check `build-e-testes` ficou verde.

## 3. Etapa por etapa

Abra os arquivos que cada etapa exige e confira item a item, citando arquivo e PR:
- os nomes de seção do `docs/projeto.md` são **exatamente** os do template;
- os ADRs têm status, data, alternativas, consequências com quem paga, rastreabilidade e
  critério de validação com comando;
- os diagramas têm Pergunta, Decisão que sustenta e Situação, setas rotuladas e até 9
  elementos;
- as quantidades mínimas (decisões, cenários, critérios com fonte) estão atingidas;
- toda história tem teste com Dado/Quando/Então.

**Limite de páginas:** se houver `pandoc`, rode
`pandoc docs/projeto.md -f gfm -s -o /tmp/p.html` e imprima em PDF no navegador (A4).
Senão, estime: cerca de 450 palavras por página com tabelas.

## 4. Contribuição de cada integrante

```bash
git shortlog -sn <commit-da-entrega-anterior>..origin/main --no-merges
```

Some as aprovações e os merges de cada pessoa (passo 2) e compare com a tabela de
responsáveis e revisores do `README.md`. Quem não tem **nenhuma** contribuição registrada
perde a parcela do grupo: aponte isso com clareza.

## 5. Testes num clone separado

```bash
git clone <url-do-repo> /tmp/conferencia && cd /tmp/conferencia
git checkout entrega-N   # ou main
npm ci && npm test && npm start   # e testar /api/saude
```

## Formato da resposta

- Uma frase: a entrega está completa ou não, com o estado da branch de entrega e do CI.
- Tabela **Etapa | O que foi feito | PR**.
- **Pontos de atenção:** só o que pode custar nota, do mais grave para o menos grave.
- **O que falta fazer**, com o responsável e o prazo.
- Nunca invente revisor, data ou resultado: se não está no repositório nem no GitHub,
  diga "não encontrado".
