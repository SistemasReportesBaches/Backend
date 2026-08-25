/**
 * seed-data.js — Baches SCZ
 * Genera 20 usuarios ciudadanos y 40 reportes geolocalizados en Santa Cruz
 * con estado 'atendido' (aceptados/procesados) para visualización en el Panel Administrativo y Mapa.
 *
 * Uso:
 *   node scripts/seed-data.js
 *   o
 *   npm run seed
 */
require("dotenv").config();
const bcrypt = require("bcrypt");
const pool = require("../src/config/db");

const SALT_ROUNDS = 10;
const DEFAULT_PASSWORD = "Password123!"; // Contraseña para todos los usuarios de prueba

// Nombres y apellidos comunes en Santa Cruz de la Sierra
const NOMBRES = [
  "Carlos", "María", "José", "Lucía", "Jorge",
  "Alejandra", "Mateo", "Camila", "Fernando", "Valeria",
  "Rodrigo", "Sofía", "Diego", "Paola", "Sebastián",
  "Andrea", "Mauricio", "Natalia", "Gabriel", "Mariana"
];

const APELLIDOS = [
  "Justiniano", "Suárez", "Aguilera", "Roca", "Peredo",
  "Vaca", "Saucedo", "Chávez", "Cuéllar", "Mendoza",
  "Ribera", "Gutiérrez", "Montaño", "Flores", "Salazar",
  "Terceros", "Antelo", "Hurtado", "Pinto", "Zabala"
];

// Calles y zonas representativas de Santa Cruz para descripciones realistas
const ZONAS_SANTA_CRUZ = [
  { zona: "Av. Cristo Redentor y 3er Anillo", lat: -17.7580, lng: -63.1780 },
  { zona: "Av. San Martín, Equipetrol", lat: -17.7650, lng: -63.1950 },
  { zona: "Av. Banzer y 4to Anillo", lat: -17.7450, lng: -63.1720 },
  { zona: "Av. Monseñor Rivero", lat: -17.7730, lng: -63.1810 },
  { zona: "Av. Santos Dumont y 2do Anillo", lat: -17.8010, lng: -63.1880 },
  { zona: "Doble Vía a La Guardia, Km 6", lat: -17.8250, lng: -63.2200 },
  { zona: "Av. Grigotá y La Ramada", lat: -17.7950, lng: -63.1890 },
  { zona: "Av. Busch y 3er Anillo Interno", lat: -17.7710, lng: -63.2010 },
  { zona: "Av. Virgen de Cotoca y 2do Anillo", lat: -17.7810, lng: -63.1610 },
  { zona: "Plan 3000, Av. Paurito", lat: -17.8300, lng: -63.1400 },
  { zona: "Villa 1 de Mayo, Av. Principal", lat: -17.7950, lng: -63.1420 },
  { zona: "Av. Centenario y 4to Anillo", lat: -17.7880, lng: -63.2120 },
  { zona: "Av. Tres Pasos al Frente y 3er Anillo", lat: -17.8050, lng: -63.1550 },
  { zona: "Av. Pirai y 2do Anillo", lat: -17.7910, lng: -63.2000 },
  { zona: "Radial 19 y 4to Anillo", lat: -17.8020, lng: -63.2180 }
];

const DESCRIPCIONES = [
  "Bache profundo en el carril derecho que daña neumáticos.",
  "Hundimiento de asfalto frente a parada de micros.",
  "Fisura severa y desnivel en cruce peatonal.",
  "Bache de gran tamaño con agua acumulada tras la lluvia.",
  "Cráter pronunciado que obliga a los vehículos a frenar bruscamente.",
  "Desprendimiento de capa asfáltica en la intersección.",
  "Bache peligroso cerca de unidad educativa.",
  "Fisuras múltiples que ocupan todo el ancho de la calzada."
];

