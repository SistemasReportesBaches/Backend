const pool = require('../config/db');

// POST /api/quejas  -> crear queja por usuario autenticado
async function crearQueja(req, res) {
  const { reporte_id, descripcion } = req.body;
  const usuario_id = req.user.id;
  if (!descripcion || String(descripcion).trim().length < 5) return res.status(400).json({ error: 'Descripción demasiado corta.' });

  const { rows } = await pool.query(
    `INSERT INTO quejas (usuario_id, reporte_id, descripcion) VALUES ($1,$2,$3) RETURNING id, descripcion, estado, fecha_creada`,
    [usuario_id, reporte_id || null, descripcion]
  );
  res.status(201).json({ queja: rows[0] });
}

// GET /api/quejas  -> listar quejas (solo admin)
async function listarQuejas(req, res) {
  const { rows } = await pool.query(`SELECT q.*, u.nombre, u.apellido FROM quejas q JOIN usuarios u ON u.id = q.usuario_id ORDER BY q.fecha_creada DESC`);
  res.json({ total: rows.length, quejas: rows });
}

// PUT /api/quejas/:id  -> actualizar estado/respuesta (solo admin)
async function actualizarQueja(req, res) {
  const id = req.params.id;
  const { estado, respuesta_admin } = req.body;
  const sets = [];
  const vals = [];
  if (estado) { vals.push(estado); sets.push(`estado = $${vals.length}`); }
  if (typeof respuesta_admin !== 'undefined') { vals.push(respuesta_admin); sets.push(`respuesta_admin = $${vals.length}`); }
  if (sets.length === 0) return res.status(400).json({ error: 'No se enviaron campos para actualizar.' });
  vals.push(id);
  const { rows } = await pool.query(`UPDATE quejas SET ${sets.join(', ')} WHERE id = $${vals.length} RETURNING id, estado, respuesta_admin`, vals);
  if (rows.length === 0) return res.status(404).json({ error: 'Queja no encontrada.' });
  res.json({ mensaje: 'Queja actualizada.', queja: rows[0] });
}

module.exports = { crearQueja, listarQuejas, actualizarQueja };