import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from 'vitest';
import request from 'supertest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { criarApp, responderErro } from '../src/app.js';
import { migrar, limparBanco, encerrar, query } from '../src/db.js';

const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite');

const app = criarApp();

// Este teste já passa e não depende do banco:
// prova que a aplicação sobe e que o CI está funcionando.
describe('a aplicação sobe', () => {
  it('responde na verificação de saúde', async () => {
    const res = await request(app).get('/api/saude');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Walking skeleton — cada teste abaixo é um critério de aceite do docs/analise.md.
// O banco na Unidade 1 é SQLite em memória: nada a instalar, nada a subir.
// ---------------------------------------------------------------------------

beforeEach(async () => {
  await migrar();
  await limparBanco();
});
afterAll(async () => {
  await encerrar();
});

// Validade bem no futuro: doação vencida não é publicada, e uma data próxima faria os testes
// quebrarem sozinhos quando ela passasse.
const doacaoValida = { tipo: 'Sopa', quantidade: '10 porções', validade: '2099-12-31' };

// Congela só o relógio do JavaScript (Date), para testes que dependem de "hoje" ou "agora".
// O datetime('now') do SQLite continua no relógio real — por isso esses testes gravam o
// criada_em direto no banco quando ele importa.
function congelarRelogio(instante) {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(instante));
}
afterEach(() => {
  vi.useRealTimers();
});

describe('publicar e listar doações', () => {
  // Critério de aceite — História #1
  // Dado que os três campos (tipo, quantidade, validade) estão preenchidos
  // Quando o doador publica
  // Então a doação aparece na lista de disponíveis
  it('mostra a doação publicada na lista de disponíveis', async () => {
    await request(app).post('/api/doacoes').send(doacaoValida);

    const res = await request(app).get('/api/doacoes');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].tipo).toBe('Sopa');
  });

  // Critério de aceite — História #1 (caminho proibido)
  // Dado que falta um campo obrigatório
  // Quando o doador tenta publicar
  // Então o sistema recusa e aponta o campo faltante
  it('recusa doação sem os campos obrigatórios', async () => {
    const { validade, ...semValidade } = doacaoValida;
    const res = await request(app).post('/api/doacoes').send(semValidade);

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/validade/);
  });

  // Critério de aceite — História #2
  // Dado que existem duas doações publicadas em momentos diferentes e ainda não aceitas
  // Quando a ONG abre a lista de disponíveis
  // Então elas aparecem da mais antiga para a mais recente
  it('lista as doações na ordem de publicação', async () => {
    await request(app).post('/api/doacoes').send({ ...doacaoValida, tipo: 'Arroz' });
    await request(app).post('/api/doacoes').send({ ...doacaoValida, tipo: 'Feijão' });

    const res = await request(app).get('/api/doacoes');
    expect(res.body.map((d) => d.tipo)).toEqual(['Arroz', 'Feijão']);
  });
});

