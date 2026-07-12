import { body, param, query } from 'express-validator';
import { TURN_STATUS_VALUES } from '../constants/turn-statuses.js';

export const registerArrivalValidator = [
  body('cita').isMongoId().withMessage('La cita es invalida')
];

export const doctorTurnActionValidator = [
  body('turnoId').isMongoId().withMessage('El turno es invalido')
];

export const historyQueryValidator = [
  query('medico').optional().isMongoId().withMessage('El medico es invalido'),
  query('paciente').optional().isMongoId().withMessage('El paciente es invalido'),
  query('estado').optional().isIn(TURN_STATUS_VALUES).withMessage('El estado es invalido'),
  query('fecha').optional().isISO8601().withMessage('La fecha es invalida'),
  query('page').optional().isInt({ min: 1 }).withMessage('La pagina es invalida'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('El limite es invalido')
];

export const idValidator = [param('id').isMongoId().withMessage('El identificador es invalido')];

