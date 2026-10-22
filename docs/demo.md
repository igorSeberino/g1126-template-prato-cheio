# Roteiro da demo — Prato Cheio

*Trabalho 3 · 3 minutos · outra pessoa precisa conseguir reproduzir só lendo isto*

## Antes de começar

```bash
npm install
npm run db:migrar
npm start
```

### Ensaio offline (ADR 0002)

A demo é ao vivo, num notebook sorteado na hora, sem rede garantida. Antes da aula da demo,
**cada integrante** faz no próprio notebook, com o Wi-Fi desligado e o PostgreSQL 16 local no
ar (usuário, senha e banco do `.env.example`):

```bash
npm run db:migrar && npm test && npm start
curl --fail http://localhost:3000/api/saude   # deve responder {"ok":true}
```

| Integrante | Data do ensaio | 7/7 testes? | `/api/saude` ok? |
|---|---|:--:|:--:|
| Adrian Cesar Gonçalves |  |  |  |
| Diego Nessler |  |  |  |
| Gabriel Carvalho |  |  |  |
| Igor Thiago Seberino |  |  |  |
| Renato Colin Neto |  |  |  |

## Roteiro (3 minutos)

| Tempo | O que mostrar | O que se prova |
|---|---|---|
| 0:00–0:20 | O problema em uma frase | por que o produto existe |
| 0:20–1:50 | A história funcionando de verdade | o produto executa ponta a ponta |
| 1:50–2:30 | Um caso de erro tratado | o limite foi pensado |
| 2:30–3:00 | O que falta e por quê | vocês sabem onde estão |

## Passo a passo reproduzível

1. (ação exata: o que clicar ou qual requisição fazer)
2. (o que deve acontecer)
3. …

## Testado por

Outro integrante executou este roteiro sem ajuda: **[nome]**, em **[data]**.
Se ele travou em algum passo, o roteiro está incompleto — corrija antes de entregar.
