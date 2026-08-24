const express = require("express");
const router = express.Router();

const { requireAuth } = require("../middleware/auth");
const { asyncHandler } = require("../utils/asyncHandler");
const { uploadMemoria, validarBacheHandler } = require("../controllers/iaController");

/**
 * POST /api/ia/validar-bache
 * Valida con IA si la imagen contiene un bache.
 * Requiere autenticación JWT y una imagen en campo "foto".
 */
router.post(
  "/validar-bache",
  requireAuth,
  uploadMemoria.single("foto"),
  asyncHandler(validarBacheHandler)
);

module.exports = router;
