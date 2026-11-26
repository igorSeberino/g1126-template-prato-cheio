// Camada de dados do Prato Cheio — acesso ao banco.
// A conexão e o schema já estão prontos em src/db.js.
//
// Marcadores de parâmetro do PostgreSQL: `$1, $2…` (SQL parametrizado evita injeção):
//   const { rows } = await query('SELECT * FROM doacoes WHERE id = $1', [id]);
import { query } from './db.js';

// Insere a doação e devolve a linha criada.
export async function inserir({ tipo, quantidade, validade, doador }) {
  const { rows } = await query(
    'INSERT INTO doacoes (tipo, quantidade, validade, doador) VALUES ($1, $2, $3, $4) RETURNING *',
    [tipo, quantidade, validade, doador]
  );
  return rows[0];
}

// Devolve apenas as doações com status 'disponivel', da mais antiga para a mais recente
// (ordem de publicação = ordem do id). Com `tipo` (história #7), só as desse tipo: o valor
// entra pelo marcador `$1`, nunca colado na string do SQL.
export async function listarDisponiveis(tipo) {
  if (tipo === undefined) {
    const { rows } = await query(
      "SELECT * FROM doacoes WHERE status = 'disponivel' ORDER BY id"
    );
    return rows;
  }
  const { rows } = await query(
    "SELECT * FROM doacoes WHERE status = 'disponivel' AND tipo = $1 ORDER BY id",
    [tipo]
  );
  return rows;
}

// H1 — todas as doações de um doador, em qualquer situação, na ordem de publicação.
// Doações antigas sem doador (NULL) nunca casam com `doador = $1` (decisão D6).
export async function listarDoDoador(doador) {
  const { rows } = await query('SELECT * FROM doacoes WHERE doador = $1 ORDER BY id', [doador]);
  return rows;
}

// Maior valor de uma coluna INTEGER no PostgreSQL.
const MAIOR_ID = 2147483647;

// Busca uma doação pelo id (devolve undefined se não existir).
// Id que não é um inteiro positivo que caiba na coluna (ex.: 'abc' vindo da URL) não existe:
// devolve undefined sem consultar, porque o PostgreSQL recusaria a consulta e a API
// responderia 500 onde sempre respondeu 404 (revisão do PR da migração).
export async function buscarPorId(id) {
  const texto = String(id);
  if (!/^\d+$/.test(texto) || Number(texto) > MAIOR_ID) return undefined;
  const { rows } = await query('SELECT * FROM doacoes WHERE id = $1', [id]);
  return rows[0];
}

// Marca a doação como aceita pela ONG e devolve a linha atualizada.
// O `AND status = 'disponivel'` garante no banco que duas ONGs não aceitem a mesma
// doação: a segunda tentativa não altera nenhuma linha e devolve undefined.
export async function aceitar(id, ong) {
  const { rows } = await query(
    "UPDATE doacoes SET status = 'aceita', ong = $1 WHERE id = $2 AND status = 'disponivel' RETURNING *",
    [ong, id]
  );
  return rows[0];
}

// Doações aceitas por uma ONG e ainda não coletadas — o que o voluntário precisa buscar.
export async function listarAceitas() {
  const { rows } = await query(
    "SELECT * FROM doacoes WHERE status = 'aceita' ORDER BY id"
  );
  return rows;
}

// Marca a doação como coletada e devolve a linha atualizada.
// O `AND status = 'aceita'` impede, no próprio banco, coletar uma doação que ainda não foi
// aceita ou que já foi coletada. O horário vem como parâmetro (o do evento, no celular do
// voluntário) — nada de função de data do banco aqui, para a migração ficar só no db.js.
export async function marcarColetada(id, coletadaEm, voluntario) {
  const { rows } = await query(
    "UPDATE doacoes SET status = 'coletada', coletada_em = $1, voluntario = $2 WHERE id = $3 AND status = 'aceita' RETURNING *",
    [coletadaEm, voluntario, id]
  );
  return rows[0];
}

// Marca a doação como cancelada e devolve a linha atualizada.
// O `AND status = 'disponivel'` garante no banco que só uma doação ainda não aceita possa
// ser cancelada pelo doador (mesma guarda atômica da decisão D1, reaplicada aqui).
export async function cancelar(id) {
  const { rows } = await query(
    "UPDATE doacoes SET status = 'cancelada' WHERE id = $1 AND status = 'disponivel' RETURNING *",
    [id]
  );
  return rows[0];
}

// H3 — devolve a doação aceita: volta a 'disponivel', sem ONG, com o motivo registrado.
// O `AND status = 'aceita' AND ong = $3` é a guarda atômica da D1: só devolve se a doação
// ainda estiver aceita POR ESSA ONG (se foi coletada ou devolvida no meio, não altera nada).
export async function devolver(id, ong, motivo) {
  const { rows } = await query(
    "UPDATE doacoes SET status = 'disponivel', ong = NULL, motivo_devolucao = $1 WHERE id = $2 AND status = 'aceita' AND ong = $3 RETURNING *",
    [motivo, id, ong]
  );
  return rows[0];
}

// Doações coletadas entre dois instantes (ISO 8601, início incluído, fim excluído).
// Comparação de texto ISO: funciona igual em qualquer banco, sem função de data.
export async function listarColetadasEntre(inicio, fim) {
  const { rows } = await query(
    "SELECT * FROM doacoes WHERE status = 'coletada' AND coletada_em >= $1 AND coletada_em < $2 ORDER BY coletada_em",
    [inicio, fim]
  );
  return rows;
}

// H4 — `criada_em` é texto 'AAAA-MM-DD HH:MM:SS' (UTC) e os limites do mês chegam em ISO
// ('2026-11-01T03:00:00.000Z'). Comparar os dois como texto dá errado, então o limite é
// convertido para o formato da coluna aqui, no repositório.
function noFormatoDaCriacao(iso) {
  return new Date(iso).toISOString().slice(0, 19).replace('T', ' ');
}

// Doações publicadas entre dois instantes (início incluído, fim excluído), em qualquer situação.
// `COUNT(*)::int`: o PostgreSQL devolve COUNT como texto ('3'); a conversão fica no SQL.
export async function contarPublicadasEntre(inicio, fim) {
  const { rows } = await query(
    'SELECT COUNT(*)::int AS total FROM doacoes WHERE criada_em >= $1 AND criada_em < $2',
    [noFormatoDaCriacao(inicio), noFormatoDaCriacao(fim)]
  );
  return rows[0].total;
}

// Das publicadas no período, as que hoje estão aceitas ou coletadas. Não existe horário do
// aceite (decisão D9), e a devolvida volta a 'disponivel', então não entra.
export async function contarAceitasEntre(inicio, fim) {
  const { rows } = await query(
    "SELECT COUNT(*)::int AS total FROM doacoes WHERE status IN ('aceita', 'coletada') AND criada_em >= $1 AND criada_em < $2",
    [noFormatoDaCriacao(inicio), noFormatoDaCriacao(fim)]
  );
  return rows[0].total;
}
