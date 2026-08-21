const express = require("express");
const router = express.Router();

const ctrl = require("../controllers/grafoController");
const { requireAuth, requireRole } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { grafoSchema, rutaOptimaSchema } = require("../schemas/reportSchemas");

// Todo el módulo de grafos es exclusivo del rol administrador (RBAC).
router.use(requireAuth, requireRole("administrador"));

router.post("/bfs", validate(grafoSchema), ctrl.ejecutarBFS);
router.post("/dfs", validate(grafoSchema), ctrl.ejecutarDFS);
router.post("/ruta-optima", validate(rutaOptimaSchema), ctrl.ejecutarRutaOptima);

module.exports = router;
