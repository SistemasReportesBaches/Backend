const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/notificacionesController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../utils/asyncHandler');

router.get('/', requireAuth, asyncHandler(ctrl.listar));
router.put('/:id/leer', requireAuth, asyncHandler(ctrl.marcarLeida));

module.exports = router;