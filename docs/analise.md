# Documento de Análise — Prato Cheio

*Trabalho 1 · máximo 4 páginas · entrega na Aula 5*

## Problema central

Restaurantes e padarias geram excedentes de comida que ainda podem ser aproveitados, mas
hoje o repasse a ONGs depende de contato informal (telefone, grupos de WhatsApp) — sem
visibilidade em tempo real de quem tem o quê disponível nem de quem pode buscar primeiro.
O resultado é comida perecível vencendo antes de ser coletada, enquanto ONGs perdem
doações para a demora ou para a falta de aviso. O projeto precisa reduzir o tempo entre a
doação ficar disponível e ser efetivamente coletada, operando com orçamento próximo de
zero e sem travar o fluxo em burocracia que a urgência do alimento perecível não permite.

## Incertezas

- Como doador e ONG se identificam no sistema — o caso não define autenticação.
- Qual canal de aviso a ONG deve receber quando surgir uma doação do tipo que mais aceita
  (push, e-mail, WhatsApp) — depende de infraestrutura externa ainda não escolhida.
- Se a "quantidade" deve virar uma unidade padronizada ou seguir como texto livre.
- Quantas horas define a janela de retirada (validade − tempo estimado de coleta) — falta
  uma linha de base medida.
- Como estruturar endereço/localização para viabilizar o filtro por proximidade.

## Stakeholders
| Stakeholder | Interesse | Influência | O que espera |
|---|---|---|---|

## Objetivos de impacto
1.
2.
3.

## Regras de negócio

## Histórias de usuário
| # | História (Como… quero… para…) | INVEST: o que falha | Ação corretiva |
|---|---|---|---|
| 1 | Como doador (restaurante/padaria), quero publicar uma doação informando tipo, quantidade e validade, para que a ONG não perca tempo indo buscar algo que já não presta. | Testável | O "para" era vago para virar teste. Escrevemos a condição observável: dado que os três campos foram preenchidos, quando o doador publica, a doação aparece na lista; dado que falta um campo, quando tenta publicar, o sistema recusa e aponta o campo faltante (bate com os dois primeiros `it.todo`). |
| 2 | Como ONG receptora, quero ver a lista de doações disponíveis na ordem de publicação, para não perder as mais antigas por falta de atenção. | Valiosa | A primeira versão era "quero ver a lista, para ver as doações disponíveis" — o "para" repetia o "quero". Reescrevemos com a perda real evitada (deixar uma doação perecível esperando sem necessidade). |
| 3 | Como voluntário entregador, quero confirmar a coleta em até 3 toques, para sair rápido e conseguir atender mais de uma doação no mesmo turno. | Testável | "Rápido" não é condição observável. Amarramos a um critério verificável da Aula 2: a confirmação grava o horário do evento, não o da sincronização — assim dá pra testar mesmo com conexão instável. |
| 4 | Como Marta, quero um relatório mensal com o total de doações coletadas, para mostrar impacto aos patrocinadores e sustentar o financiamento do projeto. | Estimável | Ninguém sabe o tamanho: "quantidade" hoje é texto livre ("10 porções", "2 kg"), não um número padronizado. Ação: spike de 2h para decidir se normalizamos a unidade agora ou se o relatório soma só a contagem de doações. |
| 5 | Como vigilância sanitária, quero que toda doação publicada registre tipo, quantidade e validade, para ter rastreabilidade mínima em caso de fiscalização. | Negociável | Isso não é uma história — é uma restrição imposta, que não se negocia (regulador, Aula 2). Ação: mover o conteúdo para `## Regras de negócio` como restrição imposta pela vigilância; mantemos a linha aqui só para registrar o diagnóstico e não perder a rastreabilidade da decisão. |
| 6 | ★ Como ONG receptora, quero ver a lista completa de doações disponíveis e aceitar uma com um botão, para não mandar um voluntário atrás de uma doação que outra ONG já levou. | Independente | Só é demonstrável depois que existe ao menos uma doação publicada. Não eliminamos a dependência — ela é esperada numa fatia vertical (walking skeleton) — só documentamos que a história 1 é pré-requisito de execução, não de escrita. |
| 7 | Como ONG receptora, quero filtrar as doações disponíveis por tipo, para achar mais rápido o que minha organização consegue distribuir hoje. | Testável | "Mais rápido" sem número não testa. Reescrevemos como Dado/Quando/Então: dado que existem doações de tipos variados, quando a ONG filtra por tipo X, a lista mostra só as do tipo X. |
| 8 | Como ONG receptora, quero receber um aviso quando surgir uma doação do tipo que minha organização mais aceita, para não depender de checar a lista o tempo todo. | Estimável | Ninguém sabe o tamanho até decidir o canal do aviso (push, e-mail, WhatsApp) — e isso depende de infraestrutura externa que o caso não define. Ação: spike para escolher o canal antes de estimar o esforço. |

