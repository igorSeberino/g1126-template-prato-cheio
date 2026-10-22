# ADR NNNN — <decisão em uma frase>

- **Data:** DD/MM/AAAA
- **Status:** proposto | aceito | substituído por ADR NNNN
- **Substitui:** [ADR 000X](000X-titulo.md) <!-- só se substituir outro; senão, apague a linha -->

## Contexto

Qual problema exige a decisão? Por que agora (ou por que só depois)?
Que restrições pesam? Exemplos do caso: orçamento perto de zero, celular com conexão
instável, piloto de um bairro só, PostgreSQL na Unidade 3.

## Alternativas consideradas

1. **Alternativa A**
   - Prós:
   - Contras:
2. **Alternativa B**
   - Prós:
   - Contras:
<!-- "Ficar como está" é uma alternativa válida quando faz sentido. -->

## Decisão

O que foi decidido.

Por que não as outras:
- **A:** …
- **B:** …

## Consequências

- **Positivas:**
- **Negativas / o que abrimos mão:** cada uma com **quem paga** (qual integrante, usuário ou etapa).
- **Riscos e o que fazer se der errado:**

## Rastreabilidade

- Regra, restrição, risco ou objetivo de `docs/analise.md` (cite a seção) que esta decisão atende.

## Critério de validação

**O que precisa continuar igual:** …

**Como se mostra:** os comandos ou testes, por exemplo:
1. `npm test` com todos os testes da suíte passando.
2. `git diff --stat <commit-antes>..<commit-depois> -- src/` listando só os arquivos esperados.

<!--
Mudança de contexto depois do ADR aceito e a decisão continua? Não edite as seções acima.
Acrescente no fim:

## Revisão — DD/MM/AAAA

**O que mudou.** …
**A decisão continua: …** porque …
**O que muda nas consequências e no critério de validação:** …
**Rastreabilidade:** …
-->
