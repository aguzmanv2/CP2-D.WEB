import { Router } from 'express';
import { authorizeRoles, verifyToken } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { ROLES } from '../constants/roles.js';
import { dashboard, download, table } from '../controllers/report.controller.js';
import { reportExportValidator, reportQueryValidator } from '../validators/report.validators.js';

const router = Router();

router.use(verifyToken);
router.use(authorizeRoles(ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA));

router.get('/dashboard', reportQueryValidator, validateRequest, dashboard);
router.get('/table', reportQueryValidator, validateRequest, table);
router.get('/export/:format', reportExportValidator, validateRequest, download);

export default router;

