# Roteiro da demo — Prato Cheio

*Trabalho 3 · 3 minutos · outra pessoa precisa conseguir reproduzir só lendo isto*

## Antes de começar

Funciona **sem internet** (ADR 0002): o PostgreSQL 16 roda instalado no notebook.

1. Garanta que o serviço do PostgreSQL 16 está ligado e que existem o usuário `pratocheio`
   (senha `pratocheio`) e o banco `pratocheio`. Se não existirem, crie-os uma vez:

   ```sql
   CREATE USER pratocheio WITH PASSWORD 'pratocheio' CREATEDB;
   CREATE DATABASE pratocheio OWNER pratocheio;
   ```

2. **Banco limpo para a demo** (a migração não apaga dados que sobraram de outro teste):

   ```sql
   DROP DATABASE pratocheio;
   CREATE DATABASE pratocheio OWNER pratocheio;
   ```

3. Na pasta do projeto:

   ```bash
   npm install
   npm run db:migrar   # imprime "schema criado"
   npm start           # sobe em http://localhost:3000
   ```

   Não precisa de `.env`: a conexão padrão é a do `.env.example`
   (`postgres://pratocheio:pratocheio@localhost:5432/pratocheio`). Para outro servidor,
   defina `DATABASE_URL` antes de `npm run db:migrar` e `npm start`.

4. Abra `http://localhost:3000` no navegador, em **modo celular** (F12 → ícone de
   dispositivos).

> As validades do roteiro (30/11 e 25/11/2026) precisam estar no futuro: a API recusa doação
> vencida. Depois de 25/11/2026, troque por datas posteriores.

## Roteiro (3 minutos)

| Tempo | O que mostrar | O que se prova |
|---|---|---|
| 0:00–0:20 | O problema em uma frase: "o restaurante tem comida sobrando e a ONG não sabe; quando sabe, outra já foi buscar." | por que o produto existe |
| 0:20–1:50 | Passos 1 a 5: publicar, ver, aceitar e coletar | o produto executa ponta a ponta |
| 1:50–2:30 | Passo 6: o erro tratado | o limite foi pensado |
| 2:30–3:00 | O que falta (abaixo) | vocês sabem onde estão |

## Passo a passo reproduzível

1. **Abrir a tela.** Ação: abrir `http://localhost:3000`.
   Resultado: em "Doações disponíveis" aparece *Nenhuma doação disponível.* e em
   "Aguardando coleta" aparece *Nenhuma doação aguardando coleta.*
2. **Doador publica o arroz.** Ação: em "Tipo de alimento" digitar `Arroz`, em "Quantidade"
   `10 kg`, em "Validade / retirar até" escolher `30/11/2026` e tocar **Publicar**.
   Resultado: aparece *Doação publicada: Arroz.*, os campos são limpos e
   *Arroz — 10 kg (até 2026-11-30)* aparece em "Doações disponíveis".
3. **Doador publica o leite.** Ação: repetir com `Leite`, `12 L`, `25/11/2026`.
   Resultado: *Arroz* aparece antes de *Leite* (ordem de publicação).
4. **ONG aceita o arroz.** Ação: em "Sua ONG" digitar `Casa Esperança` e tocar **Aceitar**
   na linha do Arroz.
   Resultado: aparece *Doação aceita: Arroz. Ela foi para "Aguardando coleta".*; o Arroz sai
   de "Doações disponíveis" (fica só o Leite) e aparece em "Aguardando coleta" como
   *Arroz — 10 kg (aceita por Casa Esperança)*.
5. **Voluntário confirma a coleta.** Ação: tocar **Coletada** na linha do Arroz.
   Resultado: o Arroz some de "Aguardando coleta". Para conferir o efeito: escolher o mês
   atual (`11/2026`) em "Mês" e tocar **Ver relatório** → *1 doação coletada (Casa Esperança: 1)*.
6. **Caso de erro: aceitar sem dizer quem é a ONG.** Ação: apagar o texto de "Sua ONG" e
   tocar **Aceitar** na linha do Leite.
   Resultado: aparece *Informe o nome da sua ONG antes de aceitar.* e o Leite continua em
   "Doações disponíveis".
7. **Caso de erro no servidor (opcional, 20 s).** Ação: em "Tipo de alimento" digitar `Pão`,
   deixar "Quantidade" vazia, escolher a validade `25/11/2026` e tocar **Publicar**.
   Resultado: aparece *campos obrigatórios ausentes: quantidade* e nada novo entra na lista.

## O que falta, dito na demo

- O doador **não tem botão de cancelar** na tela: o cancelamento existe na API
  (`POST /api/doacoes/:id/cancelar`) e tem teste, mas a interface ainda não o oferece.
- O filtro por tipo (história #7) existe na API (`?tipo=Sopa`); a tela ainda não o usa.
- Sem autenticação: "qual ONG aceitou" é o texto digitado, como registrado na Decisão de
  análise do `docs/analise.md`.

## Testado por

Outro integrante executou este roteiro sem ajuda: **[nome]**, em **[data]**.
O que mudou depois do teste: **[o que travou e como foi corrigido; "nada" se não travou]**.
Se ele travou em algum passo, o roteiro está incompleto — corrija antes de entregar.
