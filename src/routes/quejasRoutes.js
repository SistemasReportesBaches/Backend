const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/quejasController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../utils/asyncHandler');

router.post('/', requireAuth, asyncHandler(ctrl.crearQueja));
router.get('/', requireAuth, requireRole('administrador'), asyncHandler(ctrl.listarQuejas));
router.put('/:id', requireAuth, requireRole('administrador'), asyncHandler(ctrl.actualizarQueja));

module.exports = router;