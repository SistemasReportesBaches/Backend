const { Pool } = require("pg");

// Pool de conexiones a PostgreSQL + PostGIS.
// Se reutiliza en toda la aplicación para evitar abrir una conexión por request.
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 10,
  idleTimeoutMillis: 30000,
});

pool.on("error", (err) => {
  // Un error asíncrono en un cliente inactivo del pool (p. ej. la BD se
  // reinicia) no debe tumbar el proceso completo del servidor; se registra
  // y las próximas queries simplemente fallarán hasta que la BD vuelva.
  console.error("Error inesperado en el pool de PostgreSQL:", err.message);
});

process.on("unhandledRejection", (err) => {
  console.error("Rechazo de promesa no manejado:", err.message);
});

module.exports = pool;