describe('aceitar uma doação', () => {
  async function publicar(dados = doacaoValida) {
    const res = await request(app).post('/api/doacoes').send(dados);
    return res.body.id;
  }

  // Critério de aceite — História #6 (história zero)
  // Dado que existe uma doação publicada e ainda não aceita
  // Quando a ONG aceita
  // Então a doação passa a constar como aceita por aquela ONG
  it('marca a doação como aceita pela ONG', async () => {
    const id = await publicar();

    const res = await request(app)
      .post(`/api/doacoes/${id}/aceitar`)
      .send({ ong: 'ONG A' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('aceita');
    expect(res.body.ong).toBe('ONG A');
  });

  // Critério de aceite — História #6 (história zero)
  // Dado que existe uma doação publicada e ainda não aceita
  // Quando a ONG aceita
  // Então a doação sai da lista de disponíveis
  it('remove a doação da lista de disponíveis depois de aceita', async () => {
    const id = await publicar();
    await request(app).post(`/api/doacoes/${id}/aceitar`).send({ ong: 'ONG A' });

    const res = await request(app).get('/api/doacoes');
    expect(res.body).toHaveLength(0);
  });

  // Critério de aceite — História #6 (história zero, caminho proibido)
  // Dado que uma doação já foi aceita por uma ONG
  // Quando uma segunda ONG tenta aceitá-la
  // Então o sistema recusa e a doação continua com a primeira ONG
  it('recusa aceitar uma doação que já foi aceita por outra ONG', async () => {
    const id = await publicar();
    await request(app).post(`/api/doacoes/${id}/aceitar`).send({ ong: 'ONG A' });

    const res = await request(app)
      .post(`/api/doacoes/${id}/aceitar`)
      .send({ ong: 'ONG B' });

    expect(res.status).toBe(400);
  });

  // Regra central do caso sob corrida (ADR 0001 · requisito não-funcional 2)
  // Dado que existe uma doação publicada e ainda não aceita
  // Quando duas ONGs a aceitam ao mesmo tempo
  // Então exatamente uma leva e a outra é recusada
  it('aceita só uma de duas tentativas simultâneas', async () => {
    const id = await publicar();

    const respostas = await Promise.all([
      request(app).post(`/api/doacoes/${id}/aceitar`).send({ ong: 'ONG A' }),
      request(app).post(`/api/doacoes/${id}/aceitar`).send({ ong: 'ONG B' }),
    ]);

    expect(respostas.map((r) => r.status).sort()).toEqual([200, 400]);
    const lista = await request(app).get('/api/doacoes');
    expect(lista.body).toHaveLength(0);
  });
});

describe('a ONG se identifica no aceite (decisão D2)', () => {
  // Critério de aceite — decisão D2 / Risco #2 da Análise
  // Dado que existe uma doação disponível
  // Quando uma ONG tenta aceitá-la sem informar o nome
  // Então o sistema recusa e a doação continua disponível
  it('recusa o aceite sem o nome da ONG e a doação continua disponível', async () => {
    const { body } = await request(app).post('/api/doacoes').send(doacaoValida);

    const semNome = await request(app).post(`/api/doacoes/${body.id}/aceitar`).send({});
    const emBranco = await request(app)
      .post(`/api/doacoes/${body.id}/aceitar`)
      .send({ ong: '   ' });

    expect(semNome.status).toBe(400);
    expect(semNome.body.erro).toMatch(/nome da ONG/);
    expect(emBranco.status).toBe(400);
    const lista = await request(app).get('/api/doacoes');
    expect(lista.body.map((d) => d.id)).toContain(body.id);
  });

  // Critério de aceite — decisão D2 (nome digitado à mão)
  // Dado que a ONG digitou o nome com espaços sobrando
  // Quando ela aceita a doação
  // Então o nome é gravado sem os espaços extras
  it('grava o nome da ONG sem espaços sobrando', async () => {
    const { body } = await request(app).post('/api/doacoes').send(doacaoValida);

    const res = await request(app)
      .post(`/api/doacoes/${body.id}/aceitar`)
      .send({ ong: '  ONG   Bairro Alegre ' });

    expect(res.status).toBe(200);
    expect(res.body.ong).toBe('ONG Bairro Alegre');
  });
});

describe('voluntário marca a doação como coletada', () => {
  async function publicarEAceitar() {
    const { body } = await request(app).post('/api/doacoes').send(doacaoValida);
    await request(app).post(`/api/doacoes/${body.id}/aceitar`).send({ ong: 'ONG A' });
    return body.id;
  }

  // Critério de aceite — História #3
  // Dado que uma doação foi aceita por uma ONG
  // Quando o voluntário marca a doação como coletada
  // Então ela passa a constar como coletada, com o horário gravado, e sai da lista de busca
  it('marca a doação aceita como coletada e grava o horário', async () => {
    const id = await publicarEAceitar();
    const aguardando = await request(app).get('/api/doacoes/aceitas');
    expect(aguardando.body.map((d) => d.id)).toContain(id);

    const res = await request(app).post(`/api/doacoes/${id}/coletar`).send({});

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('coletada');
    expect(res.body.ong).toBe('ONG A');
    expect(Date.parse(res.body.coletada_em)).not.toBeNaN();
    const depois = await request(app).get('/api/doacoes/aceitas');
    expect(depois.body.map((d) => d.id)).not.toContain(id);
  });

  // Critério de aceite — História #3 (conexão instável)
  // Dado que o voluntário confirmou a coleta sem sinal e o celular enviou mais tarde
  // Quando a confirmação chega ao servidor
  // Então o horário gravado é o do evento, não o da sincronização
  it('grava o horário do evento enviado pelo celular, não o da sincronização', async () => {
    const id = await publicarEAceitar();
    await query('UPDATE doacoes SET criada_em = ? WHERE id = ?', ['2026-10-21 12:00:00', id]);
    const horarioDoEvento = '2026-10-21T14:30:00.000Z';

    const res = await request(app)
      .post(`/api/doacoes/${id}/coletar`)
      .send({ coletada_em: horarioDoEvento });

    expect(res.body.coletada_em).toBe(horarioDoEvento);
  });

  // Critério de aceite — História #3 (caminho proibido)
  // Dado que a doação ainda não foi aceita por nenhuma ONG
  // Quando alguém tenta marcá-la como coletada
  // Então o sistema recusa e ela continua disponível
  it('recusa marcar como coletada uma doação que ainda não foi aceita', async () => {
    const { body } = await request(app).post('/api/doacoes').send(doacaoValida);

    const res = await request(app).post(`/api/doacoes/${body.id}/coletar`).send({});

    expect(res.status).toBe(400);
    const lista = await request(app).get('/api/doacoes');
    expect(lista.body.map((d) => d.id)).toContain(body.id);
  });

  // Critério de aceite — História #3 (horário impossível)
  // Dado que uma doação foi publicada e aceita
  // Quando o celular envia um horário de coleta anterior à publicação
  // Então o sistema recusa e a doação continua aguardando coleta
  it('recusa um horário de coleta anterior à publicação da doação', async () => {
    const id = await publicarEAceitar();

    const res = await request(app)
      .post(`/api/doacoes/${id}/coletar`)
      .send({ coletada_em: '2020-01-01T10:00:00.000Z' });

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/anterior à publicação/);
    const aguardando = await request(app).get('/api/doacoes/aceitas');
    expect(aguardando.body.map((d) => d.id)).toContain(id);
  });

  // Critério de aceite — História #3 (relógio do celular errado)
  // Dado que uma doação foi publicada e aceita
  // Quando o celular envia um horário de coleta mais de 5 minutos no futuro
  // Então o sistema recusa e a doação continua aguardando coleta
  it('recusa um horário de coleta no futuro', async () => {
    const id = await publicarEAceitar();
    const daquiAUmaHora = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    const res = await request(app)
      .post(`/api/doacoes/${id}/coletar`)
      .send({ coletada_em: daquiAUmaHora });

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/futuro/);
    const aguardando = await request(app).get('/api/doacoes/aceitas');
    expect(aguardando.body.map((d) => d.id)).toContain(id);
  });
});

