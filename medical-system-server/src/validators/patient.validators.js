import { body } from 'express-validator';
import { PATIENT_STATUS } from '../constants/crud-statuses.js';

const baseRules = {
  cedula: body('cedula').trim().notEmpty().withMessage('La cedula es obligatoria'),
  nombre: body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio'),
  apellido: body('apellido').trim().notEmpty().withMessage('El apellido es obligatorio'),
  correo: body('correo').trim().isEmail().withMessage('El correo debe ser valido').normalizeEmail(),
  telefono: body('telefono').trim().notEmpty().withMessage('El telefono es obligatorio'),
  direccion: body('direccion').trim().notEmpty().withMessage('La direccion es obligatoria'),
  fechaNacimiento: body('fechaNacimiento').isISO8601().withMessage('La fecha de nacimiento es invalida'),
  estado: body('estado').optional().isIn(PATIENT_STATUS).withMessage('El estado es invalido')
};

export const createPatientValidator = [
  baseRules.cedula,
  baseRules.nombre,
  baseRules.apellido,
  baseRules.correo,
  baseRules.telefono,
  baseRules.direccion,
  baseRules.fechaNacimiento,
  baseRules.estado
];

export const updatePatientValidator = [
  body('cedula').optional().trim().notEmpty().withMessage('La cedula es obligatoria'),
  body('nombre').optional().trim().notEmpty().withMessage('El nombre es obligatorio'),
  body('apellido').optional().trim().notEmpty().withMessage('El apellido es obligatorio'),
  body('correo').optional().trim().isEmail().withMessage('El correo debe ser valido').normalizeEmail(),
  body('telefono').optional().trim().notEmpty().withMessage('El telefono es obligatorio'),
  body('direccion').optional().trim().notEmpty().withMessage('La direccion es obligatoria'),
  body('fechaNacimiento').optional().isISO8601().withMessage('La fecha de nacimiento es invalida'),
  body('estado').optional().isIn(PATIENT_STATUS).withMessage('El estado es invalido')
];
