---
name: adr
description: Cria, substitui ou revisa um ADR (registro de decisão arquitetural) do Prato Cheio seguindo as regras da disciplina. Use quando um integrante pedir um ADR novo, quiser registrar uma decisão que custa caro reverter, ou precisar registrar num ADR existente o efeito de uma mudança de contexto.
---

# ADR — registro de decisão

Os ADRs ficam em `docs/adr/`. O formato completo, com as seções que a disciplina cobra, está
em [modelo.md](modelo.md). O `docs/adr/0000-modelo-adr.md` do repositório não tem a seção
`## Critério de validação`, mas ela é obrigatória.

## 1. Descobrir qual dos três casos é

| Caso | O que fazer |
|---|---|
| **Decisão nova** | Novo arquivo `docs/adr/NNNN-titulo-curto.md` (próximo número livre), seguindo o [modelo.md](modelo.md). |
| **A decisão muda** | No ADR antigo, troque **só** a linha de status para `- **Status:** substituído por ADR NNNN`. Nenhuma outra linha muda. O ADR novo tem `- **Substitui:** [ADR 000X](000X-....md)` no cabeçalho e diz o que mudou, **o que cai** e **o que continua valendo** do antigo. |
| **A decisão continua** | Acrescente no **fim** do mesmo ADR uma seção `## Revisão — DD/MM/AAAA` com o que mudou, por que a decisão continua e o que muda nas consequências e no critério de validação. |

As seções originais de um ADR **nunca** são editadas: o critério de validação 4 do
`docs/projeto.md` confere isso com `git log -p docs/adr/`. Se o ADR já foi substituído,
quem recebe a revisão é o ADR que o substituiu.

## 2. Juntar o material antes de escrever

- Leia `docs/analise.md`: `## Regras de negócio`, `## Stakeholders`, `## Riscos` e
  `## Objetivos de impacto`. Toda decisão precisa apontar para algo daqui.
- Leia os ADRs existentes e `docs/projeto.md` → `## Decisões de projeto`, para não
  contradizer nada sem dizer.
- Pergunte ao integrante os fatos que você não tem: aviso do professor, data, número,
  quem paga. **Não invente.** O grupo já teve que corrigir uma fala inventada pela IA.

## 3. Escrever (o que o professor cobra)

- **Contexto:** por que decidir e por que agora (ou por que só depois).
- **Alternativas:** duas ou mais **viáveis**, com prós e contras. "Ficar como está" entra
  quando faz sentido.
- **Decisão:** a escolhida e **por que não as outras**, uma por uma.
- **Consequências:** positivas, **negativas concretas com quem paga**, e riscos com o que
  fazer se der errado.
- **Rastreabilidade:** regra, restrição, risco ou objetivo da Análise, citando a seção.
- **Critério de validação:** o que precisa continuar igual e **qual comando ou teste mostra
  isso** (ex.: `npm test`; `git diff --stat <antes>..<depois> -- src/` listando só `src/db.js`).
- Escreva "todos os testes da suíte", nunca uma contagem ("7 de 7"), que envelhece.

## 4. Depois de escrever

- Liste o ADR na tabela de `docs/projeto.md` → `## ADRs` (ADR | Decisão | Status) e
  confira o limite de 4 páginas.
- Se a decisão muda o schema ou onde as coisas rodam, atualize o diagrama em
  `docs/diagramas/` ou declare a divergência lá.
- Abra um PR só para o ADR, com o **Uso de IA** preenchido, e peça revisão a outro integrante.
- Termine com as respostas curtas que quem defende vai precisar: por que esta alternativa,
  quem paga, como saberíamos que falhou.
