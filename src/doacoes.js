// Regras de negócio das doações.
import * as repo from './repositorio.js';

// Erros que a API devolve ao cliente com a mensagem (o src/app.js traduz para HTTP).
// Qualquer outro erro é inesperado: vira 500, sem expor o detalhe.
export class ErroDeRegra extends Error {} // 400 — o pedido viola uma regra do caso
export class NaoEncontrada extends Error {} // 404 — a doação não existe

const CAMPOS_OBRIGATORIOS = ['tipo', 'quantidade', 'validade'];

// O dia e o mês são os de Brasília (UTC−3, sem horário de verão desde 2019).
const FUSO_BRASILIA = '-03:00';
const TRES_HORAS_MS = 3 * 60 * 60 * 1000;

// Tolerância para o relógio do celular do voluntário estar adiantado em relação ao servidor.
const TOLERANCIA_RELOGIO_MS = 5 * 60 * 1000;

/** Data de hoje em Brasília, no formato AAAA-MM-DD. */
function hojeEmBrasilia() {
  return new Date(Date.now() - TRES_HORAS_MS).toISOString().slice(0, 10);
}

/** true se o texto é uma data real no formato AAAA-MM-DD (recusa 2026-02-30). */
function ehData(texto) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  const data = new Date(`${texto}T00:00:00Z`);
  return !Number.isNaN(data.getTime()) && data.toISOString().slice(0, 10) === texto;
}

// Vencida = validade anterior a hoje. "Retirar até hoje" ainda vale.
// Registros antigos com validade em texto livre não são julgados.
function estaVencida(validade) {
  return ehData(validade) && validade < hojeEmBrasilia();
}

// A API recebe JSON, então um campo pode chegar como objeto ou lista. Só texto (ou número,
// convertido em texto) é aceito: o driver do SQLite trata um objeto como parâmetro nomeado.
// Devolve o texto sem espaços nas pontas, ou null se o campo não veio.
function comoTexto(valor, nomeDoCampo) {
  if (valor == null) return null;
  if (typeof valor === 'number' && Number.isFinite(valor)) return String(valor);
  if (typeof valor !== 'string') {
    throw new ErroDeRegra(`o campo ${nomeDoCampo} precisa ser texto`);
  }
  return valor.trim();
}

// Decisão D2: o nome da ONG é declarado à mão. Espaços repetidos ou nas pontas viram um só.
function normalizarNomeDaOng(nome) {
  return nome.trim().replace(/\s+/g, ' ');
}

