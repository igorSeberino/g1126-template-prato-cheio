# Checklist de revisão — Prato Cheio

Marque cada item: ✅ ok · ❌ problema (com `arquivo:linha`) · — não se aplica.

## Escopo e descrição
- [ ] O PR faz uma coisa só (uma história, um bug ou um documento).
- [ ] Título e descrição batem com o diff; "Como verificar" funciona como está escrito.
- [ ] **Uso de IA** preenchido: o que veio da IA e o que o autor mudou ou conferiu.

## Testes
- [ ] `npm test` passa localmente e o check `build-e-testes` está verde no PR.
- [ ] Cada critério novo tem teste com o comentário Dado / Quando / Então.
- [ ] Nenhuma asserção antiga mudou só para passar. Se mudou de propósito, a descrição explica.
- [ ] Teste que depende de "hoje" ou "agora" usa `congelarRelogio(...)`, sem data que vence sozinha.

## Arquitetura (`CLAUDE.md` → "Arquitetura — o que mora onde")
- [ ] Regra de negócio só em `src/doacoes.js`, com `ErroDeRegra` (400) ou `NaoEncontrada` (404).
- [ ] SQL só em `src/repositorio.js`, pela `query()` com `?`, sem concatenar texto do usuário.
- [ ] Nenhuma função de data do banco (`datetime()`, `now()`) fora do `src/db.js`.
- [ ] `grep -rn "node:sqlite\|db.js" src/` mostra só `src/db.js`, `repositorio.js` e `server.js`.
- [ ] Rotas novas em `src/app.js` usam `rota(...)`.
- [ ] Tela: dado do usuário entra com `textContent`, nunca `innerHTML`; o botão trava durante o envio.

## Regras do caso que não podem quebrar
- [ ] Aceite único continua sendo uma escrita condicional (`UPDATE ... WHERE ... status = 'disponivel'`).
- [ ] A trava do `limparBanco()` (só `:memory:`) continua lá e com teste.
- [ ] Dia e mês são os de Brasília; horários gravados em ISO 8601.
- [ ] Doação vencida não aparece nem pode ser aceita; o horário da coleta fica entre a publicação e agora.

## Banco e diagramas
- [ ] Schema mudou → `migrar()` acrescenta a coluna sem apagar dados (o piloto tem doações reais).
- [ ] Schema mudou → `docs/diagramas/dados.md` atualizado (diagrama, divergências, linha Situação).
- [ ] Diagrama novo ou alterado: Pergunta, Decisão que sustenta e Situação; setas rotuladas; até 9 elementos.

## Documentos
- [ ] ADR: só a linha de Status mudou, ou a `## Revisão — <data>` entrou no fim. Seções originais intocadas.
- [ ] `docs/projeto.md`: nomes de seção iguais ao template e ainda dentro de 4 páginas.
- [ ] Nenhuma contagem que envelhece ("7 de 7 testes") e nenhum fato inventado (revisor, data, número).
