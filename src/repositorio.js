// Camada de dados do Prato Cheio — acesso ao banco.
// A conexão e o schema já estão prontos em src/db.js.
//
// Marcador de parâmetro é `?` (SQL parametrizado evita injeção):
//   const { rows } = await query('SELECT * FROM doacoes WHERE id = ?', [id]);
import { query } from './db.js';

// Insere a doação e devolve a linha criada.
export async function inserir({ tipo, quantidade, validade }) {
  const { rows } = await query(
    'INSERT INTO doacoes (tipo, quantidade, validade) VALUES (?, ?, ?) RETURNING *',
    [tipo, quantidade, validade]
  );
  return rows[0];
}

// Devolve apenas as doações com status 'disponivel', da mais antiga para a mais recente
// (ordem de publicação = ordem do id). Com `tipo` (história #7), só as desse tipo: o valor
// entra pelo marcador `?`, nunca colado na string do SQL.
export async function listarDisponiveis(tipo) {
  if (tipo === undefined) {
    const { rows } = await query(
      "SELECT * FROM doacoes WHERE status = 'disponivel' ORDER BY id"
    );
    return rows;
  }
  const { rows } = await query(
    "SELECT * FROM doacoes WHERE status = 'disponivel' AND tipo = ? ORDER BY id",
    [tipo]
  );
  return rows;
}

// Busca uma doação pelo id (devolve undefined se não existir).
export async function buscarPorId(id) {
  const { rows } = await query('SELECT * FROM doacoes WHERE id = ?', [id]);
  return rows[0];
}

// Marca a doação como aceita pela ONG e devolve a linha atualizada.
// O `AND status = 'disponivel'` garante no banco que duas ONGs não aceitem a mesma
// doação: a segunda tentativa não altera nenhuma linha e devolve undefined.
export async function aceitar(id, ong) {
  const { rows } = await query(
    "UPDATE doacoes SET status = 'aceita', ong = ? WHERE id = ? AND status = 'disponivel' RETURNING *",
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
// voluntário) — nada de função de data do SQLite aqui, para a migração ficar só no db.js.
export async function marcarColetada(id, coletadaEm) {
  const { rows } = await query(
    "UPDATE doacoes SET status = 'coletada', coletada_em = ? WHERE id = ? AND status = 'aceita' RETURNING *",
    [coletadaEm, id]
  );
  return rows[0];
}

// Marca a doação como cancelada e devolve a linha atualizada.
// O `AND status = 'disponivel'` garante no banco que só uma doação ainda não aceita possa
// ser cancelada pelo doador (mesma guarda atômica da decisão D1, reaplicada aqui).
export async function cancelar(id) {
  const { rows } = await query(
    "UPDATE doacoes SET status = 'cancelada' WHERE id = ? AND status = 'disponivel' RETURNING *",
    [id]
  );
  return rows[0];
}

// Doações coletadas entre dois instantes (ISO 8601, início incluído, fim excluído).
// Comparação de texto ISO: funciona igual em SQLite e PostgreSQL, sem função de data.
export async function listarColetadasEntre(inicio, fim) {
  const { rows } = await query(
    "SELECT * FROM doacoes WHERE status = 'coletada' AND coletada_em >= ? AND coletada_em < ? ORDER BY coletada_em",
    [inicio, fim]
  );
  return rows;
}