describe('doador cancela uma doação disponível (decisão D4)', () => {
  // Critério de aceite — decisão D4
  // Dado uma doação disponível
  // Quando o doador a cancela
  // Então ela fica com status cancelada e sai da lista de disponíveis
  it('cancela a doação disponível e remove da lista de disponíveis', async () => {
    const { body } = await request(app).post('/api/doacoes').send(doacaoValida);

    const res = await request(app).post(`/api/doacoes/${body.id}/cancelar`).send();

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('cancelada');
    const lista = await request(app).get('/api/doacoes');
    expect(lista.body.map((d) => d.id)).not.toContain(body.id);
  });

  // Critério de aceite — decisão D4 (caminho proibido)
  // Dado uma doação já aceita por uma ONG
  // Quando o doador tenta cancelá-la
  // Então o sistema recusa e a doação continua aceita por aquela ONG
  it('recusa cancelar uma doação que já foi aceita', async () => {
    const { body } = await request(app).post('/api/doacoes').send(doacaoValida);
    await request(app).post(`/api/doacoes/${body.id}/aceitar`).send({ ong: 'ONG A' });

    const res = await request(app).post(`/api/doacoes/${body.id}/cancelar`).send();

    expect(res.status).toBe(400);
    const aceitas = await request(app).get('/api/doacoes/aceitas');
    expect(aceitas.body.map((d) => d.id)).toContain(body.id);
  });

  // Critério de aceite — decisão D4 (doação inexistente)
  // Dado que a doação não existe
  // Quando alguém tenta cancelá-la
  // Então o sistema devolve 404
  it('devolve 404 ao tentar cancelar uma doação inexistente', async () => {
    const res = await request(app).post('/api/doacoes/999999/cancelar').send();

    expect(res.status).toBe(404);
  });

  // Regra sob corrida, mesma guarda atômica da D1
  // Dado uma doação disponível
  // Quando o doador tenta cancelá-la ao mesmo tempo em que uma ONG a aceita
  // Então exatamente uma das duas tentativas é aceita, nunca as duas
  it('sob corrida com o aceite, só uma das duas tentativas é aceita', async () => {
    const { body } = await request(app).post('/api/doacoes').send(doacaoValida);

    const respostas = await Promise.all([
      request(app).post(`/api/doacoes/${body.id}/cancelar`).send(),
      request(app).post(`/api/doacoes/${body.id}/aceitar`).send({ ong: 'ONG A' }),
    ]);

    expect(respostas.map((r) => r.status).sort()).toEqual([200, 400]);
    const { rows } = await query('SELECT status FROM doacoes WHERE id = ?', [body.id]);
    expect(['cancelada', 'aceita']).toContain(rows[0].status);
  });
});

