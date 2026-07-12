import { Router } from 'express';
import { authorizeRoles, verifyToken } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { createAppointmentValidator, updateAppointmentValidator } from '../validators/appointment.validators.js';
import { idParamValidator } from '../validators/common.validators.js';
import { destroy, index, show, store, update } from '../controllers/appointment.controller.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.use(verifyToken);

router.get('/', authorizeRoles(ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA, ROLES.MEDICO), index);
router.get('/:id', authorizeRoles(ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA, ROLES.MEDICO), idParamValidator, validateRequest, show);
router.post('/', authorizeRoles(ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA, ROLES.MEDICO), createAppointmentValidator, validateRequest, store);
router.put('/:id', authorizeRoles(ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA, ROLES.MEDICO), ...idParamValidator, ...updateAppointmentValidator, validateRequest, update);
router.delete('/:id', authorizeRoles(ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA), idParamValidator, validateRequest, destroy);

export default router;
