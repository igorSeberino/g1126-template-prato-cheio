# Documento de Projeto — Prato Cheio

*Trabalho 2 · máximo 4 páginas (fora diagramas) · entrega na Aula 10*

## Decisões de projeto

| # | Decisão | Alternativas | Requisito/risco da Análise que a motiva |
|---|---|---|---|
| D1 | Como o sistema garante que uma doação aceita não fique disponível para outra ONG | **A** — guarda atômica na própria escrita: `UPDATE ... WHERE id = ? AND status = 'disponivel'`, decidindo pelo número de linhas alteradas · **B** — transação explícita serializando leitura e escrita (`BEGIN IMMEDIATE` no SQLite, `SELECT ... FOR UPDATE` no PostgreSQL) | **Regra de negócio central:** "uma doação aceita por uma ONG não pode ficar disponível para outra ONG — garantida de forma atômica no banco, não apenas checada no código". Também o 2º critério de aceite da História #6 (a segunda ONG é recusada). |
| D2 | Como a ONG se identifica no momento do aceite | **A** — campo `ong` obrigatório no corpo de `POST /api/doacoes/:id/aceitar`, texto declarado e sem autenticação · **B** — cadastro de ONGs em tabela + código de acesso por ONG, validado no servidor | **Risco #2 da Análise** (probabilidade alta, impacto médio): "a fatia mínima não identifica a ONG: qualquer requisição HTTP publica ou aceita uma doação, então uma medição de 'qual ONG aceitou' pode sair errada no piloto". Liga também ao **objetivo de impacto 3** (dados confiáveis de impacto). |
| D3 | Como representar a `quantidade` para o relatório mensal da Marta | **A** — manter `quantidade` como texto livre e o relatório somar contagem de doações coletadas e os tempos, não volume · **B** — trocar por `quantidade_valor` (número) + `quantidade_unidade` (kg / litros / porções / unidades), com migração dos registros existentes | **História #4 falha em Estimável** ("ninguém sabe o tamanho: quantidade hoje é texto livre") e a **incerteza** registrada: "se a quantidade deve virar uma unidade padronizada ou seguir como texto livre". Atende o **objetivo de impacto 3**. |

### D1 — decisão e justificativa

**Decidimos a alternativa A.** Uma única instrução resolve a corrida entre duas ONGs sem
espalhar controle de transação pela camada de regra; a mesma instrução funciona igual em
SQLite (U1 e U2) e em PostgreSQL (U3), então a migração da Unidade 3 não mexe nela; e ela
é testável sem concorrência real — basta chamar `aceitar` duas vezes e exigir que a
segunda falhe, que é exatamente o critério de aceite escrito na Análise. A alternativa B
só se paga quando o aceite precisar alterar mais de uma tabela na mesma operação (por
exemplo, gravar um histórico de coleta junto); enquanto for uma linha, é custo sem ganho.

**O que abrimos mão:** a mensagem de erro amigável ("doação já foi aceita por outra ONG")
vem de uma leitura anterior ao `UPDATE`, que pode estar desatualizada no instante da
corrida. Por isso a guarda do `UPDATE` é verificada de novo em `doacoes.aceitar` — a
leitura serve à mensagem, não à garantia. Se um dia o aceite virar uma operação de várias
tabelas, esta decisão é revista e vira B.

### D2 — decisão e justificativa

**Decidimos a alternativa A para a Unidade 2**, com a B registrada como decisão **adiada,
não descartada**. Hoje o servidor assume `'ONG'` por padrão quando o corpo não traz o
campo, e é isso que torna a medição do piloto não confiável: tornar `ong` obrigatório
custa um PR pequeno e já elimina o registro genérico que o Risco #2 aponta. A alternativa
B entrega um dado verificável, mas exige uma decisão operacional que o caso **não define**
— quem cadastra as ONGs e como entrega o código a elas — e cria um segredo compartilhado
para guardar e resetar, tudo isso enquanto a autenticação definitiva segue como incerteza
aberta na Análise. Decidir B agora é decidir autenticação por acidente.

