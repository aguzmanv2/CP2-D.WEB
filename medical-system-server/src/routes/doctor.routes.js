import { Router } from 'express';
import { authorizeRoles, verifyToken } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { createDoctorValidator, updateDoctorValidator } from '../validators/doctor.validators.js';
import { idParamValidator } from '../validators/common.validators.js';
import { destroy, index, show, store, update } from '../controllers/doctor.controller.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.get('/', verifyToken, index);
router.get('/:id', verifyToken, idParamValidator, validateRequest, show);
router.post('/', verifyToken, authorizeRoles(ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA), createDoctorValidator, validateRequest, store);
router.put(
  '/:id',
  verifyToken,
  authorizeRoles(ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA),
  ...idParamValidator,
  ...updateDoctorValidator,
  validateRequest,
  update
);
router.delete('/:id', verifyToken, authorizeRoles(ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA), idParamValidator, validateRequest, destroy);

export default router;
