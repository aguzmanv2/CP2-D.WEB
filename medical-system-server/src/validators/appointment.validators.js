import { body } from 'express-validator';
import { APPOINTMENT_STATUS } from '../constants/crud-statuses.js';

export const createAppointmentValidator = [
  body('paciente').isMongoId().withMessage('El paciente es invalido'),
  body('medico').isMongoId().withMessage('El medico es invalido'),
  body('especialidad').isMongoId().withMessage('La especialidad es invalida'),
  body('fecha').isISO8601().withMessage('La fecha es invalida'),
  body('hora')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('La hora es invalida'),
  body('estado').optional().isIn(APPOINTMENT_STATUS).withMessage('El estado es invalido')
];

export const updateAppointmentValidator = [
  body('paciente').optional().isMongoId().withMessage('El paciente es invalido'),
  body('medico').optional().isMongoId().withMessage('El medico es invalido'),
  body('especialidad').optional().isMongoId().withMessage('La especialidad es invalida'),
  body('fecha').optional().isISO8601().withMessage('La fecha es invalida'),
  body('hora')
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('La hora es invalida'),
  body('estado').optional().isIn(APPOINTMENT_STATUS).withMessage('El estado es invalido')
];
