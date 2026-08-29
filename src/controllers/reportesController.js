const pool = require("../config/db");

const SELECT_BASE = `
  SELECT r.id, r.descripcion, r.fotografia_url, r.latitud, r.longitud, r.precision_gps,
         g.nombre AS gravedad, g.color_hex, e.nombre AS estado,
         r.fecha_reporte, r.fecha_actualizacion,

         r.notify_usuario,
         u.id AS usuario_id, u.nombre AS usuario_nombre, u.apellido AS usuario_apellido,
         u.email AS usuario_email, u.estado AS usuario_estado, ro.nombre AS usuario_rol
  FROM reportes r
  JOIN gravedades g ON g.id = r.gravedad_id
  JOIN estados e    ON e.id = r.estado_id
  JOIN usuarios u   ON u.id = r.usuario_id
  JOIN roles ro     ON ro.id = u.rol_id
`;

// GET /api/reportes  — listado con filtros opcionales
async function listar(req, res) {
  const { gravedad, estado, fecha_desde, fecha_hasta, q } = req.query;
  const condiciones = [];
  const valores = [];

  if (gravedad) { valores.push(gravedad); condiciones.push(`g.nombre = $${valores.length}`); }
  if (estado)   { valores.push(estado);   condiciones.push(`e.nombre = $${valores.length}`); }
  if (fecha_desde) { valores.push(fecha_desde); condiciones.push(`r.fecha_reporte >= $${valores.length}`); }
  if (fecha_hasta)  { valores.push(fecha_hasta); condiciones.push(`r.fecha_reporte <= $${valores.length}`); }
  if (q && String(q).trim()) {
    const termino = `%${String(q).trim().toLowerCase()}%`;
    valores.push(termino);
    condiciones.push(`(
      LOWER(r.descripcion) ILIKE $${valores.length}
      OR LOWER(CONCAT(u.nombre, ' ', u.apellido)) ILIKE $${valores.length}
      OR LOWER(CAST(r.latitud AS TEXT)) LIKE $${valores.length}
      OR LOWER(CAST(r.longitud AS TEXT)) LIKE $${valores.length}
    )`);
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";
  const { rows } = await pool.query(`${SELECT_BASE} ${where} ORDER BY r.fecha_reporte DESC`, valores);
  res.json({ total: rows.length, reportes: rows });
}

// GET /api/reportes/:id
async function obtenerPorId(req, res) {
  const { rows } = await pool.query(`${SELECT_BASE} WHERE r.id = $1`, [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ error: "Reporte no encontrado." });
  res.json({ reporte: rows[0] });
}

// POST /api/reportes  (requiere autenticación; foto ya procesada por multer en la ruta)
async function crear(req, res) {
  const { descripcion, latitud, longitud, precision_gps, gravedad, notify_usuario } = req.validated;
  const usuarioId = req.user.id;
  const fotografiaUrl = req.file ? `/uploads/${req.file.filename}` : null;

  if (!fotografiaUrl) {
    return res.status(400).json({ error: "Debe adjuntar una fotografía del bache." });
  }

  try {
    const gravedadRow = await pool.query("SELECT id FROM gravedades WHERE nombre = $1", [gravedad]);
    const estadoPendiente = await pool.query("SELECT id FROM estados WHERE nombre = 'pendiente'");

    const { rows } = await pool.query(
      `INSERT INTO reportes (usuario_id, descripcion, fotografia_url, latitud, longitud, precision_gps, gravedad_id, estado_id, notify_usuario)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id, descripcion, fotografia_url, latitud, longitud, fecha_reporte, notify_usuario`,
      [usuarioId, descripcion, fotografiaUrl, latitud, longitud, precision_gps || null, gravedadRow.rows[0].id, estadoPendiente.rows[0].id, notify_usuario || false]
    );

    res.status(201).json({ reporte: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error interno al crear el reporte." });
  }
}

// PUT /api/reportes/:id  (solo administrador)
async function actualizar(req, res) {
  const { descripcion, gravedad, estado } = req.validated;
  const sets = [];
  const valores = [];

  if (descripcion) { valores.push(descripcion); sets.push(`descripcion = $${valores.length}`); }
  if (gravedad) {
    const g = await pool.query("SELECT id FROM gravedades WHERE nombre = $1", [gravedad]);
    valores.push(g.rows[0].id); sets.push(`gravedad_id = $${valores.length}`);
  }
  if (estado) {
    const e = await pool.query("SELECT id FROM estados WHERE nombre = $1", [estado]);
    valores.push(e.rows[0].id); sets.push(`estado_id = $${valores.length}`);
  }

  if (sets.length === 0) return res.status(400).json({ error: "No se enviaron campos para actualizar." });

  valores.push(req.params.id);
  const { rows } = await pool.query(
    `UPDATE reportes SET ${sets.join(", ")} WHERE id = $${valores.length} RETURNING id`,
    valores
  );

  if (rows.length === 0) return res.status(404).json({ error: "Reporte no encontrado." });

  // Después de actualizar, generar una notificación para el autor si marcó recibir notificaciones
  try {
    const repQ = await pool.query(
      `SELECT r.usuario_id, r.notify_usuario, e.nombre AS estado_nombre FROM reportes r JOIN estados e ON e.id = r.estado_id WHERE r.id = $1`,
      [req.params.id]
    );
    if (repQ.rows.length) {
      const { usuario_id, notify_usuario, estado_nombre } = repQ.rows[0];
      if (notify_usuario) {
        const mensaje = `El estado de su reporte #${req.params.id} ha cambiado a: ${estado_nombre}`;
        await pool.query(
          `INSERT INTO notificaciones (usuario_id, reporte_id, tipo, mensaje) VALUES ($1,$2,$3,$4)`,
          [usuario_id, req.params.id, 'estado_cambio', mensaje]
        );
      }
    }
  } catch (err) {
    console.error('Error al crear notificación:', err);
    // no interrumpir la respuesta principal
  }

  res.json({ mensaje: "Reporte actualizado.", id: rows[0].id });
}

// DELETE /api/reportes/:id  (solo administrador)
async function eliminar(req, res) {
  const { rowCount } = await pool.query("DELETE FROM reportes WHERE id = $1", [req.params.id]);
  if (rowCount === 0) return res.status(404).json({ error: "Reporte no encontrado." });
  res.status(204).send();
}

// GET /api/reportes/mapa  — formato GeoJSON, listo para Leaflet
async function mapa(req, res) {
  // Por defecto ocultar reportes atendidos en el mapa público. El admin puede pedir incluir_atendidos=true.
  const incluirAtendidos = req.query.incluir_atendidos === 'true';
  const whereClause = incluirAtendidos ? "WHERE e.nombre <> 'rechazado'" : "WHERE e.nombre NOT IN ('rechazado','atendido')";
  const { rows } = await pool.query(`${SELECT_BASE} ${whereClause} ORDER BY r.fecha_reporte DESC`);
  const geojson = {
    type: "FeatureCollection",
    features: rows.map((r) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [r.longitud, r.latitud] },
      properties: {
        id: r.id,
        gravedad: r.gravedad,
        color: r.color_hex,
        estado: r.estado,
        descripcion: r.descripcion,
        fotografia_url: r.fotografia_url,
        latitud: r.latitud,
        longitud: r.longitud,
        precision_gps: r.precision_gps,
        fecha_reporte: r.fecha_reporte,
        fecha_actualizacion: r.fecha_actualizacion,
        usuario_id: r.usuario_id,
        usuario_nombre: r.usuario_nombre,
        usuario_apellido: r.usuario_apellido,
        usuario_email: r.usuario_email,
        usuario_rol: r.usuario_rol,
        usuario_estado: r.usuario_estado,
        usuario: `${r.usuario_nombre} ${r.usuario_apellido}`,
        notify_usuario: r.notify_usuario === true,
      },
    })),
  };
  res.json(geojson);
}

