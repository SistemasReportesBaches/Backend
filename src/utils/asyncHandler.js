/**
 * Envuelve un controlador async para que cualquier excepción (por ejemplo,
 * una falla de conexión a PostgreSQL) se reenvíe a next(err) y la maneje el
 * middleware de errores centralizado de server.js, en vez de convertirse en
 * un "unhandled rejection" que puede tumbar el proceso de Node.
 */
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = { asyncHandler };
