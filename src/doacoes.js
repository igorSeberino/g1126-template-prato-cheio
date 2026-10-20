// Regras de negócio das doações.
import * as repo from './repositorio.js';

const CAMPOS_OBRIGATORIOS = ['tipo', 'quantidade', 'validade'];

// História zero — "um doador publica uma doação".
// Critério: tipo, quantidade e validade são obrigatórios.
export async function criarDoacao({ tipo, quantidade, validade } = {}) {
  const valores = { tipo, quantidade, validade };
  const faltando = CAMPOS_OBRIGATORIOS.filter(
    (campo) => valores[campo] == null || String(valores[campo]).trim() === ''
  );
  if (faltando.length > 0) {
    throw new Error(`campos obrigatórios ausentes: ${faltando.join(', ')}`);
  }
  return repo.inserir({ tipo, quantidade, validade });
}

// História zero — "uma ONG vê as doações disponíveis".
export async function listarDisponiveis() {
  return repo.listarDisponiveis();
}

// História zero — "uma ONG aceita uma doação".
// Regra do caso: uma doação aceita não fica disponível para outra ONG.
export async function aceitar(id, ong) {
  const doacao = await repo.buscarPorId(id);
  if (!doacao) {
    throw new Error('doação não encontrada');
  }
  if (doacao.status !== 'disponivel') {
    throw new Error('doação já foi aceita por outra ONG');
  }
  const aceita = await repo.aceitar(id, ong);
  if (!aceita) {
    // Corrida: outra ONG aceitou entre o buscarPorId e o update.
    throw new Error('doação já foi aceita por outra ONG');
  }
  return aceita;
}

// História #3 — "o voluntário confirma a coleta".
export async function listarAceitas() {
  return repo.listarAceitas();
}

// Só uma doação aceita pode ser coletada. O horário gravado é o do evento, enviado pelo
// celular do voluntário, e não o da sincronização (critério da história #3: conexão
// instável na rua). Sem horário enviado, vale o horário em que a confirmação chegou.
export async function marcarColetada(id, { coletada_em: coletadaEm } = {}) {
  const horario = coletadaEm ?? new Date().toISOString();
  if (Number.isNaN(Date.parse(horario))) {
    throw new Error('horário da coleta inválido');
  }
  const doacao = await repo.buscarPorId(id);
  if (!doacao) {
    throw new Error('doação não encontrada');
  }
  if (doacao.status === 'disponivel') {
    throw new Error('doação ainda não foi aceita por uma ONG');
  }
  if (doacao.status === 'coletada') {
    throw new Error('doação já foi coletada');
  }
  const coletada = await repo.marcarColetada(id, new Date(horario).toISOString());
  if (!coletada) {
    throw new Error('doação já foi coletada');
  }
  return coletada;
}
