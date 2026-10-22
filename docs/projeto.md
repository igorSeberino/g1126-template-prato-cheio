# Documento de Projeto — Prato Cheio

*Trabalho 2 · máximo 4 páginas (fora diagramas) · entrega na Aula 10*

## Decisões de projeto

| # | Decisão | Alternativas | Requisito/risco da Análise que a motiva |
|---|---|---|---|
| D1 | Como o sistema garante que uma doação aceita não fique disponível para outra ONG | **A** — guarda atômica na própria escrita: `UPDATE ... WHERE id = ? AND status = 'disponivel'`, decidindo pelo número de linhas alteradas · **B** — transação explícita serializando leitura e escrita (`BEGIN IMMEDIATE` no SQLite, `SELECT ... FOR UPDATE` no PostgreSQL) | **Regra de negócio central:** "uma doação aceita por uma ONG não pode ficar disponível para outra ONG — garantida de forma atômica no banco, não apenas checada no código". Também o 2º critério de aceite da História #6 (a segunda ONG é recusada). |
| D2 | Como a ONG se identifica no momento do aceite | **A** — campo `ong` obrigatório no corpo de `POST /api/doacoes/:id/aceitar`, texto declarado e sem autenticação · **B** — cadastro de ONGs em tabela + código de acesso por ONG, validado no servidor | **Risco #2 da Análise** (probabilidade alta, impacto médio): "a fatia mínima não identifica a ONG: qualquer requisição HTTP publica ou aceita uma doação, então uma medição de 'qual ONG aceitou' pode sair errada no piloto". Liga também ao **objetivo de impacto 3** (dados confiáveis de impacto). |
| D3 | Como representar a `quantidade` para o relatório mensal da Marta | **A** — manter `quantidade` como texto livre e o relatório somar contagem de doações coletadas e os tempos, não volume · **B** — trocar por `quantidade_valor` (número) + `quantidade_unidade` (kg / litros / porções / unidades), com migração dos registros existentes | **História #4 falha em Estimável** ("ninguém sabe o tamanho: quantidade hoje é texto livre") e a **incerteza** registrada: "se a quantidade deve virar uma unidade padronizada ou seguir como texto livre". Atende o **objetivo de impacto 3**. |

### D1 — decisão e justificativa

**Decidimos a alternativa A.** Uma única instrução resolve a corrida entre duas ONGs sem
espalhar controle de transação pela camada de regra; a mesma instrução funciona igual em
SQLite (U1 e U2) e em PostgreSQL (U3), então a migração da Unidade 3 não mexe nela; e ela
é testável sem concorrência real — basta chamar `aceitar` duas vezes e exigir que a
segunda falhe, que é exatamente o critério de aceite escrito na Análise. A alternativa B
só se paga quando o aceite precisar alterar mais de uma tabela na mesma operação (por
exemplo, gravar um histórico de coleta junto); enquanto for uma linha, é custo sem ganho.

**O que abrimos mão:** a mensagem de erro amigável ("doação já foi aceita por outra ONG")
vem de uma leitura anterior ao `UPDATE`, que pode estar desatualizada no instante da
corrida. Por isso a guarda do `UPDATE` é verificada de novo em `doacoes.aceitar` — a
leitura serve à mensagem, não à garantia. Se um dia o aceite virar uma operação de várias
tabelas, esta decisão é revista e vira B.

### D2 — decisão e justificativa

**Decidimos a alternativa A para a Unidade 2**, com a B registrada como decisão **adiada,
não descartada**. Hoje o servidor assume `'ONG'` por padrão quando o corpo não traz o
campo, e é isso que torna a medição do piloto não confiável: tornar `ong` obrigatório
custa um PR pequeno e já elimina o registro genérico que o Risco #2 aponta. A alternativa
B entrega um dado verificável, mas exige uma decisão operacional que o caso **não define**
— quem cadastra as ONGs e como entrega o código a elas — e cria um segredo compartilhado
para guardar e resetar, tudo isso enquanto a autenticação definitiva segue como incerteza
aberta na Análise. Decidir B agora é decidir autenticação por acidente.

