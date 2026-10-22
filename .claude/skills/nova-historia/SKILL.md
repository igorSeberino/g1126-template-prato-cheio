---
name: nova-historia
description: Implementa uma história de usuário ou correção de bug no Prato Cheio seguindo as regras do projeto. Escreve primeiro o teste Dado/Quando/Então, põe cada parte na camada certa, atualiza os documentos afetados e deixa o PR pronto. Use quando um integrante pedir para implementar uma história, funcionalidade ou correção.
---

# Nova história (ou correção)

Quem pediu vai **assinar e defender** o código. Trabalhe em passos pequenos e explique cada
decisão. Siga o `CLAUDE.md` da raiz.

## 0. Combinar o que será feito (antes de codar)

1. Ache a origem do pedido em `docs/analise.md`, em `## Histórias de usuário` e
   `## Critérios de aceite`, ou na lista de sugestões do enunciado do trabalho.
2. Escreva o critério de aceite no formato **Dado / Quando / Então**: um caminho feliz e
   pelo menos um caminho proibido.
3. Mostre o critério ao integrante e espere a confirmação. Se a história depende de algo
   que o caso não define (canal de aviso, autenticação, unidade de medida), pare e diga que
   isso pede uma **decisão** (ver passo 5).

## 1. Branch

```bash
git checkout main && git pull
git checkout -b historia/<nome-curto>   # ou fix/<nome-curto> para bug
```

Nunca commite na `main`. Ela é protegida e só aceita mudança por PR.

## 2. Teste primeiro (`tests/doacoes.test.js`)

- Crie um `describe` para a história, ou use um existente se a história for continuação.
- Ponha acima de cada `it(...)` o comentário `// Critério de aceite — História #N` com as
  três linhas Dado / Quando / Então.
- Use `request(app)` (Supertest) contra `criarApp()`. Para preparar um estado específico
  (ex.: `criada_em` no passado), use `query(...)` do `src/db.js`.
- Teste que depende de "hoje" ou "agora": use `congelarRelogio('AAAA-MM-DDTHH:MM:SSZ')`.
  Nunca use uma data fixa que vence sozinha.
- Rode `npm test` e **veja o teste novo falhar** antes de implementar.

## 3. Implementar por camada

| Camada | Arquivo | Regras |
|---|---|---|
| Regra de negócio | `src/doacoes.js` | Lance `ErroDeRegra` (vira 400) ou `NaoEncontrada` (vira 404). Valide entrada com `comoTexto()`. Dia e mês de Brasília. |
| SQL | `src/repositorio.js` | Só pela `query()` com `?`. Nada de `datetime()`/`now()`: horário entra como parâmetro. Regra de concorrência = escrita condicional (`UPDATE ... WHERE status = ...`). |
| Rota | `src/app.js` | Envolva com `rota(async (req, res) => ...)`. Sem regra de negócio aqui. |
| Tela | `public/index.html` | `textContent` (nunca `innerHTML` com dado do usuário), `avisar()` para resultado/erro, botão travado durante o envio. |
| Schema | `src/db.js` → `migrar()` | Coluna nova entra com `ALTER TABLE ... ADD COLUMN` só se ainda não existir. O banco do piloto tem doações reais: nunca `DROP` nem recriar a tabela. |

## 4. Conferir

```bash
npm test                                   # todos verdes
npm start                                  # testar o fluxo na tela, de preferência no celular
grep -rn "node:sqlite\|db.js" src/         # deve aparecer só em src/db.js, repositorio.js e server.js
```

## 5. Documentos afetados

- **Schema mudou?** Atualize `docs/diagramas/dados.md`: diagrama, tabela Hoje × Alvo,
  divergências e a linha **Situação** (`retrato da main no commit <hash>`).
- **Novo ator ou troca com o sistema?** Atualize `docs/diagramas/contexto.md`, com seta
  rotulada e no máximo 9 elementos.
- **A história pediu uma decisão?** Registre em `docs/projeto.md` → `## Decisões de projeto`,
  com 2 alternativas viáveis ligadas a um requisito ou risco da Análise. Se ela custa caro
  reverter, use a skill `adr`.
- **Mudou um não-funcional ou um critério de validação?** Atualize a linha em `docs/projeto.md`.
- `docs/projeto.md` tem no máximo 4 páginas. Não escreva contagem de testes ("7 de 7").

## 6. Commit e PR

- Mensagem em português, dizendo o que muda para o usuário ("Voluntário marca a doação
  como coletada (história #3)").
- PR com o template `.github/pull_request_template.md` todo preenchido. No **Uso de IA**,
  diga o que veio da IA e **pergunte ao integrante** o que ele conferiu ou mudou. Não invente.
- Peça revisão de **outro integrante**. O merge só acontece com aprovação e o check
  `build-e-testes` verde.

## 7. Explicar para quem vai defender

Termine com 5 tópicos curtos: o que mudou, por que nesta camada, qual teste prova, o que
ficou de fora e por quê, e uma pergunta provável do professor com a resposta.