describe('vigilância sanitária: doação vencida', () => {
  // 22/10/2026 às 22h em Brasília — em UTC já é dia 23.
  beforeEach(() => congelarRelogio('2026-10-23T01:00:00Z'));

  // Critério de aceite — vigilância sanitária (publicação)
  // Dado que a validade informada já passou ou não é uma data
  // Quando o doador tenta publicar
  // Então o sistema recusa e nada entra na lista
  it('recusa publicar doação vencida ou com validade que não é data', async () => {
    const vencida = await request(app)
      .post('/api/doacoes')
      .send({ ...doacaoValida, validade: '2026-10-21' });
    const naoEhData = await request(app)
      .post('/api/doacoes')
      .send({ ...doacaoValida, validade: 'amanhã' });
    const diaQueNaoExiste = await request(app)
      .post('/api/doacoes')
      .send({ ...doacaoValida, validade: '2026-02-30' });

    expect(vencida.status).toBe(400);
    expect(vencida.body.erro).toMatch(/já passou/);
    expect(naoEhData.status).toBe(400);
    expect(diaQueNaoExiste.status).toBe(400);
    const lista = await request(app).get('/api/doacoes');
    expect(lista.body).toHaveLength(0);
  });

  // Critério de aceite — vigilância sanitária (lista e aceite)
  // Dado uma doação com validade de hoje (em Brasília) e outra que venceu ontem
  // Quando a ONG abre a lista e tenta aceitar a vencida
  // Então só a de hoje aparece, e o aceite da vencida é recusado
  it('mostra a doação que vence hoje, esconde a vencida e recusa aceitá-la', async () => {
    const hoje = await request(app)
      .post('/api/doacoes')
      .send({ ...doacaoValida, tipo: 'Pão', validade: '2026-10-22' });
    // Publicada quando ainda estava na validade; venceu depois.
    await query("INSERT INTO doacoes (tipo, quantidade, validade) VALUES ('Leite', '3 L', '2026-10-21')");
    const { rows } = await query("SELECT id FROM doacoes WHERE tipo = 'Leite'");

    const lista = await request(app).get('/api/doacoes');
    const aceite = await request(app)
      .post(`/api/doacoes/${rows[0].id}/aceitar`)
      .send({ ong: 'ONG A' });

    expect(hoje.status).toBe(201);
    expect(lista.body.map((d) => d.tipo)).toEqual(['Pão']);
    expect(aceite.status).toBe(400);
    expect(aceite.body.erro).toMatch(/vencida/);
  });
});

