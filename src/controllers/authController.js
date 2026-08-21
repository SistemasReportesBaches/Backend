const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const SALT_ROUNDS = 12;

async function register(req, res) {
  const { nombre, apellido, email, password } = req.validated;

  try {
    const existente = await pool.query("SELECT id FROM usuarios WHERE email = $1", [email]);
    if (existente.rows.length > 0) {
      return res.status(409).json({ error: "Ya existe una cuenta registrada con ese correo." });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const rolCiudadano = await pool.query("SELECT id FROM roles WHERE nombre = 'ciudadano'");

    const { rows } = await pool.query(
      `INSERT INTO usuarios (nombre, apellido, email, password_hash, rol_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nombre, apellido, email, fecha_registro`,
      [nombre, apellido, email, passwordHash, rolCiudadano.rows[0].id]
    );

    return res.status(201).json({ usuario: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno al registrar el usuario." });
  }
}

async function login(req, res) {
  const { email, password } = req.validated;

  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.nombre, u.apellido, u.email, u.password_hash, u.estado, r.nombre AS rol
       FROM usuarios u JOIN roles r ON r.id = u.rol_id
       WHERE u.email = $1`,
      [email]
    );

    // Mensaje genérico en ambos casos (usuario inexistente / password incorrecta)
    // para no revelar si el correo está registrado.
    const credencialesInvalidas = () => res.status(401).json({ error: "Credenciales inválidas." });

    if (rows.length === 0) return credencialesInvalidas();

    const usuario = rows[0];
    if (usuario.estado !== "activo") {
      return res.status(403).json({ error: "Esta cuenta se encuentra suspendida." });
    }

    const passwordValida = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValida) return credencialesInvalidas();

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "2h" }
    );

    return res.json({
      token,
      usuario: { id: usuario.id, nombre: usuario.nombre, apellido: usuario.apellido, email: usuario.email, rol: usuario.rol },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno al iniciar sesión." });
  }
}

module.exports = { register, login };
