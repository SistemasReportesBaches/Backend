const multer = require("multer");
const { validarBache } = require("../services/iaService");

// Multer en memoria: solo para análisis temporal, NO se guarda en disco
const uploadMemoria = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: (Number(process.env.MAX_PHOTO_SIZE_MB) || 5) * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const TIPOS = ["image/jpeg", "image/png", "image/webp"];
    if (!TIPOS.includes(file.mimetype)) {
      return cb(new Error("Formato de imagen no permitido. Solo JPG, PNG o WEBP."));
    }
    cb(null, true);
  },
});

/**
 * POST /api/ia/validar-bache
 * Recibe una imagen y devuelve el resultado del análisis IA.
 * La imagen NO se guarda; solo se usa para el análisis temporal.
 */
async function validarBacheHandler(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: "Se requiere una imagen para el análisis." });
  }

  if (!process.env.GEMINI_API_KEY) {
    console.warn("[iaController] GEMINI_API_KEY no configurada — aprobando sin análisis.");
    return res.json({
      esBache: true,
      confianza: "baja",
      mensaje: "Validación IA no disponible. El reporte fue pre-aprobado.",
    });
  }

  try {
    const resultado = await validarBache(req.file.buffer, req.file.mimetype);
    return res.json(resultado);
  } catch (err) {
    console.error("[iaController] Error en validación IA:", err.message);
    // Fallback: ante error de IA, no bloqueamos al usuario (degradación elegante)
    return res.json({
      esBache: true,
      confianza: "baja",
      mensaje: "Error al conectar con el servicio de IA. El reporte fue pre-aprobado.",
      _fallback: true,
    });
  }
}

module.exports = { uploadMemoria, validarBacheHandler };
