# Diagrama de contexto — Prato Cheio

**Pergunta:** quem troca informação com o Prato Cheio, o que cada um entrega e recebe, e onde termina o sistema?

**Decisão que sustenta:** D2 e a decisão de análise A (fatia mínima, sem autenticação) — nenhum ator faz login; o sistema confia no nome que a ONG declara no aceite.

**Situação:** retrato da `main` no commit `cb16555`. Só a seta tracejada (relatório para a Marta) é proposta: o relatório mensal ainda não existe.

```mermaid
flowchart LR
    doador["Doador<br/>(restaurante / padaria)<br/>celular, conexão instável"]
    ong["ONG receptora"]
    voluntario["Voluntário entregador<br/>celular, na rua"]
    sistema(["Prato Cheio<br/>(API + tela web + banco)"])
    marta["Marta<br/>coordenadora / patrocinadora"]
    vigilancia["Vigilância sanitária<br/>(regulador)"]

    doador -->|"publica doação: tipo, quantidade, validade"| sistema
    sistema -->|"lista doações disponíveis, da mais antiga à mais recente"| ong
    ong -->|"aceita doação informando o nome da ONG"| sistema
    sistema -->|"lista doações aceitas aguardando coleta"| voluntario
    voluntario -->|"confirma coleta com o horário do evento"| sistema
    vigilancia -->|"exige tipo, quantidade e validade em toda doação"| sistema
    sistema -->|"registro de cada doação, em caso de fiscalização"| vigilancia
    sistema -.->|"proposta: relatório mensal de doações coletadas"| marta
```

**Elementos:** 6 (limite: 9). **Fora da fronteira:** o canal de aviso à ONG (história #8, canal ainda não escolhido) e a planilha do experimento da hipótese, preenchida à mão.
