# ADR 0001 — Migrar de SQLite para PostgreSQL na Unidade 3, com PostgreSQL em contêiner

- **Data:** 08/10/2026
- **Status:** aceito

## Contexto

O Prato Cheio roda hoje sobre SQLite embutido no Node (`node:sqlite`, em `src/db.js`):
nada a instalar, banco em arquivo (`dados.sqlite`) e, nos testes, em memória. Para o walking
skeleton da Unidade 1 e o projeto da Unidade 2 isso basta.

**Por que migrar.**

- O piloto deixa de ser "um processo na máquina de um aluno": na Unidade 3 o produto é
  demonstrado e precisa aguentar ONGs aceitando doações ao mesmo tempo. A regra central do
  caso — *doação aceita não fica disponível para outra ONG* (`docs/analise.md` →
  `## Regras de negócio`) — é garantida pela escrita atômica
  `UPDATE ... WHERE id = ? AND status = 'disponivel'` (`src/repositorio.js`, `aceitar`).
  Em SQLite toda escrita é serializada pelo arquivo, então a corrida nunca é exercitada de
  verdade; num servidor de banco com conexões concorrentes ela é.
- O `node:sqlite` ainda é marcado como experimental (o `ExperimentalWarning` aparece em todo
  `npm test`) e exige trava de arquivo — o README já registra que ele falha com
  `disk I/O error` em pasta sincronizada (OneDrive/Drive).
- A disciplina exige banco relacional migrado para PostgreSQL na Unidade 3 (README →
  "O banco: SQLite agora, PostgreSQL depois").

**Por que só na Unidade 3, e não agora.** Nenhum critério de aceite das histórias #1, #2 e
#6 depende do banco: os 7 testes de `tests/doacoes.test.js` passam em SQLite. Trocar agora
custaria tempo do grupo numa iteração em que o risco #1 da Análise ("um integrante fica
indisponível na semana da entrega") é o maior, sem mudar nenhum comportamento visível. Na
Unidade 3 a troca é o próprio objeto de trabalho (refatoração com os testes como rede de
proteção, `docs/refatoracoes.md`), e o `src/db.js` já foi desenhado para isso: ele expõe
`query()` devolvendo `{ rows }`, e é o único arquivo que conhece o banco.

**Restrições que pesam.** Orçamento próximo de zero (`docs/analise.md` →
`## Regras de negócio`): nada pago. O grupo usa sistemas operacionais diferentes. O CI
(GitHub Actions) precisa continuar verde com o banco novo.

## Alternativas consideradas

1. **Ficar em SQLite** (não migrar).
   - Prós: zero instalação e zero custo; já funciona; testes em memória levam menos de 1 s;
     para um piloto de um bairro, o volume cabe com folga.
   - Contras: a corrida do aceite duplo nunca é exercitada com conexões concorrentes reais;
     módulo experimental do Node; falha em pasta sincronizada; descumpre a exigência da
     Unidade 3 (banco migrado para PostgreSQL).
2. **PostgreSQL em contêiner** (`postgres:16-alpine`, via `docker compose` na máquina de
   cada integrante e como *service container* no CI).
   - Prós: a mesma imagem e a mesma versão (16) em todas as máquinas e no CI, qualquer que
     seja o sistema operacional; o bloco do CI já está pronto, comentado, em
     `.github/workflows/ci.yml`; sobe e some com um comando; imagem oficial gratuita.
   - Contras: exige Docker instalado e funcionando em cada notebook (no Windows, Docker
     Desktop + WSL2, alguns GB de disco); o primeiro `docker compose up` baixa a imagem
     (precisa de rede); `npm test` deixa de rodar só com o Node.
3. **PostgreSQL instalado na máquina** (instalador oficial, serviço do sistema operacional).
   - Prós: não depende de Docker; depois de instalado, funciona sem rede; mais leve que o
     Docker Desktop.
   - Contras: instalação diferente em cada sistema operacional; risco de versões e senhas
     divergentes entre os integrantes ("funciona na minha máquina"); no CI precisaria de
     outro caminho de qualquer jeito.
4. **PostgreSQL gerenciado gratuito** (Neon, Supabase ou Render, alcançado por
   `DATABASE_URL`).
   - Prós: nada para instalar; um banco único para o grupo e para a demo.
   - Contras: depende de rede em **toda** execução, inclusive nos testes; plano gratuito tem
     limites e pode "dormir" por inatividade; conta externa fora do repositório (alguém
     precisa ser dono dela); testes de vários integrantes ao mesmo tempo no mesmo banco
     apagam os dados uns dos outros (`limparBanco()` roda antes de cada teste).

## Decisão

