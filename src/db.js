// Conexão com o banco.
//
// UNIDADE 1: SQLite, embutido no Node (módulo `node:sqlite`) — nada para instalar.
// UNIDADE 3: este arquivo será refatorado para PostgreSQL. A interface abaixo
//            (`query` devolvendo `{ rows }`) foi desenhada para que a troca fique
//            contida aqui, sem espalhar mudança pelo resto do código.
// `node:sqlite` é módulo embutido do Node 22+. Carregado via createRequire porque
// algumas ferramentas (como o Vite/Vitest) ainda não o reconhecem como embutido.
import { createRequire } from 'node:module';
const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite');

// O único banco que pode ser apagado: o SQLite em memória dos testes (vitest.config.js).
export const BANCO_DE_TESTE = ':memory:';

let db;
let bancoAberto; // caminho com que a conexão atual foi aberta

// Lido na hora de abrir a conexão (e não no carregamento do módulo), para que o banco em
// uso seja sempre o da conexão aberta — é ele que limparBanco() confere.
function bancoConfigurado() {
  return process.env.DATABASE_FILE || 'dados.sqlite';
}

export function conexao() {
  if (!db) {
    bancoAberto = bancoConfigurado();
    db = new DatabaseSync(bancoAberto);
  }
  return db;
}

/** Caminho do banco da conexão em uso (abre a conexão, se ainda não estiver aberta). */
export function bancoEmUso() {
  conexao();
  return bancoAberto;
}

/**
 * Executa uma consulta e devolve { rows }.
 * Use `?` como marcador de parâmetro (evita injeção de SQL):
 *   query('SELECT * FROM doacoes WHERE id = ?', [id])
 */
export async function query(sql, valores = []) {
  const stmt = conexao().prepare(sql);
  const ehLeitura = /^\s*(select|with)/i.test(sql) || /returning/i.test(sql);
  if (ehLeitura) return { rows: stmt.all(...valores) };
  const info = stmt.run(...valores);
  return { rows: [], alteradas: info.changes };
}

/** Cria o schema, se ainda não existir. Rodado por `npm run db:migrar` e ao subir o servidor. */
export async function migrar() {
  conexao().exec(`
    CREATE TABLE IF NOT EXISTS doacoes (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo        TEXT NOT NULL,
      quantidade  TEXT NOT NULL,
      validade    TEXT NOT NULL,
      status      TEXT NOT NULL DEFAULT 'disponivel',
      ong         TEXT,
      criada_em   TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}

/**
 * Apaga todos os dados. Usado pelos testes — e SÓ funciona no banco de teste.
 *
 * Mudança de contexto (Trabalho 2, etapa 4): os testes rodaram na máquina do piloto com a
 * configuração apontando para o banco real, e esta limpeza apagou todas as doações. Agora
 * ela confere o banco da conexão aberta e recusa qualquer um que não seja o de teste,
 * seja qual for a máquina, a variável de ambiente ou o arquivo de configuração.
 */
export async function limparBanco() {
  const banco = bancoEmUso();
  if (banco !== BANCO_DE_TESTE) {
    throw new Error(
      `limpeza recusada: o banco em uso é "${banco}", não o banco de teste ` +
      `("${BANCO_DE_TESTE}"). Nenhuma doação foi apagada.`
    );
  }
  conexao().exec('DELETE FROM doacoes');
}

export async function encerrar() {
  if (db) { db.close(); db = undefined; bancoAberto = undefined; }
}
