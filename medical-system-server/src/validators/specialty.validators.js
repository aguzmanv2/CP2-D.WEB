import { body } from 'express-validator';
import { SPECIALTY_STATUS } from '../constants/crud-statuses.js';

export const createSpecialtyValidator = [
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio'),
  body('descripcion').trim().notEmpty().withMessage('La descripcion es obligatoria'),
  body('estado').optional().isIn(SPECIALTY_STATUS).withMessage('El estado es invalido')
];

export const updateSpecialtyValidator = [
  body('nombre').optional().trim().notEmpty().withMessage('El nombre es obligatorio'),
  body('descripcion').optional().trim().notEmpty().withMessage('La descripcion es obligatoria'),
  body('estado').optional().isIn(SPECIALTY_STATUS).withMessage('El estado es invalido')
];
