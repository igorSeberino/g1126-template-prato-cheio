# Documento de Análise — Prato Cheio

*Trabalho 1 · máximo 4 páginas · entrega na Aula 5*

## Problema central

## Incertezas

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
**História X** — Dado … Quando … Então …

## Riscos
| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|

## Hipótese e experimento

## Decisão de análise
- **Problema:**
- **Alternativas:**
- **Decisão e justificativa:**
- **Riscos e limitações:**

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
