# ADR 0001 — Migrar de SQLite para PostgreSQL, só na Unidade 3

- **Data:** 08/09/2026
- **Status:** substituído por ADR 0002

## Contexto

O produto roda hoje em SQLite embutido (`node:sqlite`, `src/db.js`), escolha certa para o
walking skeleton da Unidade 1: zero instalação, zero custo, suficiente para um piloto de um
bairro só. A disciplina exige que a Unidade 3 (produto refatorado) rode sobre um banco
relacional "de produção" — PostgreSQL — para que a refatoração exercite uma dor real de
troca de infraestrutura, não um exercício teórico.

Por que só na Unidade 3, e não antes: a Unidade 1 e a Unidade 2 entregam, respectivamente,
o walking skeleton e o incremento guiado pelo projeto — nenhuma delas pede banco de
produção, e trocar o banco agora gastaria tempo do grupo (ver risco já registrado em
`docs/analise.md`: "um integrante fica indisponível na semana da entrega") sem mudar nenhum
critério de aceite das Unidades 1/2. Adiar para a Unidade 3 concentra o custo da migração no
momento em que ela é o próprio objeto de avaliação (refatoração, `docs/refatoracoes.md` →
"Refatoração 1").

A regra de negócio central do caso — *uma doação aceita não pode ficar disponível para
outra ONG* — hoje é garantida no SQLite por uma escrita atômica
(`UPDATE doacoes SET status='aceita' ... WHERE status='disponivel'`, em
`src/repositorio.js`). Qualquer escolha de banco e de forma de subi-lo precisa preservar
essa garantia sem reescrever a regra em `src/doacoes.js`.

## Alternativas consideradas

1. **Ficar em SQLite (não migrar).**
   - Prós: zero custo, zero infraestrutura nova, já funciona, adequado ao tamanho do piloto.
   - Contras: não atende o enunciado da Unidade 3 (banco relacional de produção); SQLite
     embutido no Node é "experimental" (aviso que já aparece em `npm test`); não exercita
     concorrência real entre processos, que é parte do que a disciplina quer testado.

2. **Migrar para PostgreSQL via contêiner (Docker Compose), local e como *service
   container* no CI (GitHub Actions).**
   - Prós: ambiente idêntico em dev e CI; nenhum integrante precisa instalar PostgreSQL na
     própria máquina (todos os 5 integrantes já têm Docker Desktop instalado, usado em
     outra disciplina); subir/derrubar com um comando (`docker compose up -d`); imagem
     oficial `postgres` é gratuita, compatível com a restrição de orçamento zero.
   - Contras: depende de Docker instalado e funcionando em cada máquina; primeira
     inicialização baixa a imagem (precisa de internet nessa primeira vez); adiciona um
     processo a mais rodando na máquina de quem está desenvolvendo.

3. **Migrar para PostgreSQL instalado nativamente** (instalador oficial, um serviço do
   sistema operacional, em cada máquina e no runner do CI).
   - Prós: não depende de Docker; depois de instalado, funciona sem internet.
   - Contras: setup manual diferente por sistema operacional (Windows/Mac/Linux — o grupo
     usa os três); risco de "funciona na minha máquina" por versões de PostgreSQL
     divergentes; mais passos de instalação para documentar e manter atualizados.

4. **Migrar para PostgreSQL gerenciado em nuvem, no plano gratuito** (ex.: Neon, Supabase,
   Render).
   - Prós: nenhuma instalação local; um único banco compartilhado, fácil para demo.
   - Contras: exige internet disponível no momento de rodar os testes e a demo — contraria
     a independência do CI local e o risco de indisponibilidade da rede da faculdade; plano
     gratuito tem limites de uso (ex.: banco "dorme" após inatividade) que podem derrubar a
     demo ao vivo; depende de uma conta externa por grupo, fora do controle do repositório.

## Decisão

Escolhida a **alternativa 2** (Docker Compose, local e no CI). Ela é a única que atende ao
mesmo tempo: orçamento zero (imagem oficial gratuita), ambiente reproduzível igual entre os
5 integrantes sem depender do sistema operacional de cada um, e nenhuma dependência de rede
*depois* da primeira vez que a imagem é baixada — ao contrário da alternativa 4, que depende
de internet em toda execução. A alternativa 1 foi descartada por não atender o enunciado da
Unidade 3. A alternativa 3 foi descartada pelo risco de divergência entre Windows/Mac/Linux
dos integrantes, que a alternativa 2 elimina (mesma imagem de contêiner para todos).

## Consequências

- **Positivas:** ambiente de teste e produção reproduzível bit a bit entre as máquinas do
  grupo e o CI; a troca fica contida em `src/db.js` (a interface `query()` → `{ rows }` já
  foi desenhada para isso), sem vazar para `src/doacoes.js` nem `src/repositorio.js`; o
  projeto passa a exercitar um banco com suporte real a múltiplas conexões concorrentes.
- **Negativas / o que abrimos mão:** cada execução local de `npm test` ou `npm start` exige
  o contêiner no ar primeiro (`docker compose up -d`), um passo que não existia com SQLite;
  isso soma ~20–30s de espera a cada vez que o contêiner precisa subir do zero. Quem paga
  esse custo é quem mexe com mais frequência no schema durante o desenvolvimento local
  (hoje, Gabriel, autor de `src/repositorio.js`) — ele reinicia o contêiner a cada ajuste de
  `CREATE TABLE` para testar a migração do zero.
- **Riscos e o que fazer se der errado:** se Docker Desktop não estiver disponível ou não
  funcionar em alguma máquina institucional, aquele integrante não consegue rodar os testes
  localmente — nesse caso ele desenvolve contra o Postgres do CI (abre PR e lê o resultado
  da Action) até resolver o ambiente local, sem bloquear o grupo.

## Rastreabilidade

- Atende a regra de negócio "o orçamento do projeto está próximo de zero — nenhuma decisão
  de escopo pode depender de infraestrutura paga significativa" (`docs/analise.md` →
  `## Regras de negócio`): a imagem oficial do PostgreSQL usada no contêiner é gratuita.
- Atende à regra central do caso "uma doação aceita por uma ONG não pode ficar disponível
  para outra ONG... garantida de forma atômica no banco" (`docs/analise.md` →
  `## Regras de negócio`): a decisão exige que o `UPDATE ... WHERE status = 'disponivel'`
  continue sendo a única fonte da garantia depois da troca de banco (ver critério de
  validação abaixo).

## Critério de validação

O que precisa continuar igual: os 7 testes de `tests/doacoes.test.js` — em especial os dois
que provam a regra de aceite único ("marca a doação como aceita pela ONG" e "recusa aceitar
uma doação que já foi aceita por outra ONG") — devem passar sem nenhuma alteração nas
asserções, apontando para o PostgreSQL em vez do SQLite.

Como se mede: com o contêiner no ar (`docker compose up -d`) e `DATABASE_URL` apontando para
ele, rodar `npm test` e comparar a saída com a baseline atual sob SQLite — **7 de 7 testes
passando**, igual à baseline. Qualquer teste que passe a falhar, ou que precise de uma
asserção diferente para passar, indica que a troca de banco alterou um comportamento e a
migração não pode ser considerada concluída.

**Nota sobre o estado atual do código:** esta decisão ainda não foi executada — `src/db.js`
continua apontando para `node:sqlite` (ver comentário no próprio arquivo, linhas 3–6, que já
anuncia a troca futura). A execução da migração é o objeto do Trabalho 3
(`docs/refatoracoes.md` → "Refatoração 1"); este ADR decide o alvo e a estratégia, não o
código.
