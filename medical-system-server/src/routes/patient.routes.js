import { Router } from 'express';
import { authorizeRoles, verifyToken } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { createPatientValidator, updatePatientValidator } from '../validators/patient.validators.js';
import { idParamValidator } from '../validators/common.validators.js';
import { destroy, index, show, store, update } from '../controllers/patient.controller.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.get('/', verifyToken, authorizeRoles(ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA, ROLES.MEDICO), index);
router.get('/:id', verifyToken, authorizeRoles(ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA, ROLES.MEDICO), idParamValidator, validateRequest, show);
router.post('/', verifyToken, authorizeRoles(ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA), createPatientValidator, validateRequest, store);
router.put(
  '/:id',
  verifyToken,
  authorizeRoles(ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA),
  ...idParamValidator,
  ...updatePatientValidator,
  validateRequest,
  update
);
router.delete('/:id', verifyToken, authorizeRoles(ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA), idParamValidator, validateRequest, destroy);

export default router;