As linhas 6, 7 e 8 são as três fatias (método hambúrguer) da história gigante **"Como ONG, quero encontrar e aceitar a doação certa para mim, para reduzir o tempo entre a doação ficar disponível e ser coletada."** Cada uma é demonstrável e descartável sozinha — nenhuma é "parte 1 de 3": a 6 já entrega o fluxo completo nos mínimos, a 7 melhora a busca, a 8 melhora o aviso. Nenhuma depende de implementar a seguinte para fazer sentido para o usuário.

### História zero (★ linha 6)

**Por que ela:** ela é a única fatia que atravessa interface → regra → dados e exercita a regra de negócio central do caso — *doação aceita não fica disponível para outra ONG* (já registrada como stub em `src/doacoes.js`) — e produz a medição que falta desde a Aula 2 (grava o instante da publicação e do aceite).

**O que ficou FORA da fatia — e por quê:**

| Ficou fora | Motivo |
|---|---|
| Autenticação de doador e de ONG | Risco — aumenta o escopo sem reduzir o risco técnico do fluxo central; o caso não define hoje como doador e ONG se identificam. |
| Confirmação com resumo antes de aceitar | Risco — fatia mínima × fatia gorda: primeiro medimos se o aceite direto já resolve a corrida ("quem responde primeiro leva"), antes de adicionar uma etapa. |
| Filtro por proximidade e aviso em tempo real | Medição — dependem de endereço estruturado e de escolher um canal de notificação; nenhum dos dois está decidido (viram as fatias 7 e 8). |
| Foto e histórico do doador | Risco — não atravessa nenhuma camada nova (interface → regra → dados já fica provado sem foto); só adiciona dado sem reduzir risco. |
| Expiração automática da doação (volta à fila) | Medição — é regra derivada ("janela de retirada = validade − tempo de coleta", Aula 2) e ainda não tem o número decidido; falta linha de base para saber quantas horas. |

## Critérios de aceite

As três histórias abaixo são as que a fatia vertical da iteração 1 (walking skeleton)
exercita ponta a ponta. Cada critério tem um `it()` correspondente em
`tests/doacoes.test.js`. A **História #6** é a história zero (★).

**História #1 — o doador publica uma doação**

- Dado que os campos tipo, quantidade e validade estão todos preenchidos, quando o doador
  publica a doação, então ela passa a aparecer na lista de doações disponíveis.
- Dado que a doação foi enviada sem um dos campos obrigatórios, quando o doador tenta
  publicar, então o sistema recusa a publicação e informa qual campo está faltando.

**História #2 — a ONG vê a lista na ordem de publicação**

- Dado que existem duas doações publicadas em momentos diferentes e nenhuma foi aceita
  ainda, quando a ONG abre a lista de doações disponíveis, então as duas aparecem da mais
  antiga para a mais recente.

**História #6 (história zero, ★) — a ONG aceita uma doação**