**Condição de disparo para passar a B** (para não virar adiamento indefinido): se, nas 10
doações reais do experimento da hipótese, mais de 2 aceites chegarem com nome de ONG
inválido, em branco ou duplicado, a alternativa B entra na iteração seguinte.

### D3 — decisão e justificativa

**Decidimos a alternativa A.** Os três objetivos de impacto da Análise medem **tempo** e
**proporção coletada**, não volume — e o experimento da hipótese (mediana de
publicação → aceite contra aceite → coleta) não usa a quantidade em nenhum cálculo. A
alternativa B resolveria um problema que ainda não temos e cobraria o preço no ponto mais
sensível do caso: o doador publica pelo celular, com conexão instável e comida perecível
na mão — obrigá-lo a escolher unidade em uma lista é atrito onde a urgência não permite.
`quantidade` continua texto livre porque é assim que o doador já pensa ("10 porções",
"2 kg"), e a rastreabilidade que a vigilância sanitária cobra é satisfeita por o campo
existir e estar preenchido, não por ele ser numérico.

**O que abrimos mão:** o relatório da Marta não soma volume — só conta doações coletadas
e os tempos. **Condição de disparo para B:** se um patrocinador pedir volume total por
escrito, a migração entra como ADR próprio, porque aí mexe em schema com dados em produção.

## Tabela de trade-offs (uma decisão em detalhe)

Detalhamos a **D2** — é a decisão cuja resposta não era óbvia (D1 e D3 têm uma alternativa
claramente mais barata) e a única das três ligada a um risco da Unidade 1 que continua
**aberto**.

