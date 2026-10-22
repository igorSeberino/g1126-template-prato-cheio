# CLAUDE.md — Prato Cheio

Instruções para o Claude (e para qualquer integrante que o use) neste repositório.
O grupo responde por tudo o que entra aqui: cada mudança precisa poder ser **explicada e
defendida ao vivo** por quem a assina. Nível de IA da disciplina: **colaboradora**.

## O projeto

Conecta doadores de alimentos excedentes a ONGs. Piloto de um bairro, orçamento perto de
zero, doador e voluntário no celular com conexão instável (ver `docs/analise.md`).

- Node.js 22.13+, Express, SQLite embutido (`node:sqlite`); PostgreSQL só na Unidade 3
  (ADR 0001 e ADR 0002).
- `npm test` roda a suíte (Vitest + Supertest, SQLite em memória). `npm start` sobe em
  http://localhost:3000. `npm run db:migrar` cria o schema.
- Não trabalhe com o repositório dentro do OneDrive/Drive/Dropbox: o SQLite falha com
  `disk I/O error`.

## Arquitetura — o que mora onde

| Arquivo | Responsabilidade | Não pode |
|---|---|---|
| `src/db.js` | conexão, schema, `query()`, `limparBanco()` | — é o único que conhece o banco |
| `src/repositorio.js` | SQL, sempre via `query()` com `?` | regra de negócio; função de data do banco |
| `src/doacoes.js` | regras do caso; lança `ErroDeRegra` (400) ou `NaoEncontrada` (404) | importar `db.js` |
| `src/app.js` | rotas; traduz erro para HTTP em `responderErro` | regra de negócio; importar `db.js` |
| `public/index.html` | tela para celular | `innerHTML` com dado do usuário (use `textContent`) |

Regras que sustentam decisões registradas — quebrar qualquer uma muda um ADR ou um
critério de validação de `docs/projeto.md`:

- **SQL só pela `query()` do `src/db.js`, com `?`.** Nada de `datetime()`, `now()` ou outro
  dialeto fora do `db.js`: horários entram como parâmetro (não-funcional 3, ADR 0001).
- **Aceite único é garantido na escrita:** `UPDATE ... WHERE id = ? AND status = 'disponivel'`
  (decisão D1). Não troque por "ler e depois gravar".
- **`limparBanco()` só apaga o banco de teste (`:memory:`).** Nunca remova nem contorne essa
  trava (mudança de contexto, etapa 4b; ADR 0002 → `## Revisão — 20/10/2026`).
- Dia e mês são os de **Brasília (UTC−3)**; horários gravados em ISO 8601 (UTC).
- O horário da coleta é o **do evento** enviado pelo celular, entre a publicação e agora.

## Testes

- Toda história ou regra nova tem teste com o comentário **Dado / Quando / Então** acima do
  `it(...)`, no padrão de `tests/doacoes.test.js`.
- Não mude asserções de testes existentes para fazê-los passar. Se o comportamento mudou de
  propósito, diga isso no PR.
- Teste que depende de "hoje" ou "agora" usa `congelarRelogio(...)`; nada de data fixa que
  vença sozinha.
- Rode `npm test` antes de dizer que terminou e informe o resultado real.

## Documentação (Trabalho 2 em diante)

- `docs/projeto.md`: os nomes das seções são **exatamente** os do template; no máximo
  **4 páginas** (ADRs e diagramas ficam fora do limite).
- **ADR:** as seções originais **nunca** são editadas. Decisão que muda → o antigo recebe só
  `Status: substituído por ADR 000N` e o novo cita o antigo. Decisão que continua → entra
  `## Revisão — <data>` no fim do mesmo ADR. Novo ADR segue `.claude/skills/adr/modelo.md`
  (o `docs/adr/0000-modelo-adr.md` não tem a seção `## Critério de validação`, que é obrigatória).
- **Diagramas** (`docs/diagramas/`): começam com **Pergunta**, **Decisão que sustenta** e
  **Situação**; toda seta rotulada; no máximo 9 elementos. Mudou o schema → atualize
  `dados.md` ou declare a divergência com o `src/db.js`.
- Não escreva contagem que envelhece ("7 de 7 testes"): use "todos os testes da suíte".
- Não invente revisor, fala, data, número ou resultado. Só registre o que aconteceu.

## Fluxo de trabalho

1. Nunca commitar na `main` (ela é protegida). Branch `historia/<nome>`, `fix/<nome>` ou
   `docs/<nome>`.
2. PR com o template `.github/pull_request_template.md` preenchido, inclusive **Uso de IA**:
   o que veio da IA e o que o autor mudou ou conferiu.
3. Check `build-e-testes` verde e aprovação de **outro integrante**. Revisão de IA não conta.
4. O branch `entrega-N` congela a entrega: não commite nele depois do prazo.

## Skills do projeto (`.claude/skills/`)

Use a skill que corresponde ao pedido. Cada uma segue as regras deste arquivo.

| Skill | Quando usar |
|---|---|
| `nova-historia` | implementar uma história ou corrigir um bug, do teste ao PR |
| `adr` | criar, substituir ou revisar um ADR |
| `revisar-pr` | preparar a revisão do PR de um colega (quem aprova é o integrante) |
| `conferir-entrega` | conferir uma entrega contra o enunciado, sem alterar nada |
| `preparar-defesa` | montar a folha de cola da defesa individual |

## Como o Claude deve trabalhar aqui

- Explique cada mudança de forma que o autor do PR consiga defendê-la sozinho (por que esta
  alternativa, quem paga o custo, como saberíamos que falhou).
- Prefira mudanças pequenas, uma história ou um bug por PR.
- Antes de mexer em regra, leia `docs/analise.md` e `docs/projeto.md`; se a mudança pedir uma
  decisão nova, proponha o registro em `## Decisões de projeto` ou num ADR.
- Mensagens, comentários e documentação em português.
