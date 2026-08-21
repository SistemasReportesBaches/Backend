const rateLimit = require("express-rate-limit");

// Protege /api/login y /api/register contra ataques de fuerza bruta.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,                   // 10 intentos por IP en la ventana
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos. Inténtalo de nuevo en unos minutos." },
});

module.exports = { authLimiter };
