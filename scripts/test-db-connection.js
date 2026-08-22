require('dotenv').config();
const { Pool } = require('pg');

(async () => {
  const p = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    idleTimeoutMillis: 1000,
    connectionTimeoutMillis: 5000,
  });

  try {
    const client = await p.connect();
    console.log('CONNECTION_OK');
    client.release();
  } catch (e) {
    console.error('ERROR_CONEXION', e.message);
    process.exitCode = 1;
  } finally {
    await p.end();
  }
})();
