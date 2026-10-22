import express from 'express';
import * as doacoes from './doacoes.js';
import { ErroDeRegra, NaoEncontrada } from './doacoes.js';

// Traduz o erro para HTTP: 400 quando o pedido viola uma regra, 404 quando a doação não
// existe e 500 para o resto — sem expor ao cliente o detalhe interno (SQL, pilha).
export function responderErro(res, erro) {
  if (erro instanceof NaoEncontrada) return res.status(404).json({ erro: erro.message });
  if (erro instanceof ErroDeRegra) return res.status(400).json({ erro: erro.message });
  console.error(erro);
  return res.status(500).json({ erro: 'erro interno; tente de novo em instantes' });
}

// Envolve uma rota assíncrona para que qualquer erro passe pelo responderErro.
const rota = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (erro) {
    responderErro(res, erro);
  }
};

export function criarApp() {
  const app = express();
  app.use(express.json());
  app.use(express.static('public'));

  // Verificação de saúde: usada pelo CI para provar que a aplicação sobe.
  app.get('/api/saude', (req, res) => res.json({ ok: true }));

  app.get('/api/doacoes', rota(async (req, res) => {
    res.json(await doacoes.listarDisponiveis());
  }));

  app.post('/api/doacoes', rota(async (req, res) => {
    res.status(201).json(await doacoes.criarDoacao(req.body));
  }));

  app.post('/api/doacoes/:id/aceitar', rota(async (req, res) => {
    res.json(await doacoes.aceitar(req.params.id, req.body?.ong));
  }));

  // História #3 — o voluntário vê o que precisa buscar e confirma a coleta.
  app.get('/api/doacoes/aceitas', rota(async (req, res) => {
    res.json(await doacoes.listarAceitas());
  }));

  app.post('/api/doacoes/:id/coletar', rota(async (req, res) => {
    res.json(await doacoes.marcarColetada(req.params.id, req.body ?? {}));
  }));

  // História #4 — relatório mensal da Marta. Ex.: /api/relatorios/mensal?mes=2026-10
  app.get('/api/relatorios/mensal', rota(async (req, res) => {
    res.json(await doacoes.relatorioMensal(req.query.mes));
  }));

  // Corpo que não é JSON válido: responde em JSON, como o resto da API, e não com a página
  // de erro em HTML do Express.
  app.use((erro, req, res, next) => {
    if (erro.type === 'entity.parse.failed') {
      return res.status(400).json({ erro: 'o corpo do pedido não é um JSON válido' });
    }
    return responderErro(res, erro);
  });

  return app;
}