| Critério | A — campo `ong` obrigatório (declarado) | B — cadastro de ONGs + código de acesso |
|---|---|---|
| Confiabilidade do dado "qual ONG aceitou" (Risco #2, objetivo 3) | **Baixa** — o nome é declarado, não verificado; elimina o `'ONG'` genérico de hoje, mas não impede erro de digitação ou nome inventado | **Alta** — só uma ONG cadastrada consegue aceitar, e o registro serve de evidência |
| Custo de implementação até a Aula 10 | **1 PR pequeno** — tornar o campo obrigatório na regra, 1 teste, ajuste no `public/index.html` | **2+ PRs** — tabela, migração, rota de validação, tela de entrada do código |
| Custo de infraestrutura (restrição: orçamento perto de zero) | **Zero** | Zero em servidor, mas **custo operacional humano**: alguém cadastra as ONGs e distribui os códigos, papel que o caso não atribui a ninguém |
| Atrito no momento do aceite (comida perecível, "quem responde primeiro leva") | **Baixo** — um campo a mais, preenchido uma vez | **Médio/alto** — ONG sem o código em mãos não aceita; a doação espera |
| Superfície de segurança e dados que passa a existir | **Nenhuma** — nada de credencial guardada | Passa a guardar **segredo compartilhado** — exige hash e um processo de reset para não virar dívida |
| Risco de retrabalho quando a autenticação for definida (incerteza aberta) | **Baixo** — o campo `ong` continua existindo em qualquer cenário; muda só quem o preenche | **Alto** — se a autenticação definitiva for outra (login por e-mail, por exemplo), o código de acesso é trabalho jogado fora |
| Testabilidade no CI | **Direta** — aceite sem o campo devolve 400, em um teste | Exige **fixture** de ONG cadastrada em todo teste de aceite |

**Leitura da tabela:** B ganha em um único critério — o mais importante deles, a
confiabilidade do dado. Escolhemos A mesmo assim porque o piloto é de **um bairro só**,
com ONGs conhecidas: o nome declarado é conferível fora do sistema, e a confiabilidade que
falta pode ser recuperada manualmente nas 10 doações do experimento. Já o retrabalho da
linha 6 e a decisão operacional em aberto da linha 3 **não** são recuperáveis depois.

## Diagramas

- [Diagrama de contexto](diagramas/contexto.md) — os cinco atores, o que cada um troca com o sistema, e a vigilância sanitária.
- [Diagrama de dados](diagramas/dados.md) — a tabela `doacoes` hoje (SQLite) e o alvo PostgreSQL do ADR 0001.

**Divergências entre o diagrama de dados e o `src/db.js`:**

1. `status` — o diagrama admite só `disponivel | aceita | coletada`; o banco aceita qualquer texto (sem `CHECK`).
2. `ong` — o diagrama a exige em toda doação aceita (D2); o banco aceita nulo em qualquer status, e a regra fica só em `src/doacoes.js`.
3. Datas — o diagrama as trata como instantes; o banco guarda `TEXT` em dois formatos (`criada_em` do SQLite, `coletada_em` em ISO 8601), sem conferência.

## ADRs
Ver `docs/adr/`.

| ADR | Decisão | Status |
|---|---|---|
| [ADR 0001](adr/0001-migracao-sqlite-postgresql.md) | Migrar de SQLite para PostgreSQL na Unidade 3, com PostgreSQL em contêiner | substituído por ADR 0002 · 08/10/2026 |
| [ADR 0002](adr/0002-postgresql-instalado-demo-offline.md) | PostgreSQL instalado em cada notebook, não em contêiner (revisão do ADR 0001 após o aviso de demo ao vivo, sem rede garantida) | aceito · 08/10/2026 |

## Requisitos não-funcionais

Três cenários, cada um no formato *quando · o sistema · medido por*, e a decisão que muda
por causa dele. "Orçamento próximo de zero" **não** aparece aqui: é restrição do caso, não
se mede, e está no contexto dos ADRs 0001 e 0002.

| Requisito | Como afeta o design |
|---|---|
| **1 — Publicar com conexão instável** (nasce da restrição do caso: o doador publica pelo celular, com conexão instável — `docs/analise.md` → `## Stakeholders`). **Quando** o doador envia uma doação válida pelo celular numa conexão lenta (perfil *Slow 4G* do DevTools do Chrome), **o sistema** devolve `201` com a doação criada **em até 3 s em pelo menos 9 de 10 envios**. **Medido por:** 10 envios pela tela `public/index.html` com o perfil de rede ligado; tempo de cada `POST /api/doacoes` lido na aba *Network*. Falha se 2 ou mais passarem de 3 s. | **Afeta o ADR 0002 e a história #8.** A publicação faz só validação no servidor e um `INSERT` no banco **local ao servidor** — nada de chamada externa síncrona na hora do envio. Isso reforça o descarte do PostgreSQL gerenciado (ADR 0001/0002: cada consulta pagaria uma ida à nuvem) e obriga o aviso à ONG (história #8) a ser **assíncrono**. **Custo:** a ONG pode saber da doação nova com atraso; quem paga é a ONG, e o aviso fica mais caro de construir. A tela continua HTML puro, sem framework — custo: menos recurso visual. |
| **2 — Aceite único sob corrida** (regra central do caso). **Quando** duas ONGs enviam `POST /api/doacoes/:id/aceitar` para a mesma doação **ao mesmo tempo**, **o sistema** responde `200` para exatamente uma e `400` para a outra, e a doação sai da lista. **Medido por:** o teste automatizado `aceita só uma de duas tentativas simultâneas` em `tests/doacoes.test.js` (duas requisições em paralelo com `Promise.all`), rodando em todo PR no CI — hoje em SQLite, depois da migração em PostgreSQL. Falha se as duas receberem `200`. | **Afeta a escolha do banco (ADR 0001) e o código de aceite.** A garantia fica na escrita atômica `UPDATE ... WHERE id = ? AND status = 'disponivel' RETURNING *` (`src/repositorio.js`), e o banco escolhido precisa suportá-la igual — PostgreSQL suporta; um armazenamento sem `UPDATE` condicional atômico estaria descartado. **Custo:** a lista não pode ser servida de cache em memória (a doação aceita reapareceria), e a ONG recusada recebe só "já foi aceita por outra ONG", sem saber qual — quem paga é a ONG que perdeu a corrida. |
| **3 — Trocar o banco sem tocar regra.** **Quando** o banco for trocado de SQLite para PostgreSQL (Unidade 3), **o sistema** mantém o comportamento sem nenhuma mudança fora de `src/db.js`. **Medido por:** `git diff --stat <commit-antes>..<commit-depois> -- src/` lista **só** `src/db.js`, conferido por um integrante que não escreveu o PR da migração; e `npm test` passa com o mesmo número de testes de antes. Falha se aparecer `src/repositorio.js`, `src/doacoes.js` ou `src/app.js` no diff. | **Afeta o ADR 0001 (critério de validação) e a forma de escrever SQL.** Toda consulta passa pela `query()` única de `src/db.js`, sempre com o marcador `?`, e o `db.js` traduz para `$1, $2…` no PostgreSQL. **Custo:** fica proibido SQL específico de um banco fora do `db.js` (nada de `$1`, `datetime()` ou `now()` em `repositorio.js`); quem paga é quem escreve consultas novas, que perde atalhos do dialeto. |

## Critérios de validação do projeto

Cada linha se responde com **sim** ou **não** olhando só o repositório, na fonte indicada.
Tipo: **V** = verificar (projeto × o que foi especificado) · **C** = cobrir o caso (validar).

| # | Tipo | Critério | Fonte | Resposta em 08/10/2026 |
|:--:|:--:|---|---|:--:|
| 1 | V | O ADR da migração diz **o que precisa continuar igual** e **qual comando** mostra isso (`npm test` com o mesmo número de testes e `git diff --stat ... -- src/` só com `src/db.js`). | `docs/adr/0001-migracao-sqlite-postgresql.md` → `## Critério de validação`; `docs/adr/0002-postgresql-instalado-demo-offline.md` → `## Critério de validação` | sim |
| 2 | V | Depois da migração, `npm test` passa com PostgreSQL (`DATABASE_URL` definida) com **todos** os testes da suíte — incluindo o da proteção do banco real (revisão de 20/10 do ADR 0002) —, e o diff de `src/` mostra só `src/db.js`. | `docs/adr/0001-migracao-sqlite-postgresql.md` → `## Critério de validação`; execução do CI no PR da migração | não — a migração é da Unidade 3 |
| 3 | V | Só `src/db.js` importa `node:sqlite`, e nenhum arquivo de regra ou rota (`src/doacoes.js`, `src/app.js`) importa `src/db.js`. Confere-se com `grep -rn "node:sqlite\|db.js" src/`. | `src/` | sim |
| 4 | V | O ADR substituído mantém as seções originais: `git log -p docs/adr/0001-migracao-sqlite-postgresql.md` mostra, depois do commit que o criou, só a linha `Status` alterada; e o ADR novo cita o antigo. | `docs/adr/0001-migracao-sqlite-postgresql.md`; `docs/adr/0002-postgresql-instalado-demo-offline.md` → cabeçalho `Substitui` | sim |
| 5 | V | Cada ADR tem status e data no cabeçalho e uma seção `## Rastreabilidade` que cita uma regra, restrição ou risco existente em `docs/analise.md`. | `docs/adr/` × `docs/analise.md` → `## Regras de negócio`, `## Riscos` | sim |
| 6 | V | Toda divergência entre o diagrama de dados e o `src/db.js` está declarada. | `docs/diagramas/dados.md` → `## Divergências declaradas` | sim |
| 7 | V | Cada requisito não-funcional tem um número, um procedimento de medição e a condição em que falha. | `docs/projeto.md` → `## Requisitos não-funcionais` | sim |
| 8 | V | A regra "doação aceita não fica disponível para outra ONG" tem teste automatizado em sequência **e** em paralelo. | `tests/doacoes.test.js` → `recusa aceitar uma doação que já foi aceita por outra ONG` e `aceita só uma de duas tentativas simultâneas` | sim |
| 9 | C | Cada stakeholder de `## Stakeholders` tem ao menos uma história ou decisão que o atende (doador → #1; ONG → #2, #6, #7, #8; voluntário → #3; Marta → #4; vigilância → #5 e regra de campos obrigatórios). | `docs/analise.md` → `## Stakeholders` × `## Histórias de usuário` | sim |
| 10 | C | Os três horários do experimento da hipótese (publicação, aceite, coleta) têm onde ser gravados no banco. | `docs/diagramas/dados.md`; `docs/analise.md` → `## Hipótese e experimento` | não — só `criada_em` existe (divergência declarada) |
| 11 | V | Cada integrante registrou o ensaio offline exigido pelo ADR 0002 antes da aula da demo. | `docs/demo.md` → `### Ensaio offline (ADR 0002)` | não — previsto para antes da demo da Unidade 3 |
| 12 | V | Os testes não conseguem apagar um banco que não seja o de teste: `limparBanco()` recusa qualquer banco diferente de `:memory:`, e o teste `recusa limpar um banco que não é o de teste e não apaga nenhuma doação` passa. *(Mudança de contexto, etapa 4c.)* | `src/db.js` → `limparBanco()`; `tests/doacoes.test.js`; `docs/adr/0002-postgresql-instalado-demo-offline.md` → `## Revisão — 20/10/2026` | sim — PR #5 |

## Uso de IA

Nível declarado: **IA como colaboradora**, o mesmo do `docs/analise.md`. Usamos Claude (Claude Code) em todas as partes: os PRs do Trabalho 2 foram preparados pelo Renato com o Claude, cada um diz no texto o que veio da IA, e o revisor de cada PR conferiu a parte que defende na Aula 10.

| Parte | O que veio da IA | O que o grupo mudou ou conferiu |
|---|---|---|
| Decisões D1–D3 e trade-offs | primeira versão das decisões, alternativas e tabela da D2 | descartamos uma 4ª decisão ("SQLite ou PostgreSQL"), que é restrição do enunciado e virou ADR; assumimos as condições de disparo da D2 e da D3 |
| ADRs 0001/0002, não-funcionais, critérios | rascunhos a partir do repositório e do aviso da Aula 8 | conferimos os números dos não-funcionais (3 s, 9 de 10) e a escolha da instalação nativa |
| Mudança de contexto (4a, 4b, 4c) | diagnóstico em `src/db.js`, código da trava, teste e revisão do ADR 0002 | reproduzimos o incidente antes e depois da correção; conferimos que nenhuma seção original do ADR foi editada |
| Histórias novas e diagramas | código, testes, diagrama de contexto e divergências | rodamos os testes e o servidor com um banco antigo do piloto (a coluna nova entra sem apagar dados) |

**Erros da IA que corrigimos:**

- **Revisor inventado.** A IA escreveu, entre aspas, "fragilidades apontadas pelo revisor interno" antes de qualquer integrante revisar — falas atribuídas a alguém que não tinha dito nada. Removemos a seção: revisão de verdade é a que fica registrada no PR.
- **Nível de uso subdeclarado.** Um dos blocos declarava "IA para consulta", mas a IA escreveu rascunhos inteiros. Corrigimos para "colaboradora", que é o uso real.
- **Número que envelhece.** Os ADRs fixaram "7 de 7 testes" no critério de validação; a suíte cresceu. Como as seções originais de um ADR não se editam, o ajuste foi feito na revisão do ADR 0002 e no critério 2 ("todos os testes da suíte").