async function seed() {
  console.log("🌱 Iniciando carga de datos de prueba (Seed)...");

  try {
    // 1. Obtener IDs de catálogos
    const rolCiudadanoRes = await pool.query("SELECT id FROM roles WHERE nombre = 'ciudadano'");
    if (rolCiudadanoRes.rows.length === 0) {
      throw new Error("El rol 'ciudadano' no existe en la base de datos. Ejecuta primero schema.sql");
    }
    const rolCiudadanoId = rolCiudadanoRes.rows[0].id;

    const gravedadesRes = await pool.query("SELECT id, nombre FROM gravedades");
    const gravedadesMap = {};
    gravedadesRes.rows.forEach(g => { gravedadesMap[g.nombre] = g.id; });

    const estadosRes = await pool.query("SELECT id, nombre FROM estados");
    const estadosMap = {};
    estadosRes.rows.forEach(e => { estadosMap[e.nombre] = e.id; });

    const estadoPendienteId = estadosMap["pendiente"] || Object.values(estadosMap)[0];
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

    // 2. Crear 20 Usuarios Ciudadanos
    console.log("👤 Creando 20 usuarios ciudadanos...");
    const usuariosIds = [];

    for (let i = 0; i < 20; i++) {
      const nombre = NOMBRES[i % NOMBRES.length];
      const apellido = APELLIDOS[i % APELLIDOS.length];
      const email = `ciudadano${i + 1}@ejemplo.com`;

      const insertUsuario = await pool.query(
        `INSERT INTO usuarios (nombre, apellido, email, password_hash, rol_id, estado, fecha_registro)
         VALUES ($1, $2, $3, $4, $5, 'activo', now() - ($6 || ' days')::INTERVAL)
         ON CONFLICT (email) DO UPDATE SET
           nombre = EXCLUDED.nombre,
           apellido = EXCLUDED.apellido,
           rol_id = EXCLUDED.rol_id,
           estado = 'activo'
         RETURNING id`,
        [nombre, apellido, email, passwordHash, rolCiudadanoId, Math.floor(Math.random() * 20) + 1]
      );

      usuariosIds.push(insertUsuario.rows[0].id);
    }
    console.log(`✅ ${usuariosIds.length} usuarios ciudadanos listos (Contraseña: ${DEFAULT_PASSWORD}).`);

    // Limpiar reportes de prueba anteriores generados por el seed
    await pool.query("DELETE FROM reportes WHERE usuario_id = ANY($1::int[]) AND fotografia_url = ''", [usuariosIds]);

    // 3. Crear 40 Reportes en estado pendiente
    console.log("📍 Creando 40 reportes en estado 'pendiente' en Santa Cruz...");
    const gravedadesList = ["leve", "moderado", "grave", "critico"];
    let reportesCreados = 0;

    for (let i = 0; i < 40; i++) {
      const baseZona = ZONAS_SANTA_CRUZ[i % ZONAS_SANTA_CRUZ.length];
      const usuarioId = usuariosIds[i % usuariosIds.length];
      const gravedadNombre = gravedadesList[i % gravedadesList.length];
      const gravedadId = gravedadesMap[gravedadNombre];
      const descBase = DESCRIPCIONES[i % DESCRIPCIONES.length];
      const descripcion = `${descBase} (${baseZona.zona})`;

      // Variación aleatoria de ±400 metros alrededor de la zona base
      const latOffset = (Math.random() - 0.5) * 0.008;
      const lngOffset = (Math.random() - 0.5) * 0.008;
      const lat = parseFloat((baseZona.lat + latOffset).toFixed(6));
      const lng = parseFloat((baseZona.lng + lngOffset).toFixed(6));

      // Días atrás para poblar gráficos del dashboard (últimos 14 días)
      const diasAtras = (i % 14);

      await pool.query(
        `INSERT INTO reportes (
           usuario_id, descripcion, fotografia_url, latitud, longitud,
           precision_gps, gravedad_id, estado_id, fecha_reporte, fecha_actualizacion, geom
         )
         VALUES (
           $1, $2, '', $3, $4,
           $5, $6, $7, now() - ($8 || ' days')::INTERVAL, now(),
           ST_SetSRID(ST_MakePoint($4, $3), 4326)
         )`,
        [
          usuarioId,
          descripcion,
          lat,
          lng,
          Math.floor(Math.random() * 8) + 4, // 4m a 12m precisión GPS
          gravedadId,
          estadoPendienteId,
          diasAtras
        ]
      );
      reportesCreados++;
    }

    console.log(`✅ ${reportesCreados} reportes creados con éxito con estado 'pendiente'.`);
    console.log("\n🎉 Proceso finalizado. Ahora puedes ingresar al panel administrativo y ver todos los datos.");
  } catch (err) {
    console.error("❌ Error al ejecutar el seed:", err.message);
  } finally {
    await pool.end();
  }
}

seed();
