const express = require("express");
const router = express.Router();

const ctrl = require("../controllers/reportesController");
const { requireAuth, requireRole } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { crearReporteSchema, actualizarReporteSchema } = require("../schemas/reportSchemas");
const { uploadFoto } = require("../middleware/upload");
const { asyncHandler } = require("../utils/asyncHandler");

// Rutas específicas ANTES de "/:id" para que Express no las confunda con un id.
router.get("/mapa", asyncHandler(ctrl.mapa));
router.get("/zona", asyncHandler(ctrl.porZona));
router.get("/estadisticas", requireAuth, requireRole("administrador"), asyncHandler(ctrl.estadisticas));
router.get("/mios", requireAuth, asyncHandler(ctrl.misReportes));

router.get("/", asyncHandler(ctrl.listar));
router.get("/:id", asyncHandler(ctrl.obtenerPorId));

router.post("/", requireAuth, uploadFoto.single("foto"), validate(crearReporteSchema), asyncHandler(ctrl.crear));
router.put("/:id", requireAuth, requireRole("administrador"), validate(actualizarReporteSchema), asyncHandler(ctrl.actualizar));
router.delete("/:id", requireAuth, requireRole("administrador"), asyncHandler(ctrl.eliminar));

module.exports = router;
