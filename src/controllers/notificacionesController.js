const pool = require('../config/db');

// GET /api/notificaciones  -> notificaciones del usuario autenticado
async function listar(req, res) {
  const uid = req.user.id;
  const { rows } = await pool.query(
    `SELECT id, reporte_id, tipo, mensaje, leido, fecha_creada FROM notificaciones WHERE usuario_id = $1 ORDER BY fecha_creada DESC`,
    [uid]
  );
  res.json({ total: rows.length, notificaciones: rows });
}

// PUT /api/notificaciones/:id/leer  -> marcar como leída (usuario dueño o admin)
async function marcarLeida(req, res) {
  const nid = req.params.id;
  // validar pertenencia
  const q = await pool.query('SELECT usuario_id FROM notificaciones WHERE id = $1', [nid]);
  if (q.rows.length === 0) return res.status(404).json({ error: 'Notificación no encontrada.' });
  const owner = q.rows[0].usuario_id;
  if (owner !== req.user.id && req.user.rol !== 'administrador') return res.status(403).json({ error: 'No autorizado.' });

  const { rows } = await pool.query('UPDATE notificaciones SET leido = true WHERE id = $1 RETURNING id, leido', [nid]);
  res.json({ mensaje: 'Notificación marcada como leída.', notificacion: rows[0] });
}

module.exports = { listar, marcarLeida };