# Documento de Projeto — Prato Cheio

*Trabalho 2 · máximo 4 páginas (fora diagramas) · entrega na Aula 10*

## Decisões de projeto
| # | Decisão | Alternativas | Requisito/risco da Análise que a motiva |
|---|---|---|---|

## Tabela de trade-offs (uma decisão em detalhe)
| Critério | Alternativa A | Alternativa B |
|---|---|---|

## Diagramas
(contexto + dados ou componentes — em `docs/` ou como imagem)

**Divergência declarada:** não existe diagrama de dados dedicado no repositório. O schema
atual é o único registro: `CREATE TABLE doacoes (...)` em `src/db.js` (SQLite). O ADR 0002
decide o alvo PostgreSQL e como subi-lo, mas a migração ainda não foi executada em código —
`src/db.js` continua apontando para `node:sqlite`. A execução é o objeto do Trabalho 3
(`docs/refatoracoes.md` → "Refatoração 1").

## ADRs
Ver `docs/adr/`.

- [ADR 0001 — Migrar de SQLite para PostgreSQL, só na Unidade 3](adr/0001-migracao-sqlite-postgresql.md) — **substituído por ADR 0002**.
- [ADR 0002 — Subir o PostgreSQL por instalação nativa (revisão do ADR 0001)](adr/0002-postgresql-instalacao-nativa-revisao.md) — **aceito**.

## Requisitos não-funcionais
| Requisito | Como afeta o design |
|---|---|
| Quando a ONG abre a lista de doações disponíveis em uma conexão de rede instável (celular, campo), o sistema deve responder em até **2 segundos** (medido com `curl -w '%{time_total}'` ou a aba Network do navegador em `GET /api/doacoes`, em uma rede 3G simulada no DevTools). | Afeta o ADR 0002: a consulta roda sobre `SELECT ... WHERE status='disponivel' ORDER BY id`, sem paginação nem índice declarado além da chave primária. Se a tabela crescer, isso custa a adição de um índice em `status` — ainda não feito, risco assumido enquanto o piloto for de um bairro só. |
| Quando duas ONGs tentam aceitar a **mesma doação** em um intervalo de menos de 1 segundo uma da outra, o sistema deve garantir que **exatamente uma** das duas tentativas seja aceita e a outra seja recusada com status 400 (medido pelo teste automatizado `recusa aceitar uma doação que já foi aceita por outra ONG`, em `tests/doacoes.test.js`, que já cobre esse caso de corrida via chamadas sequenciais — a garantia real vem da escrita atômica, não do teste). | Afeta diretamente o ADR 0001/0002: qualquer forma de subir o PostgreSQL escolhida precisa preservar o `UPDATE ... WHERE status='disponivel'` como fonte única da garantia; custa não poder usar nenhuma solução de banco que não suporte `UPDATE ... RETURNING` atômico (eliminou a alternativa de trocar para um banco não-relacional, por exemplo). |
| Quando o grupo faz a demonstração ao vivo na Aula 9, no notebook sorteado no dia, o ambiente deve subir **sem acesso à internet** no momento da apresentação (medido pelo roteiro de `docs/demo.md`: desconectar a rede antes de rodar `npm start` e confirmar que a aplicação sobe e responde em `/api/saude`). Esta restrição nasce diretamente do anúncio do professor na Aula 9, não é genérica. | Motivou a revisão do ADR 0001 para o ADR 0002: descarta o PostgreSQL gerenciado em nuvem (depende de internet sempre) e torna a instalação nativa preferível ao contêiner (que depende de internet só na primeira vez, mas o grupo não controla qual notebook terá a imagem em cache); custa 5 instalações nativas de PostgreSQL em vez de uma imagem Docker compartilhada. |

## Critérios de validação do projeto

| # | Critério | Sim/Não | Fonte |
|:--:|---|:--:|---|
| 1 | Os 7 testes de `tests/doacoes.test.js` passam com `npm test` sob SQLite (baseline atual). | sim | `tests/doacoes.test.js` + saída de `npm test` |
| 2 | Depois da migração (Trabalho 3), os mesmos 7 testes passam sem alteração nas asserções, apontando para PostgreSQL. | não (migração ainda não executada) | `docs/adr/0001-migracao-sqlite-postgresql.md` → `## Critério de validação`; `docs/refatoracoes.md` → "Refatoração 1" |
| 3 | A regra "uma doação aceita não fica disponível para outra ONG" é garantida por uma escrita atômica no banco (`UPDATE ... WHERE status='disponivel'`), não só checada em código. | sim | `src/repositorio.js`, função `aceitar` |
| 4 | Toda doação publicada sem um dos três campos obrigatórios (tipo, quantidade, validade) é recusada com o campo faltante indicado. | sim | `tests/doacoes.test.js`, teste "recusa doação sem os campos obrigatórios" |
| 5 | A lista de doações disponíveis é ordenada da mais antiga para a mais recente. | sim | `src/repositorio.js`, função `listarDisponiveis` + teste "lista as doações na ordem de publicação" |
| 6 | Cada ADR do repositório segue o modelo de `docs/adr/0000-modelo-adr.md` (contexto, alternativas, decisão, consequências, rastreabilidade) e tem status atualizado quando substituído. | sim | `docs/adr/0001-migracao-sqlite-postgresql.md`, `docs/adr/0002-postgresql-instalacao-nativa-revisao.md` |
| 7 | O CI (GitHub Actions) roda `npm test` em todo Pull Request e precisa estar verde antes do merge. | parcial — a pipeline existe em `.github/workflows/`, mas este documento não verificou se ela já valida contra PostgreSQL (só faz sentido depois da migração do critério 2). | `.github/workflows/` + histórico de execuções das Actions no GitHub |

### Fragilidades apontadas pelo revisor interno

*Revisor: integrante do grupo que não escreveu este checklist, leu só o repositório e
comentou no Pull Request da documentação de projeto.*

1. **"O critério 7 afirma que o CI precisa estar verde antes do merge, mas o commit
   `dd527f5` (merge do PR #1) não mostra nenhuma execução de Action associada — não dá para
   confirmar pelo repositório que isso já é seguido na prática, só que está escrito como
   regra."**
   Resposta da equipe: **aceita como limitação.** O merge do PR #1 foi anterior à
   configuração completa do workflow de CI; a partir do próximo PR (histórico
   `historia/*`) vamos linkar a execução verde da Action na descrição do PR, para o
   critério 7 ter evidência, não só a regra escrita.

2. **"O critério 2 (migração para PostgreSQL) está marcado 'não' e isso é esperado nesta
   fase — mas o `docs/projeto.md` não deixava claro, antes desta revisão, que a migração em
   si ainda não tinha ocorrido; um leitor que não abrisse o `src/db.js` podia achar que já
   estava feita, só por ver dois ADRs decidindo o assunto."**
   Resposta da equipe: **corrigida.** Adicionamos a nota de "divergência declarada" na
   seção `## Diagramas` deste documento e repetimos a observação no fim de cada ADR
   (0001 e 0002), deixando explícito que ambos decidem o alvo e a estratégia, não
   executam a troca — commit desta revisão.

## Uso de IA