**Migrar para PostgreSQL 16 na Unidade 3, subindo o banco em contêiner (alternativa 2):**
`docker compose` na máquina de cada integrante e *service container* no CI, com a troca
contida em `src/db.js` e o banco alcançado por `DATABASE_URL`.

Por que não as outras:

- **Ficar em SQLite (1)** só seria defensável se a corrida do aceite não importasse; ela é a
  regra central do caso, e a Unidade 3 exige o banco migrado.
- **Instalado na máquina (3)** perde para o contêiner porque cada integrante teria uma
  versão e uma configuração diferentes, e o CI precisaria de um caminho separado; o
  contêiner usa a mesma imagem nos dois lugares.
- **Gerenciado (4)** troca instalação por dependência de rede em toda execução e por uma
  conta externa sem dono definido; testes concorrentes de integrantes diferentes no mesmo
  banco se atrapalham.

## Consequências

- **Positivas:**
  - A troca fica contida em `src/db.js`; `src/repositorio.js`, `src/doacoes.js` e
    `src/app.js` não mudam (o `db.js` traduz o marcador `?` para `$1, $2…`).
  - A regra do aceite único passa a ser exercitada com conexões concorrentes reais.
  - Ambiente igual entre os integrantes e o CI (mesma imagem, mesma versão).
- **Negativas / o que abrimos mão:**
  - `npm test` deixa de rodar "só com o Node": antes de cada sessão de trabalho é preciso
    `docker compose up -d` e esperar o banco ficar pronto. **Quem paga:** cada integrante,
    na própria máquina — primeiro com a instalação do Docker (no Windows, Docker Desktop +
    WSL2) e o download da imagem, depois com esse passo a mais a cada sessão; mais caro para
    quem mexe em `src/repositorio.js` e nos testes (hoje, Gabriel — ver README →
    `## Contribuições`).
  - O CI fica mais lento: o job espera o *health check* do PostgreSQL antes de
    `npm test`. **Quem paga:** todo PR, em tempo de espera.
  - Dialeto: `datetime('now')` vira `now()`, `INTEGER PRIMARY KEY AUTOINCREMENT` vira
    identidade, e o `criada_em` deixa de ser texto. **Quem paga:** quem fizer a
    refatoração em `src/db.js`.
- **Riscos e o que fazer se der errado:**
  - Um notebook não roda Docker → aquele integrante desenvolve contra o CI (abre o PR e
    lê a Action) até resolver o ambiente.
  - A migração quebra um teste → reverter o commit de `src/db.js`: SQLite volta a ser o
    banco, porque nada fora do `db.js` mudou.

## Rastreabilidade

- **Regra de negócio central** (`docs/analise.md` → `## Regras de negócio`): "uma doação
  aceita por uma ONG não pode ficar disponível para outra ONG — garantida de forma atômica
  no banco". A decisão preserva a garantia na própria escrita e passa a exercitá-la sob
  concorrência.
- **Restrição de orçamento próximo de zero** (mesma seção): imagem oficial gratuita,
  nenhum serviço pago.
- **Risco #1 da Análise** (integrante indisponível na semana da entrega, `## Riscos`):
  motiva adiar a troca para a Unidade 3.
- **Critérios de aceite da História #6** (`docs/analise.md` → `## Critérios de aceite`): o
  `UPDATE ... WHERE status = 'disponivel'` que os sustenta funciona igual em SQLite e em
  PostgreSQL, e por isso a migração não o reescreve.

## Critério de validação

**O que precisa continuar igual:** o comportamento das histórias #1, #2 e #6 — publicar com
os três campos, recusar sem um deles, listar da mais antiga para a mais recente, aceitar e
tirar da lista, recusar o segundo aceite — e o fato de nenhuma regra mudar fora do
`src/db.js`.

**Como se mostra:**

1. Com o PostgreSQL no ar e `DATABASE_URL` definida, `npm test` passa **com os mesmos 7 de 7
   testes de `tests/doacoes.test.js`** que passam hoje em SQLite, e as asserções não mudam (`git diff <commit-antes>..<commit-depois> -- tests/` vazio, salvo a
   preparação do banco em `beforeEach`).
2. `git diff --stat <commit-antes>..<commit-depois> -- src/` lista só `src/db.js`.
3. O job do CI com o bloco `services: postgres` descomentado fica verde, incluindo o passo
   `curl --fail http://localhost:3000/api/saude`.

Se qualquer um dos três falhar, a migração não está concluída.

**Estado hoje:** decisão tomada, ainda não executada — `src/db.js` continua em
`node:sqlite`. A divergência está declarada em `docs/diagramas/dados.md`.
