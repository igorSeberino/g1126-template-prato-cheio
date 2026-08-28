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
// (ordem de publicação = ordem do id).
export async function listarDisponiveis() {
  const { rows } = await query(
    "SELECT * FROM doacoes WHERE status = 'disponivel' ORDER BY id"
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