- Dado que existe uma doação publicada e ainda não aceita, quando a ONG a aceita, então a
  doação deixa de aparecer na lista de disponíveis e passa a constar como aceita por essa ONG.
- Dado que uma doação já foi aceita por uma ONG, quando uma segunda ONG tenta aceitar a
  mesma doação, então o sistema recusa a segunda tentativa e a doação continua registrada
  para a primeira ONG.

## Riscos

Escala usada: probabilidade e impacto em três níveis — **alta / média / baixa**.

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Um integrante fica indisponível na semana da `entrega-1` (03/09 concentra entrega + Prova 1), e o trabalho estava concentrado nele. | Média | Alto | Até 30/08, o Igor registra no README quem é o dono de cada arquivo (`repositorio.js`, `doacoes.js`, testes, cada seção do `analise.md`); a partir daí o grupo abre no máximo 1 PR pequeno por pessoa por dia, para nenhuma tarefa ficar sem um segundo integrante a par. |
| A fatia mínima não identifica a ONG: qualquer requisição HTTP publica ou aceita uma doação, então uma medição de "qual ONG aceitou" pode sair errada no piloto. | Alta | Médio | Até 30/08, o Renato abre a issue "identificação da ONG no aceite" ligada à fatia 7 e torna o campo `ong` obrigatório no corpo de `POST /api/doacoes/:id/aceitar` (hoje ele assume `'ONG'` por padrão), para que todo aceite no piloto tenha um nome real anotado. |

## Hipótese e experimento

Acreditamos que o tempo que mais pesa para a comida se perder está **entre a doação ficar
disponível e uma ONG aceitá-la** — não no deslocamento do voluntário até o local da coleta.

Saberemos que estávamos errados se, nas **10 próximas doações reais** acompanhadas **até
20/09**, a mediana do intervalo *publicação → aceite* for **menor** que a mediana do
intervalo *aceite → coleta*.

Como medimos: planilha de 10 linhas, três horários por doação — `criada_em` (já gravado
pelo walking skeleton na publicação), o horário do aceite (anotado pela ONG ao tocar em
"Aceitar") e o horário da coleta (anotado por quem retira). Sem software novo; orçamento
zero.

## Decisão de análise

- **Problema:** precisávamos definir o recorte da primeira fatia vertical para a iteração 1
  andar sem travar em escopo — autenticação de doador e de ONG, tela de confirmação antes
  do aceite e filtro por proximidade estavam todos em aberto no caso.
- **Alternativas:**
  - **A — fatia mínima:** publicar → listar → aceitar, sem login e sem tela de confirmação.
    Ganha-se um skeleton demonstrável em uma iteração e a instrumentação dos horários de
    publicação e de aceite, que faltava desde a Aula 2. Perde-se realismo: qualquer
    requisição aceita uma doação e "qual ONG" é apenas o texto enviado no corpo.
  - **B — fatia "gorda":** incluir identificação da ONG e uma confirmação com resumo antes
    de aceitar. Ganha-se um fluxo mais próximo do produto real. Perde-se: são 2+ iterações,
    e o caso não define como a ONG se identifica — alto risco de retrabalho quando essa
    decisão for tomada.
- **Decisão e justificativa:** escolhemos a **alternativa A**. Ela está ligada ao risco
  desta entrega (prazo curto, um integrante pode faltar) e ao objetivo de impacto da
  história-mãe — "reduzir o tempo entre a doação ficar disponível e ser coletada": a fatia
  mínima já atravessa interface → regra → dados, já exercita a regra central do caso (doação
  aceita não volta para a lista) e já produz os dois horários que o experimento da hipótese
  precisa.
- **Riscos e limitações:** sem autenticação, o aceite não sabe *quem* é a ONG — só registra
  o texto recebido; a proteção contra aceite duplo é garantida no servidor
  (`UPDATE ... WHERE status = 'disponivel'`), não por identidade. Filtro por proximidade e
  expiração automática da doação ficam para as fatias 7 e 8 e dependem de números (endereço
  estruturado, "janela de retirada = validade − tempo de coleta") ainda não medidos.