describe('a API só aceita os dados no formato certo', () => {
  // Dado que um campo chega como objeto ou lista, e não como texto
  // Quando alguém publica, aceita ou pede o relatório
  // Então o sistema recusa com uma mensagem clara, sem detalhe interno, e nada é gravado
  it('recusa campos que não são texto, sem gravar nada', async () => {
    const tipoObjeto = await request(app)
      .post('/api/doacoes')
      .send({ ...doacaoValida, tipo: { a: 1 } });
    const { body } = await request(app).post('/api/doacoes').send(doacaoValida);
    const ongLista = await request(app)
      .post(`/api/doacoes/${body.id}/aceitar`)
      .send({ ong: ['ONG A', 'ONG B'] });
    const mesRepetido = await request(app).get('/api/relatorios/mensal?mes=2026-10&mes=2026-11');

    expect(tipoObjeto.status).toBe(400);
    expect(tipoObjeto.body.erro).toBe('o campo tipo precisa ser texto');
    expect(ongLista.status).toBe(400);
    expect(ongLista.body.erro).toBe('o campo ong precisa ser texto');
    expect(mesRepetido.status).toBe(400);
    const lista = await request(app).get('/api/doacoes');
    expect(lista.body.map((d) => d.id)).toEqual([body.id]);
  });

  // Dado que o corpo do pedido não é um JSON válido
  // Quando o doador tenta publicar
  // Então o sistema responde 400 em JSON (e não uma página de erro em HTML)
  it('responde 400 em JSON quando o corpo não é JSON válido', async () => {
    const res = await request(app)
      .post('/api/doacoes')
      .set('Content-Type', 'application/json')
      .send('{"tipo": "Sopa",');

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/JSON/);
  });

  // Dado que a doação pedida não existe
  // Quando alguém tenta aceitá-la ou marcá-la como coletada
  // Então o sistema responde 404
  it('responde 404 para doação que não existe', async () => {
    const aceite = await request(app).post('/api/doacoes/999/aceitar').send({ ong: 'ONG A' });
    const coleta = await request(app).post('/api/doacoes/999/coletar').send({});

    expect(aceite.status).toBe(404);
    expect(coleta.status).toBe(404);
  });

  // Dado que acontece um erro inesperado (ex.: o banco falha)
  // Quando a API responde
  // Então devolve 500, sem expor SQL nem detalhe interno ao cliente
  it('responde 500 sem expor o detalhe de um erro inesperado', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = {
      status(codigo) { this.statusCode = codigo; return this; },
      json(corpo) { this.body = corpo; return this; }
    };

    responderErro(res, new Error('SQLITE_ERROR: no such table: doacoes'));

    expect(res.statusCode).toBe(500);
    expect(res.body.erro).not.toMatch(/SQLITE|doacoes/);
    vi.restoreAllMocks();
  });
});

