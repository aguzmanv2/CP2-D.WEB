import { Router } from 'express';
import { authorizeRoles, verifyToken } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { ROLES } from '../constants/roles.js';
import {
  doctorTurnActionValidator,
  historyQueryValidator,
  registerArrivalValidator
} from '../validators/turn.validators.js';
import {
  currentTurnController,
  finishAttentionController,
  historyController,
  nextTurnController,
  patientTurnController,
  queueController,
  registerArrivalController,
  startAttentionController
} from '../controllers/turn.controller.js';

const router = Router();

router.use(verifyToken);

router.post('/registrar-llegada', authorizeRoles(ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA), registerArrivalValidator, validateRequest, registerArrivalController);
router.get('/cola', authorizeRoles(ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA, ROLES.MEDICO), queueController);
router.get('/actual', authorizeRoles(ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA, ROLES.MEDICO), currentTurnController);
router.get('/siguiente', authorizeRoles(ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA, ROLES.MEDICO), nextTurnController);
router.get('/paciente', authorizeRoles(ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA, ROLES.MEDICO, ROLES.PACIENTE), patientTurnController);
router.get('/historial', authorizeRoles(ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA, ROLES.MEDICO), historyQueryValidator, validateRequest, historyController);
router.post('/atender', authorizeRoles(ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA, ROLES.MEDICO), doctorTurnActionValidator, validateRequest, startAttentionController);
router.post('/finalizar', authorizeRoles(ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA, ROLES.MEDICO), doctorTurnActionValidator, validateRequest, finishAttentionController);

export default router;
