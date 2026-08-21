/**
 * Promueve un usuario ya registrado (vía /api/register o el formulario web)
 * al rol de administrador. Es la forma más simple de crear el primer admin,
 * ya que por diseño /api/register siempre crea cuentas con rol "ciudadano"
 * (nadie puede auto-asignarse administrador desde el formulario público).
 *
 * Uso:
 *   node scripts/crear-admin.js correo@ejemplo.com
 */
require("dotenv").config();
const pool = require("../src/config/db");

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Uso: node scripts/crear-admin.js correo@ejemplo.com");
    process.exit(1);
  }

  const { rows } = await pool.query(
    `UPDATE usuarios SET rol_id = (SELECT id FROM roles WHERE nombre = 'administrador')
     WHERE email = $1
     RETURNING id, nombre, apellido, email`,
    [email]
  );

  if (rows.length === 0) {
    console.error(`No existe ningún usuario registrado con el correo "${email}".`);
    console.error("Primero regístrate normalmente desde la página web y luego vuelve a ejecutar este script.");
    process.exit(1);
  }

  console.log(`✅ ${rows[0].nombre} ${rows[0].apellido} (${rows[0].email}) ahora tiene rol administrador.`);
  await pool.end();
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