describe('ONG filtra as doações disponíveis por tipo (história #7)', () => {
  // Critério de aceite — História #7, fatia 1
  // Dado que existem doações disponíveis de tipos variados (uma Sopa e um Pão)
  // Quando a ONG pede a lista com ?tipo=Sopa
  // Então só a doação do tipo Sopa aparece
  it('mostra só as doações do tipo filtrado', async () => {
    await request(app).post('/api/doacoes').send(doacaoValida);
    await request(app).post('/api/doacoes').send({ ...doacaoValida, tipo: 'Pão' });

    const res = await request(app).get('/api/doacoes?tipo=Sopa');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].tipo).toBe('Sopa');
  });

  // Critério de aceite — História #7, fatia 1 (ordem de publicação)
  // Dado que foram publicadas, nesta ordem, uma Sopa, um Pão e outra Sopa
  // Quando a ONG pede a lista com ?tipo=Sopa
  // Então as duas Sopas aparecem na ordem em que foram publicadas
  it('mantém a ordem de publicação dentro do tipo filtrado', async () => {
    await request(app).post('/api/doacoes').send({ ...doacaoValida, quantidade: '1' });
    await request(app).post('/api/doacoes').send({ ...doacaoValida, tipo: 'Pão' });
    await request(app).post('/api/doacoes').send({ ...doacaoValida, quantidade: '2' });

    const res = await request(app).get('/api/doacoes?tipo=Sopa');

    expect(res.body.map((d) => d.quantidade)).toEqual(['1', '2']);
  });

  // Critério de aceite — História #7, fatia 1 (doação aceita sai do filtro)
  // Dado que existem duas Sopas e um Pão, e a primeira Sopa já foi aceita por uma ONG
  // Quando a ONG pede a lista com ?tipo=Sopa
  // Então só a segunda Sopa aparece
  it('não mostra doação do tipo filtrado que já foi aceita', async () => {
    const primeira = await request(app).post('/api/doacoes').send(doacaoValida);
    const segunda = await request(app).post('/api/doacoes').send(doacaoValida);
    await request(app).post('/api/doacoes').send({ ...doacaoValida, tipo: 'Pão' });
    await request(app).post(`/api/doacoes/${primeira.body.id}/aceitar`).send({ ong: 'ONG A' });

    const res = await request(app).get('/api/doacoes?tipo=Sopa');

    expect(res.body.map((d) => d.id)).toEqual([segunda.body.id]);
  });

  // Critério de aceite — História #7, fatia 1 (sem filtro)
  // Dado que existem uma Sopa e um Pão disponíveis
  // Quando a ONG pede a lista sem ?tipo=
  // Então as doações dos dois tipos aparecem, na ordem de publicação
  it('sem filtro, mostra as doações de todos os tipos', async () => {
    await request(app).post('/api/doacoes').send(doacaoValida);
    await request(app).post('/api/doacoes').send({ ...doacaoValida, tipo: 'Pão' });

    const res = await request(app).get('/api/doacoes');

    expect(res.body.map((d) => d.tipo)).toEqual(['Sopa', 'Pão']);
  });

  // Limite — História #7, fatia 1 (tipo sem doação)
  // Dado que só existe uma Sopa disponível
  // Quando a ONG pede a lista com ?tipo=Feijão
  // Então a lista volta vazia
  it('tipo sem nenhuma doação disponível devolve lista vazia', async () => {
    await request(app).post('/api/doacoes').send(doacaoValida);

    const res = await request(app).get('/api/doacoes?tipo=Feijão');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  // Limite — História #7, fatia 1 (vencida não aparece no filtro)
  // Dado uma Sopa com validade de hoje e outra com validade longe, e o relógio avança um dia
  // Quando a ONG pede a lista com ?tipo=Sopa
  // Então só a Sopa de validade longe aparece
  it('não mostra doação vencida do tipo filtrado', async () => {
    congelarRelogio('2026-10-22T15:00:00Z'); // 22/10 ao meio-dia em Brasília
    const venceHoje = await request(app)
      .post('/api/doacoes')
      .send({ ...doacaoValida, validade: '2026-10-22' });
    const venceLonge = await request(app).post('/api/doacoes').send(doacaoValida);
    vi.setSystemTime(new Date('2026-10-23T15:00:00Z')); // um dia depois: a de hoje venceu

    const res = await request(app).get('/api/doacoes?tipo=Sopa');

    expect(venceHoje.status).toBe(201);
    expect(res.body.map((d) => d.id)).toEqual([venceLonge.body.id]);
  });
});