## Uso de IA

Nível declarado: **IA como colaboradora** (Aula 3). Pedimos histórias candidatas para o caso Prato Cheio e aplicamos o protocolo de 3 passos (confronto com o caso, com o mapa de stakeholders, com INVEST) em cada uma antes de aceitar.

**História #1 (doador publica doação)**
- O que a IA gerou: *"Como usuário, quero cadastrar uma doação, para que o sistema registre os dados."*
- O que mudamos e por quê: trocamos "usuário" (papel de tela, não está no mapa) pelo papel real — doador (restaurante/padaria) — e reescrevemos o "para", que era tautológico ("para que o sistema registre" é valor do sistema, não de alguém), pela perda concreta evitada.
- Regra que ela inventou: sugeriu que toda doação passasse por aprovação manual antes de publicar. Essa regra não existe no caso. Quem decide se ela entra: Marta, como coordenadora/patrocinadora — e só faz sentido se o orçamento (perto de zero) permitir alguém revisando doação por doação, o que hoje não permite.
- Restrição que sumiu: a IA não mencionou que o doador publica pelo celular, com conexão possivelmente instável — adicionamos essa condição ao critério de aceite.

**História #3 (voluntário confirma coleta)**
- O que a IA gerou: *"Como voluntário, quero um app rápido e seguro, para fazer entregas com eficiência."*
- O que mudamos e por quê: "rápido e seguro" é qualidade escrita como adjetivo, sem número — convertemos em critério mensurável (grava o horário do evento, não da sincronização) e em uma ação observável (confirmar em até 3 toques).
- Regra que ela inventou: sugeriu que o voluntário fotografe a entrega como prova de coleta. Não está no caso. Quem decide: Marta/operação — e pesa contra o orçamento próximo de zero (armazenar e processar imagem custa).
- Restrição que sumiu: a conexão instável do voluntário na rua, citada explicitamente no caso, não apareceu na versão da IA.

**História #5 (vigilância sanitária)**
- O que a IA gerou: *"Como administrador, quero aprovar as doações cadastradas, para garantir a qualidade."*
- O que mudamos e por quê: "administrador" é papel de tela, não stakeholder (Aula 2) — trocamos pelo regulador real, a vigilância sanitária. Ao confrontar com o mapa, percebemos que o pedido dela nem é uma história: é uma restrição que não se negocia. A ação corretiva foi reclassificar, não só reescrever.
- Regra que ela inventou: aprovação manual de cada doação por um "administrador" — não existe no caso, e contradiz a urgência do fluxo (comida perecível não espera aprovação). Quem decide se essa regra entra: Marta, ouvindo a própria vigilância antes de descartar de vez.
- Restrição que sumiu: de novo o orçamento próximo de zero — um fluxo de aprovação manual pressupõe alguém dedicado a isso, que o caso não prevê.

**História #7 (fatia "bom" — filtro por tipo)**
- O que a IA gerou: *"Como ONG, quero um dashboard completo com filtros avançados, notificações e histórico de doadores, para gerenciar tudo em um só lugar."*
- O que mudamos e por quê: é uma história gigante disfarçada de fatia intermediária (o "quero" tem vários "e"s e nomeia módulos). Cortamos para um filtro só (tipo), jogando notificação para a fatia 8 e descartando "histórico de doadores" por ora — sem isso a fatia continua demonstrável sozinha.
- Regra que ela inventou: presumiu a existência de um cadastro de "categorias favoritas" por ONG. Não está no caso. Quem decide: fica em aberto — só entra se alguma ONG manifestar essa necessidade na validação.
- Restrição que sumiu: "orçamento próximo de zero" de novo — um dashboard completo não é compatível com esse orçamento no piloto de um bairro só.
