# ADR 0002 — PostgreSQL instalado em cada notebook, não em contêiner (revisão do ADR 0001)

- **Data:** 08/10/2026
- **Status:** aceito
- **Substitui:** [ADR 0001](0001-migracao-sqlite-postgresql.md)

## Contexto

**O que mudou.** Na Aula 8 (08/10/2026) o professor avisou que a demonstração da Unidade 3
será **ao vivo, em sala**, no notebook de **um integrante sorteado na hora**, e que a rede
da faculdade **não garante** acesso à internet durante a aula.

O ADR 0001 escolheu PostgreSQL em contêiner contando com duas premissas que esse aviso
derruba:

1. que a máquina onde o sistema roda tem Docker funcionando e a imagem `postgres:16-alpine`
   já baixada — mas qualquer um dos cinco notebooks pode ser sorteado;
2. que haja rede para o primeiro `docker compose up` — e na sala ela não é garantida.

O que **não** mudou: a regra central do caso (aceite único, garantido na escrita), a
restrição de orçamento próximo de zero, a exigência de PostgreSQL na Unidade 3, e o CI —
o GitHub Actions roda na nuvem do GitHub, longe da rede da sala.

**Restrição nova:** no dia da demo, o sistema precisa subir com PostgreSQL **em qualquer
notebook do grupo, com a rede desligada**.

## Alternativas consideradas

1. **Manter o ADR 0001 (contêiner)** e pedir a todos que deixem a imagem baixada.
   - Prós: nenhum retrabalho; mesma imagem do CI.
   - Contras: depende de Docker Desktop saudável nos cinco notebooks (no Windows, WSL2 que
     às vezes não inicia sem rede ou após atualização); se a imagem tiver sido apagada
     (`docker system prune`) no notebook sorteado, não há como baixá-la na sala.
2. **PostgreSQL 16 instalado em cada notebook** (instalador oficial, serviço do sistema
   operacional, mesmo usuário/senha/banco do `.env.example`).
   - Prós: depois de instalado roda 100% offline; é o caminho mais leve no notebook
     sorteado (sem Docker, sem WSL2); o instalador oficial é gratuito.
   - Contras: cinco instalações, uma por sistema operacional; risco de versões ou senhas
     divergentes.
3. **PostgreSQL gerenciado gratuito** (Neon/Supabase).
   - Contras: depende de rede em **toda** execução — exatamente o que o aviso tira. Já
     era a pior opção no ADR 0001, agora é inviável.
4. **Demo em SQLite e PostgreSQL só no CI.**
   - Prós: zero instalação para a demo.
   - Contras: a demo mostraria um banco diferente do que o projeto diz usar, e não exibiria
     a migração que é o objeto da Unidade 3; dois caminhos de banco no `db.js` para manter.

## Decisão

**Na máquina dos integrantes, PostgreSQL 16 instalado nativamente (alternativa 2), nos
cinco notebooks; no CI, continua o *service container* `postgres:16-alpine`.** A versão
(16), o usuário, a senha e o nome do banco são os de `.env.example`, iguais para todos.

Por que não as outras: a 1 deixa a demo dependendo de Docker e de uma imagem em cache que
ninguém controla no notebook sorteado; a 3 depende de rede sempre; a 4 demonstraria um
banco que não é o do projeto.

**O que cai do ADR 0001:** o `docker compose` como caminho oficial para rodar o banco na
máquina de cada integrante, e a premissa "mesma imagem em todas as máquinas". Quem já usa
Docker pode continuar usando, mas o roteiro de demo (`docs/demo.md`) não conta com ele.

**O que continua valendo do ADR 0001:** migrar para PostgreSQL, e só na Unidade 3; a troca
contida em `src/db.js` com `DATABASE_URL`; o `UPDATE ... WHERE status = 'disponivel'` como
garantia do aceite único; o *service container* no CI; e todo o critério de validação do
ADR 0001.

## Consequências

- **Positivas:**
  - A demo não depende de rede nem de qual notebook for sorteado.
  - O notebook sorteado roda só Node + PostgreSQL, sem Docker Desktop/WSL2 consumindo
    memória durante a apresentação.
- **Negativas / o que abrimos mão:**
  - **Cada um dos cinco integrantes** instala e mantém o PostgreSQL 16 na própria máquina
    **antes da aula da demo**, e confere que a senha e o banco batem com o `.env.example`.
    Quem paga: cada integrante, com o tempo de instalação; e quem usa Windows, que tem o
    instalador mais trabalhoso.
  - Perdemos a garantia "mesma imagem em todo lugar": a máquina local tem PostgreSQL 16.x
    do instalador, o CI tem `16-alpine`. Uma diferença de *minor* entre eles pode
    aparecer só no CI ou só no notebook.
  - O README e o `docs/demo.md` passam a ter instruções de instalação por sistema
    operacional para manter.
