const pool = require("../config/db");

// GET /api/usuarios — listado con conteo de reportes por usuario
async function listar(req, res) {
  const { rows } = await pool.query(`
    SELECT u.id, u.nombre, u.apellido, u.email, u.estado, u.fecha_registro, r.nombre AS rol,
           COUNT(rep.id) AS total_reportes
    FROM usuarios u
    JOIN roles r ON r.id = u.rol_id
    LEFT JOIN reportes rep ON rep.usuario_id = u.id
    GROUP BY u.id, r.nombre
    ORDER BY u.fecha_registro DESC
  `);
  res.json({ total: rows.length, usuarios: rows });
}

// PUT /api/usuarios/:id — cambiar rol y/o estado (RBAC administrado por un administrador)
async function actualizar(req, res) {
  const { rol, estado } = req.validated;
  const sets = [];
  const valores = [];

  if (rol) {
    const r = await pool.query("SELECT id FROM roles WHERE nombre = $1", [rol]);
    if (r.rows.length === 0) return res.status(400).json({ error: "Rol no válido." });
    valores.push(r.rows[0].id);
    sets.push(`rol_id = $${valores.length}`);
  }
  if (estado) {
    valores.push(estado);
    sets.push(`estado = $${valores.length}`);
  }
  if (sets.length === 0) return res.status(400).json({ error: "No se enviaron campos para actualizar." });

  // Un administrador no puede quitarse a sí mismo el rol de administrador por accidente.
  if (Number(req.params.id) === req.user.id && rol && rol !== "administrador") {
    return res.status(400).json({ error: "No puedes cambiar tu propio rol de administrador." });
  }

  valores.push(req.params.id);
  const { rows } = await pool.query(
    `UPDATE usuarios SET ${sets.join(", ")} WHERE id = $${valores.length} RETURNING id, nombre, apellido, email`,
    valores
  );
  if (rows.length === 0) return res.status(404).json({ error: "Usuario no encontrado." });
  res.json({ mensaje: "Usuario actualizado.", usuario: rows[0] });
}

module.exports = { listar, actualizar };
