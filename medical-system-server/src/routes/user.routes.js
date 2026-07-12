import { Router } from 'express';
import { authorizeRoles, verifyToken } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { listUsersValidator, lookupByCedulaValidator, updateUserRoleValidator } from '../validators/user.validators.js';
import { ROLES } from '../constants/roles.js';
import { changeUserRole, getUsers, lookupByCedula } from '../controllers/user.controller.js';

const router = Router();

router.get(
  '/lookup',
  verifyToken,
  authorizeRoles(ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA),
  lookupByCedulaValidator,
  validateRequest,
  lookupByCedula
);

router.get(
  '/',
  verifyToken,
  authorizeRoles(ROLES.ADMINISTRADOR),
  listUsersValidator,
  validateRequest,
  getUsers
);

router.patch(
  '/:id/role',
  verifyToken,
  authorizeRoles(ROLES.ADMINISTRADOR),
  updateUserRoleValidator,
  validateRequest,
  changeUserRole
);

export default router;