// Para contar no relatório, "ONG Esperança", "ong esperança" e "ONG Esperanca" são a
// mesma ONG: compara sem diferença de maiúsculas, acentos ou espaços.
function chaveDaOng(nome) {
  return normalizarNomeDaOng(nome)
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

// História zero — "um doador publica uma doação".
// Critério: tipo, quantidade e validade são obrigatórios.
// Vigilância sanitária: a validade é uma data, e não se publica comida já vencida.
export async function criarDoacao(dados = {}) {
  const valores = {};
  for (const campo of CAMPOS_OBRIGATORIOS) valores[campo] = comoTexto(dados[campo], campo);

  const faltando = CAMPOS_OBRIGATORIOS.filter((campo) => !valores[campo]);
  if (faltando.length > 0) {
    throw new ErroDeRegra(`campos obrigatórios ausentes: ${faltando.join(', ')}`);
  }
  if (!ehData(valores.validade)) {
    throw new ErroDeRegra('a validade precisa ser uma data no formato AAAA-MM-DD');
  }
  if (estaVencida(valores.validade)) {
    throw new ErroDeRegra(`a validade ${valores.validade} já passou`);
  }
  return repo.inserir(valores);
}

// História zero — "uma ONG vê as doações disponíveis".
// Doação vencida não aparece: a ONG não pode aceitar comida que já passou da validade.
export async function listarDisponiveis() {
  const disponiveis = await repo.listarDisponiveis();
  return disponiveis.filter((d) => !estaVencida(d.validade));
}

// História zero — "uma ONG aceita uma doação".
// Regra do caso: uma doação aceita não fica disponível para outra ONG.
// Decisão D2 (docs/projeto.md): a ONG se identifica pelo nome, obrigatório no aceite —
// sem ele, a medição de "qual ONG aceitou" do piloto sai errada (Risco #2 da Análise).
export async function aceitar(id, ong) {
  const texto = comoTexto(ong, 'ong');
  if (!texto) {
    throw new ErroDeRegra('informe o nome da ONG que está aceitando');
  }
  const doacao = await repo.buscarPorId(id);
  if (!doacao) {
    throw new NaoEncontrada('doação não encontrada');
  }
  if (doacao.status !== 'disponivel') {
    throw new ErroDeRegra('doação já foi aceita por outra ONG');
  }
  if (estaVencida(doacao.validade)) {
    throw new ErroDeRegra(`doação vencida: a validade era ${doacao.validade}`);
  }
  const aceita = await repo.aceitar(id, normalizarNomeDaOng(texto));
  if (!aceita) {
    // Corrida: outra ONG aceitou entre o buscarPorId e o update.
    throw new ErroDeRegra('doação já foi aceita por outra ONG');
  }
  return aceita;
}

// História #3 — "o voluntário confirma a coleta".
export async function listarAceitas() {
  return repo.listarAceitas();
}

// `criada_em` sai do SQLite como 'AAAA-MM-DD HH:MM:SS' (UTC), e `coletada_em` como
// ISO 8601 — a divergência 3 do diagrama de dados. Aqui as duas viram instantes.
function instante(texto) {
  return Date.parse(texto.includes('T') ? texto : `${texto.replace(' ', 'T')}Z`);
}

// Só uma doação aceita pode ser coletada. O horário gravado é o do evento, enviado pelo
// celular do voluntário, e não o da sincronização (critério da história #3: conexão
// instável na rua). Sem horário enviado, vale o horário em que a confirmação chegou.
// O horário precisa caber entre a publicação e agora — senão o relatório da Marta mede
// tempos negativos ou no futuro.
export async function marcarColetada(id, { coletada_em: coletadaEm } = {}) {
  const enviado = comoTexto(coletadaEm, 'coletada_em');
  const horario = enviado || new Date().toISOString();
  if (Number.isNaN(Date.parse(horario))) {
    throw new ErroDeRegra('horário da coleta inválido');
  }
  const doacao = await repo.buscarPorId(id);
  if (!doacao) {
    throw new NaoEncontrada('doação não encontrada');
  }
  if (doacao.status === 'disponivel') {
    throw new ErroDeRegra('doação ainda não foi aceita por uma ONG');
  }
  if (doacao.status === 'coletada') {
    throw new ErroDeRegra('doação já foi coletada');
  }
  const momento = Date.parse(horario);
  if (momento < instante(doacao.criada_em)) {
    throw new ErroDeRegra('o horário da coleta é anterior à publicação da doação');
  }
  if (momento > Date.now() + TOLERANCIA_RELOGIO_MS) {
    throw new ErroDeRegra('o horário da coleta está no futuro; confira o relógio do celular');
  }
  const coletada = await repo.marcarColetada(id, new Date(momento).toISOString());
  if (!coletada) {
    throw new ErroDeRegra('doação já foi coletada');
  }
  return coletada;
}

// "O doador cancela uma doação disponível" — desiste ou corrige um erro de publicação
// antes que uma ONG aceite. Decisão D4 (docs/projeto.md): mesma guarda atômica da D1
// (`UPDATE ... WHERE status = 'disponivel'`), para que uma ONG que já aceitou não perca a
// doação por um cancelamento que chegou depois.
export async function cancelar(id) {
  const doacao = await repo.buscarPorId(id);
  if (!doacao) {
    throw new NaoEncontrada('doação não encontrada');
  }
  if (doacao.status !== 'disponivel') {
    throw new ErroDeRegra('só é possível cancelar uma doação ainda disponível');
  }
  const cancelada = await repo.cancelar(id);
  if (!cancelada) {
    // Corrida: a doação foi aceita entre o buscarPorId e o update.
    throw new ErroDeRegra('só é possível cancelar uma doação ainda disponível');
  }
  return cancelada;
}

// História #4 — "a Marta vê o relatório mensal de doações coletadas".
// Decisão D3: o relatório conta doações e mede tempos; não soma volume, porque
// `quantidade` é texto livre ("10 porções", "2 kg").
// O mês é o de Brasília: uma coleta às 23h30 do dia 31 conta naquele mês, mesmo já sendo
// dia 1º em UTC.

function limitesDoMes(mes) {
  const [ano, m] = mes.split('-').map(Number);
  const proximo = m === 12 ? `${ano + 1}-01` : `${ano}-${String(m + 1).padStart(2, '0')}`;
  return {
    inicio: new Date(`${mes}-01T00:00:00${FUSO_BRASILIA}`).toISOString(),
    fim: new Date(`${proximo}-01T00:00:00${FUSO_BRASILIA}`).toISOString()
  };
}

function mediana(valores) {
  if (valores.length === 0) return null;
  const v = [...valores].sort((a, b) => a - b);
  const meio = Math.floor(v.length / 2);
  return v.length % 2 ? v[meio] : (v[meio - 1] + v[meio]) / 2;
}

export async function relatorioMensal(mes) {
  if (typeof mes !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) {
    throw new ErroDeRegra('informe o mês no formato AAAA-MM');
  }
  const { inicio, fim } = limitesDoMes(mes);
  const coletadas = await repo.listarColetadasEntre(inicio, fim);

  // Agrupa variações do mesmo nome; mostra a grafia da primeira coleta do mês.
  const porOng = {};
  const nomeExibido = {};
  for (const d of coletadas) {
    const chave = chaveDaOng(d.ong);
    nomeExibido[chave] ??= normalizarNomeDaOng(d.ong);
    porOng[nomeExibido[chave]] = (porOng[nomeExibido[chave]] ?? 0) + 1;
  }

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
