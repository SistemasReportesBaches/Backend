const express = require("express");
const router = express.Router();

const ctrl = require("../controllers/usuariosController");
const { requireAuth, requireRole } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { actualizarUsuarioSchema } = require("../schemas/reportSchemas");
const { asyncHandler } = require("../utils/asyncHandler");

// Toda la gestión de usuarios es exclusiva del rol administrador (RBAC).
router.use(requireAuth, requireRole("administrador"));

router.get("/", asyncHandler(ctrl.listar));
router.put("/:id", validate(actualizarUsuarioSchema), asyncHandler(ctrl.actualizar));

module.exports = router;
