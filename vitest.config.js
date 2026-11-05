export default {
  test: {
    // Banco de teste com nome próprio no PostgreSQL: os testes não tocam o banco de
    // desenvolvimento. DATABASE_URL_TESTE permite apontar para outro servidor (ex.: o CI).
    env: {
      DATABASE_URL:
        process.env.DATABASE_URL_TESTE ||
        'postgres://pratocheio:pratocheio@localhost:5432/pratocheio_teste'
    }
  }
};