**Condição de disparo para passar a B** (para não virar adiamento indefinido): se, nas 10
doações reais do experimento da hipótese, mais de 2 aceites chegarem com nome de ONG
inválido, em branco ou duplicado, a alternativa B entra na iteração seguinte.

### D3 — decisão e justificativa

**Decidimos a alternativa A.** Os três objetivos de impacto da Análise medem **tempo** e
**proporção coletada**, não volume — e o experimento da hipótese (mediana de
publicação → aceite contra aceite → coleta) não usa a quantidade em nenhum cálculo. A
alternativa B resolveria um problema que ainda não temos e cobraria o preço no ponto mais
sensível do caso: o doador publica pelo celular, com conexão instável e comida perecível
na mão — obrigá-lo a escolher unidade em uma lista é atrito onde a urgência não permite.
`quantidade` continua texto livre porque é assim que o doador já pensa ("10 porções",
"2 kg"), e a rastreabilidade que a vigilância sanitária cobra é satisfeita por o campo
existir e estar preenchido, não por ele ser numérico.

**O que abrimos mão:** o relatório da Marta não soma volume — só conta doações coletadas
e os tempos. **Condição de disparo para B:** se um patrocinador pedir volume total por
escrito, a migração entra como ADR próprio, porque aí mexe em schema com dados em produção.

## Tabela de trade-offs (uma decisão em detalhe)

Detalhamos a **D2** — é a decisão cuja resposta não era óbvia (D1 e D3 têm uma alternativa
claramente mais barata) e a única das três ligada a um risco da Unidade 1 que continua
**aberto**.

| Critério | A — campo `ong` obrigatório (declarado) | B — cadastro de ONGs + código de acesso |
|---|---|---|
| Confiabilidade do dado "qual ONG aceitou" (Risco #2, objetivo 3) | **Baixa** — o nome é declarado, não verificado; elimina o `'ONG'` genérico de hoje, mas não impede erro de digitação ou nome inventado | **Alta** — só uma ONG cadastrada consegue aceitar, e o registro serve de evidência |
| Custo de implementação até a Aula 10 | **1 PR pequeno** — tornar o campo obrigatório na regra, 1 teste, ajuste no `public/index.html` | **2+ PRs** — tabela, migração, rota de validação, tela de entrada do código |
| Custo de infraestrutura (restrição: orçamento perto de zero) | **Zero** | Zero em servidor, mas **custo operacional humano**: alguém cadastra as ONGs e distribui os códigos, papel que o caso não atribui a ninguém |
| Atrito no momento do aceite (comida perecível, "quem responde primeiro leva") | **Baixo** — um campo a mais, preenchido uma vez | **Médio/alto** — ONG sem o código em mãos não aceita; a doação espera |
| Superfície de segurança e dados que passa a existir | **Nenhuma** — nada de credencial guardada | Passa a guardar **segredo compartilhado** — exige hash e um processo de reset para não virar dívida |
| Risco de retrabalho quando a autenticação for definida (incerteza aberta) | **Baixo** — o campo `ong` continua existindo em qualquer cenário; muda só quem o preenche | **Alto** — se a autenticação definitiva for outra (login por e-mail, por exemplo), o código de acesso é trabalho jogado fora |
| Testabilidade no CI | **Direta** — aceite sem o campo devolve 400, em um teste | Exige **fixture** de ONG cadastrada em todo teste de aceite |

**Leitura da tabela:** B ganha em um único critério — o mais importante deles, a
confiabilidade do dado. Escolhemos A mesmo assim porque o piloto é de **um bairro só**,
com ONGs conhecidas: o nome declarado é conferível fora do sistema, e a confiabilidade que
falta pode ser recuperada manualmente nas 10 doações do experimento. Já o retrabalho da
linha 6 e a decisão operacional em aberto da linha 3 **não** são recuperáveis depois.

## Diagramas
(contexto + dados ou componentes — em `docs/` ou como imagem)

## ADRs
Ver `docs/adr/`.

## Requisitos não-funcionais
| Requisito | Como afeta o design |
|---|---|

## Critérios de validação do projeto

## Uso de IA
