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
// Decisão D2 (docs/projeto.md): a ONG se identifica pelo nome, obrigatório no aceite —
// sem ele, a medição de "qual ONG aceitou" do piloto sai errada (Risco #2 da Análise).
export async function aceitar(id, ong) {
  if (ong == null || String(ong).trim() === '') {
    throw new Error('informe o nome da ONG que está aceitando');
  }
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

// História #4 — "a Marta vê o relatório mensal de doações coletadas".
// Decisão D3: o relatório conta doações e mede tempos; não soma volume, porque
// `quantidade` é texto livre ("10 porções", "2 kg").

// O mês é o de Brasília (UTC−3, sem horário de verão desde 2019): uma coleta às 23h30
// do dia 31 conta naquele mês, mesmo já sendo dia 1º em UTC.
const FUSO_BRASILIA = '-03:00';

function limitesDoMes(mes) {
  const [ano, m] = mes.split('-').map(Number);
  const proximo = m === 12 ? `${ano + 1}-01` : `${ano}-${String(m + 1).padStart(2, '0')}`;
  return {
    inicio: new Date(`${mes}-01T00:00:00${FUSO_BRASILIA}`).toISOString(),
    fim: new Date(`${proximo}-01T00:00:00${FUSO_BRASILIA}`).toISOString()
  };
}

// `criada_em` sai do SQLite como 'AAAA-MM-DD HH:MM:SS' (UTC), e `coletada_em` como
// ISO 8601 — a divergência 3 do diagrama de dados. Aqui as duas viram instantes.
function instante(texto) {
  return Date.parse(texto.includes('T') ? texto : `${texto.replace(' ', 'T')}Z`);
}

function mediana(valores) {
  if (valores.length === 0) return null;
  const v = [...valores].sort((a, b) => a - b);
  const meio = Math.floor(v.length / 2);
  return v.length % 2 ? v[meio] : (v[meio - 1] + v[meio]) / 2;
}

export async function relatorioMensal(mes) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes ?? '')) {
    throw new Error('informe o mês no formato AAAA-MM');
  }
  const { inicio, fim } = limitesDoMes(mes);
  const coletadas = await repo.listarColetadasEntre(inicio, fim);

  const porOng = {};
  for (const d of coletadas) porOng[d.ong] = (porOng[d.ong] ?? 0) + 1;

  const horas = coletadas.map(
    (d) => (instante(d.coletada_em) - instante(d.criada_em)) / 3_600_000
  );
  const med = mediana(horas);

  return {
    mes,
    coletadas: coletadas.length,
    por_ong: porOng,
    mediana_horas_publicacao_ate_coleta: med === null ? null : Math.round(med * 10) / 10
  };
}