- **Riscos e o que fazer se der errado:**
  - O integrante sorteado não instalou ou o serviço não sobe → outro integrante assume
    com o próprio notebook (mesma mitigação do risco #1 da Análise). Por isso a instalação
    é nos cinco, não só em um.
  - Para não descobrir isso na hora: o roteiro da demo inclui um ensaio offline (abaixo)
    feito por cada integrante antes da aula.

## Rastreabilidade

- Tudo o que o ADR 0001 atende continua atendido: regra central do aceite único,
  restrição de orçamento próximo de zero e risco #1 da Análise (`docs/analise.md`).
- **Restrição do caso "conexão instável"** (`docs/analise.md` → `## Stakeholders`: doador e
  voluntário com conexão instável): o mesmo motivo pelo qual o produto não pode depender de
  rede vale para o ambiente da demo.
- **Aviso do professor em 08/10/2026** (demo ao vivo, notebook sorteado, rede não
  garantida): restrição de avaliação, não do produto; é o que motivou a revisão.

## Critério de validação

O critério do ADR 0001 continua inteiro (7 de 7 testes passando com PostgreSQL, diff de
`src/` só em `src/db.js`, CI verde com o PostgreSQL de serviço). Acrescenta-se:

- **Ensaio offline, em cada notebook:** com o Wi-Fi desligado e o serviço do PostgreSQL
  local no ar, rodar `npm run db:migrar && npm test && npm start` e depois
  `curl --fail http://localhost:3000/api/saude`. Passa se os testes ficarem 7 de 7 e o
  `curl` responder `{"ok":true}`. Cada integrante registra a data do ensaio em
  `docs/demo.md`.

## Diagrama de dados

O diagrama de dados não muda com esta revisão: muda **onde** o PostgreSQL roda, não o que
ele guarda. `docs/diagramas/dados.md` ganhou uma nota dizendo isso, e a divergência com o
`src/db.js` (ainda em SQLite) continua declarada lá.

## Revisão — 20/10/2026

**O que mudou.** O piloto já tinha doações reais cadastradas. Uma pessoa da equipe da Marta
rodou os testes na máquina do piloto com a configuração apontando para o banco real, e a
limpeza dos testes (`limparBanco()`) apagou todas as doações. A Marta pediu que isso não
possa acontecer de novo. Lendo `src/db.js` e `vitest.config.js`, a causa é dupla: o
`src/db.js` usa `dados.sqlite` (o banco real) sempre que o `vitest.config.js` não é aplicado,
e o `limparBanco()` fazia `DELETE FROM doacoes` sem conferir qual banco estava aberto.

**A decisão continua: PostgreSQL 16 instalado em cada notebook, contêiner só no CI.** Este
ADR decide *onde* o PostgreSQL roda, e o incidente não depende disso: com contêiner ou com
serviço gerenciado, um teste apontado para o banco real apagaria os dados do mesmo jeito.
Nenhuma das alternativas descartadas evitaria o incidente sozinha, e o motivo da escolha
(demo ao vivo, sem rede, em qualquer notebook) segue de pé.

**O que o incidente muda nas consequências e no critério de validação:**

- **Proteção já na main (SQLite):** a limpeza recusa qualquer banco que não seja o de teste
  (`:memory:`), com teste automatizado — PR #5, história da etapa 4b.
- **Na migração (Unidade 3), a proteção precisa ser reescrita, não só copiada.** Com o
  PostgreSQL instalado no notebook, o banco de desenvolvimento e o de teste ficam no
  **mesmo servidor**, e não existe `:memory:`. O banco de teste passa a ser um banco
  separado, com nome próprio (ex.: `pratocheio_teste`), e a limpeza confere
  `SELECT current_database()` e recusa qualquer outro nome.
- **Consequência negativa nova:** cada integrante cria **dois** bancos no PostgreSQL local
  (desenvolvimento e teste) e o `.env.example` ganha a variável do banco de teste. Quem
  paga: cada integrante, com mais um passo na instalação; e quem escrever a migração, que
  porta a proteção junto.
- **Critério de validação acrescentado:** depois da migração, o teste
  `recusa limpar um banco que não é o de teste e não apaga nenhuma doação` continua passando
  no PostgreSQL, adaptado para conferir o nome do banco. O "7 de 7" do critério original
  passa a ser lido como "todos os testes da suíte", incluindo este.

**Rastreabilidade:** objetivo de impacto 3 de `docs/analise.md` (dados confiáveis de impacto
para sustentar o financiamento — doações apagadas são impacto perdido) e a restrição da
vigilância sanitária (rastreabilidade de toda doação publicada, `## Regras de negócio`).
