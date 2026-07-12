import { body } from 'express-validator';
import { DOCTOR_STATUS } from '../constants/crud-statuses.js';

export const createDoctorValidator = [
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio'),
  body('apellido').trim().notEmpty().withMessage('El apellido es obligatorio'),
  body('especialidad').isMongoId().withMessage('La especialidad es invalida'),
  body('consultorio').trim().notEmpty().withMessage('El consultorio es obligatorio'),
  body('tiempoPromedioConsulta')
    .isNumeric()
    .withMessage('El tiempo promedio debe ser numerico')
    .custom((value) => Number(value) >= 5)
    .withMessage('El tiempo promedio debe ser mayor o igual a 5'),
  body('estado').optional().isIn(DOCTOR_STATUS).withMessage('El estado es invalido')
];

export const updateDoctorValidator = [
  body('nombre').optional().trim().notEmpty().withMessage('El nombre es obligatorio'),
  body('apellido').optional().trim().notEmpty().withMessage('El apellido es obligatorio'),
  body('especialidad').optional().isMongoId().withMessage('La especialidad es invalida'),
  body('consultorio').optional().trim().notEmpty().withMessage('El consultorio es obligatorio'),
  body('tiempoPromedioConsulta')
    .optional()
    .isNumeric()
    .withMessage('El tiempo promedio debe ser numerico')
    .custom((value) => Number(value) >= 5)
    .withMessage('El tiempo promedio debe ser mayor o igual a 5'),
  body('estado').optional().isIn(DOCTOR_STATUS).withMessage('El estado es invalido')
];