describe('relatório mensal da Marta (história #4)', () => {
  // As coletas dos testes são de setembro a outubro de 2026: "agora" fica depois delas,
  // para o teste não depender do dia em que roda.
  beforeEach(() => congelarRelogio('2026-12-01T12:00:00Z'));

  // Publica, aceita e coleta uma doação, com horários controlados pelo teste.
  async function doacaoColetada({ ong, criadaEm, coletadaEm }) {
    const { body } = await request(app).post('/api/doacoes').send(doacaoValida);
    await query('UPDATE doacoes SET criada_em = ? WHERE id = ?', [criadaEm, body.id]);
    await request(app).post(`/api/doacoes/${body.id}/aceitar`).send({ ong });
    await request(app).post(`/api/doacoes/${body.id}/coletar`).send({ coletada_em: coletadaEm });
    return body.id;
  }

  // Critério de aceite — História #4
  // Dado que houve doações coletadas em outubro e em setembro, e uma aceita sem coleta
  // Quando a Marta pede o relatório de outubro
  // Então ele conta só as coletadas em outubro, por ONG, com a mediana de horas
  //      entre a publicação e a coleta
  it('conta só as doações coletadas no mês, por ONG, com o tempo até a coleta', async () => {
    await doacaoColetada({ ong: 'ONG A', criadaEm: '2026-10-05 12:00:00', coletadaEm: '2026-10-05T14:00:00.000Z' });
    await doacaoColetada({ ong: 'ONG A', criadaEm: '2026-10-10 08:00:00', coletadaEm: '2026-10-10T12:00:00.000Z' });
    await doacaoColetada({ ong: 'ONG B', criadaEm: '2026-10-20 09:00:00', coletadaEm: '2026-10-20T15:00:00.000Z' });
    await doacaoColetada({ ong: 'ONG B', criadaEm: '2026-09-15 09:00:00', coletadaEm: '2026-09-15T10:00:00.000Z' });
    const { body } = await request(app).post('/api/doacoes').send(doacaoValida);
    await request(app).post(`/api/doacoes/${body.id}/aceitar`).send({ ong: 'ONG C' });

    const res = await request(app).get('/api/relatorios/mensal?mes=2026-10');

    expect(res.status).toBe(200);
    expect(res.body.coletadas).toBe(3);
    expect(res.body.por_ong).toEqual({ 'ONG A': 2, 'ONG B': 1 });
    expect(res.body.mediana_horas_publicacao_ate_coleta).toBe(4); // 2 h, 4 h e 6 h
  });

  // Critério de aceite — História #4 (virada do mês)
  // Dado que uma doação foi coletada às 23h30 de 31/10 no horário de Brasília
  // Quando a Marta pede os relatórios de outubro e de novembro
  // Então a coleta conta em outubro, e não em novembro (em UTC já seria 1º/11)
  it('conta a coleta no mês de Brasília, mesmo quando em UTC já virou o mês', async () => {
    await doacaoColetada({ ong: 'ONG A', criadaEm: '2026-10-31 20:00:00', coletadaEm: '2026-10-31T23:30:00-03:00' });

    const outubro = await request(app).get('/api/relatorios/mensal?mes=2026-10');
    const novembro = await request(app).get('/api/relatorios/mensal?mes=2026-11');

    expect(outubro.body.coletadas).toBe(1);
    expect(novembro.body.coletadas).toBe(0);
    expect(novembro.body.mediana_horas_publicacao_ate_coleta).toBeNull();
  });

  // Critério de aceite — História #4 com a decisão D2 (nome declarado à mão)
  // Dado que a mesma ONG digitou o nome de jeitos diferentes em coletas do mês
  // Quando a Marta pede o relatório
  // Então ela aparece uma vez só, com a grafia da primeira coleta
  it('conta como uma ONG só os nomes que diferem em maiúsculas, acentos ou espaços', async () => {
    await doacaoColetada({ ong: 'ONG Esperança', criadaEm: '2026-10-05 12:00:00', coletadaEm: '2026-10-05T14:00:00.000Z' });
    await doacaoColetada({ ong: '  ong  esperança ', criadaEm: '2026-10-06 12:00:00', coletadaEm: '2026-10-06T14:00:00.000Z' });
    await doacaoColetada({ ong: 'ONG Esperanca', criadaEm: '2026-10-07 12:00:00', coletadaEm: '2026-10-07T14:00:00.000Z' });

    const res = await request(app).get('/api/relatorios/mensal?mes=2026-10');

    expect(res.body.por_ong).toEqual({ 'ONG Esperança': 3 });
  });

  // Critério de aceite — História #4 (caminho proibido)
  // Dado que o mês não está no formato AAAA-MM
  // Quando a Marta pede o relatório
  // Então o sistema recusa e diz o formato esperado
  it('recusa um mês fora do formato AAAA-MM', async () => {
    const res = await request(app).get('/api/relatorios/mensal?mes=outubro');

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/AAAA-MM/);
  });
});

