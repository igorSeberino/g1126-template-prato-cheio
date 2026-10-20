import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import request from 'supertest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { criarApp } from '../src/app.js';
import { migrar, limparBanco, encerrar } from '../src/db.js';

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

const doacaoValida = { tipo: 'Sopa', quantidade: '10 porções', validade: '2026-09-30' };

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