// GET /api/reportes/zona  — reportes dentro de un polígono o radio (PostGIS)
async function porZona(req, res) {
  const { lat, lng, radioMetros, poligonoGeoJSON } = req.query;

  try {
    let rows;
    if (poligonoGeoJSON) {
          const incluirAtendidos = req.query.incluir_atendidos === 'true';
          const notInClause = incluirAtendidos ? "e.nombre <> 'rechazado'" : "e.nombre NOT IN ('rechazado','atendido')";
          ({ rows } = await pool.query(
            `${SELECT_BASE} WHERE ${notInClause} AND ST_Contains(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326), r.geom)`,
            [poligonoGeoJSON]
          ));
        } else if (lat && lng && radioMetros) {
          const incluirAtendidos = req.query.incluir_atendidos === 'true';
          const notInClause = incluirAtendidos ? "e.nombre <> 'rechazado'" : "e.nombre NOT IN ('rechazado','atendido')";
          ({ rows } = await pool.query(
            `${SELECT_BASE} WHERE ${notInClause} AND ST_DWithin(r.geom::geography, ST_MakePoint($1,$2)::geography, $3)`,
            [lng, lat, radioMetros]
          ));
        } else {
      return res.status(400).json({ error: "Debe indicar un polígono (poligonoGeoJSON) o un radio (lat, lng, radioMetros)." });
    }
    res.json({ total: rows.length, reportes: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al consultar reportes por zona." });
  }
}

// GET /api/reportes/estadisticas — métricas agregadas para el dashboard
async function estadisticas(req, res) {
  const [totales, porGravedad, porEstado, hoy, semana, mes] = await Promise.all([
    pool.query("SELECT COUNT(*) FROM reportes"),
    pool.query(`SELECT g.nombre, COUNT(*) FROM reportes r JOIN gravedades g ON g.id = r.gravedad_id GROUP BY g.nombre`),
    pool.query(`SELECT e.nombre, COUNT(*) FROM reportes r JOIN estados e ON e.id = r.estado_id GROUP BY e.nombre`),
    pool.query(`SELECT COUNT(*) FROM reportes WHERE fecha_reporte::date = CURRENT_DATE`),
    pool.query(`SELECT COUNT(*) FROM reportes WHERE fecha_reporte >= date_trunc('week', CURRENT_DATE)`),
    pool.query(`SELECT COUNT(*) FROM reportes WHERE fecha_reporte >= date_trunc('month', CURRENT_DATE)`),
  ]);

  res.json({
    total: Number(totales.rows[0].count),
    por_gravedad: porGravedad.rows,
    por_estado: porEstado.rows,
    hoy: Number(hoy.rows[0].count),
    esta_semana: Number(semana.rows[0].count),
    este_mes: Number(mes.rows[0].count),
  });
}

// GET /api/reportes/mios  — reportes del usuario autenticado (para "Mis reportes")
async function misReportes(req, res) {
  const { rows } = await pool.query(`${SELECT_BASE} WHERE u.id = $1 ORDER BY r.fecha_reporte DESC`, [req.user.id]);
  res.json({ total: rows.length, reportes: rows });
}

module.exports = { listar, obtenerPorId, crear, actualizar, eliminar, mapa, porZona, estadisticas, misReportes };
