# ADR 0002 — Subir o PostgreSQL por instalação nativa (revisão do ADR 0001)

- **Data:** 22/09/2026
- **Status:** aceito

## Contexto

Este ADR substitui o **ADR 0001**, que decidira subir o PostgreSQL via contêiner (Docker
Compose) local e no CI. Na Aula 9, o professor avisou em sala que a demonstração da
Unidade 3 será feita **ao vivo, na própria aula**, no notebook de **um único integrante do
grupo, sorteado no dia**, e que a rede da faculdade não garante liberação de saída para
*pull* de imagens Docker durante a aula (já houve bloqueio em turmas anteriores). Isso é uma
mudança de contexto, não uma mudança de requisito do produto: a regra de negócio e os
critérios de aceite continuam os mesmos do `docs/analise.md`.

O ADR 0001 dependia de duas coisas que esse anúncio tornou incertas: (a) que o notebook
sorteado tenha Docker Desktop instalado e funcionando, e (b) que, se a imagem ainda não
estiver em cache local, haja internet disponível na hora da demo para baixá-la. Nenhuma das
duas é garantida pelo cenário descrito pelo professor.

## Alternativas consideradas

(Revisita as mesmas opções do ADR 0001, sob a nova restrição "funcionar offline, em
qualquer notebook do grupo, sem depender de qual foi sorteado".)

1. **Manter a decisão do ADR 0001 (Docker Compose)** — contras: se o notebook sorteado não
   tiver a imagem em cache e a rede da faculdade bloquear o download, a demo trava na
   própria aula; prós: nenhum retrabalho de documentação/CI.
2. **PostgreSQL gerenciado em nuvem (Neon/Supabase/Render)** — contras: depende de internet
   *toda vez*, inclusive durante a demo — pior que a opção 1, que só depende de internet na
   primeira vez; descartada outra vez, com mais força agora.
3. **PostgreSQL instalado nativamente em cada máquina do grupo**, incluindo a do integrante
   que puder ser sorteado — prós: depois de instalado, roda 100% offline, independente de
   qual notebook for escolhido no dia; contras (já registradas no ADR 0001): setup manual
   diferente por sistema operacional, risco de versões divergentes entre integrantes.

## Decisão

Troca para a **alternativa 3** (instalação nativa do PostgreSQL), nas máquinas dos 5
integrantes — não só na de quem foi sorteado, porque o sorteio é no dia e ninguém sabe
antes. O risco de "funciona na minha máquina" que motivou descartar essa opção no ADR 0001
é mitigado documentando uma única versão-alvo do PostgreSQL (16.x) e um script de setup por
sistema operacional em `docs/demo.md`, checado por cada integrante antes da aula de
demonstração.

**O que cai da decisão anterior:** o Docker Compose deixa de ser o caminho oficial para
rodar o PostgreSQL localmente — continua sendo uma opção válida apenas para quem já o usa
sem problema, mas não é mais o que o roteiro de demo assume.

**O que continua valendo do ADR 0001:** a migração em si (SQLite → PostgreSQL) continua
decidida e só na Unidade 3; a garantia de aceite único via `UPDATE ... WHERE
status='disponivel'` continua sendo a propriedade que não pode mudar; o CI (GitHub Actions)
continua podendo usar PostgreSQL como *service container* — essa parte não tem a restrição
de rede da aula presencial, então o Docker nunca deixou de ser adequado ali.

## Consequências

- **Positivas:** a demo na Aula 9 não depende de qual notebook for sorteado nem da rede da
  faculdade no momento da apresentação; o grupo ganha uma versão-alvo única do PostgreSQL
  documentada, reduzindo divergência silenciosa entre máquinas.
- **Negativas / o que abrimos mão:** os 5 integrantes precisam instalar e manter o
  PostgreSQL 16.x localmente (antes só quem quisesse rodar fora do contêiner precisava).
  Quem paga esse custo: cada integrante individualmente, no tempo gasto instalando antes da
  aula de demonstração — estimado em até 30 minutos por sistema operacional, incluído no
  checklist de `docs/demo.md`.
- **Riscos e o que fazer se der errado:** se o integrante sorteado não tiver conseguido
  instalar a tempo, qualquer outro integrante assume o notebook para a demo (mesma
  mitigação já usada para o risco "integrante indisponível", em `docs/analise.md`).

## Rastreabilidade

Mesma rastreabilidade do ADR 0001 (regra de orçamento zero — instalação nativa também usa o
instalador oficial gratuito do PostgreSQL — e a regra central de aceite único), mais a
restrição nova desta revisão: a demonstração da Unidade 3 precisa funcionar sem depender de
qual notebook do grupo for usado nem da rede da faculdade no dia (anúncio do professor,
Aula 9 — não há seção no `docs/analise.md` para isso porque é uma restrição de avaliação,
não do produto; registrada aqui por ser o que motivou a revisão).

## Critério de validação

Igual ao ADR 0001 (7 de 7 testes de `tests/doacoes.test.js` passando sob PostgreSQL), mais:
cada integrante roda `npm test` com o PostgreSQL instalado nativamente na própria máquina,
**sem o Docker Compose no ar**, e os 7 testes passam igual. Isso prova que a aplicação não
ficou acoplada ao contêiner — só ao `DATABASE_URL` apontando para um PostgreSQL alcançável,
seja ele qual for.

**Divergência declarada entre este ADR e o código/diagrama atuais:** nem a migração (ADR
0001) nem esta revisão foram executadas em código ainda — `src/db.js` continua usando
`node:sqlite` (ver nota equivalente no ADR 0001) e não existe diagrama de dados dedicado no
repositório além do `CREATE TABLE` em `src/db.js`. A execução fica para o Trabalho 3
(`docs/refatoracoes.md` → "Refatoração 1"); este ADR só decide como o PostgreSQL vai subir
quando a migração acontecer.
