require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const reportesRoutes = require("./routes/reportesRoutes");
const grafoRoutes = require("./routes/grafoRoutes");
const usuariosRoutes = require("./routes/usuariosRoutes");
const iaRoutes = require("./routes/iaRoutes");

const app = express();

// ---------- Seguridad y utilidades base ----------aaaaa
// Nota: se desactiva el Content-Security-Policy por defecto de helmet porque
// el frontend de este proyecto carga Leaflet y Google Fonts desde CDN y usa
// manejadores onclick inline; para producción se recomienda configurar un
// CSP explícito (script-src/style-src apuntando a los CDN usados) en vez de
// desactivarlo por completo.
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());                   // ajustar origin en producción a los dominios permitidos
app.use(express.json({ limit: "1mb" }));

// Fotografías subidas (servidas de forma estática; en producción usar un bucket/CDN)
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// Frontend (mismo origen que la API: evita CORS y permite levantar todo con un solo comando)
const FRONTEND_DIR = path.join(__dirname, "..", "..","FrontendWeb", "frontend");
app.use(express.static(FRONTEND_DIR));
app.get("/", (req, res) => res.redirect("/index.html"));

// ---------- Rutas de la API ----------
app.use("/api", authRoutes);
app.use("/api/reportes", reportesRoutes);
app.use("/api/grafo", grafoRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/ia", iaRoutes);

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// ---------- Manejo de errores centralizado ----------
app.use((err, req, res, next) => {
  if (err.message && err.message.includes("Formato de imagen")) {
    return res.status(400).json({ error: err.message });
  }
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "La fotografía supera el tamaño máximo permitido." });
  }
  console.error(err);
  return res.status(500).json({ error: "Error interno del servidor." });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API de Baches SCZ escuchando en el puerto ${PORT}`));

module.exports = app;