// ---------------------------------------------------------------------------
// Mudança de contexto (Trabalho 2, etapa 4): os testes rodaram na máquina do piloto com a
// configuração apontando para o banco real, e a limpeza apagou todas as doações.
// Regra: os testes não conseguem apagar nem alterar dados de um banco que não seja o de
// teste, seja qual for a máquina ou a configuração.
// ---------------------------------------------------------------------------

describe('proteção do banco real', () => {
  // Cria um "banco do piloto" num arquivo temporário, com doações reais, sem passar pelo
  // src/db.js — e conta as doações direto nele, também sem passar pelo src/db.js.
  function criarBancoDoPiloto(arquivo) {
    const banco = new DatabaseSync(arquivo);
    banco.exec(`
      CREATE TABLE doacoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT, tipo TEXT NOT NULL, quantidade TEXT NOT NULL,
        validade TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'disponivel', ong TEXT,
        criada_em TEXT NOT NULL DEFAULT (datetime('now'))
      );
      INSERT INTO doacoes (tipo, quantidade, validade) VALUES ('Pão', '5 kg', '2026-10-21');
      INSERT INTO doacoes (tipo, quantidade, validade, status, ong)
        VALUES ('Sopa', '20 porções', '2026-10-22', 'aceita', 'ONG Bairro Alegre');
    `);
    banco.close();
  }
  function contarDoacoes(arquivo) {
    const banco = new DatabaseSync(arquivo);
    const { total } = banco.prepare('SELECT COUNT(*) AS total FROM doacoes').get();
    banco.close();
    return total;
  }

  // Critério de aceite — história da mudança de contexto (etapa 4b)
  // Dado que o banco em uso não é o de teste
  // Quando a limpeza é chamada
  // Então ela falha e nenhuma doação é apagada
  it('recusa limpar um banco que não é o de teste e não apaga nenhuma doação', async () => {
    const pasta = mkdtempSync(join(tmpdir(), 'prato-cheio-'));
    const bancoDoPiloto = join(pasta, 'dados.sqlite');
    criarBancoDoPiloto(bancoDoPiloto);

    try {
      // A configuração aponta para o banco real (como na máquina do piloto).
      await encerrar();
      vi.stubEnv('DATABASE_FILE', bancoDoPiloto);

      await expect(limparBanco()).rejects.toThrow(/não o banco de teste/);

      await encerrar();
      expect(contarDoacoes(bancoDoPiloto)).toBe(2);
    } finally {
      await encerrar();
      vi.unstubAllEnvs(); // volta para o ':memory:' do vitest.config.js
      rmSync(pasta, { recursive: true, force: true });
    }
  });
});
