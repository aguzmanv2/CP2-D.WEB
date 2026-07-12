import { body } from 'express-validator';
import { ROLE_VALUES } from '../constants/roles.js';

export const registerValidator = [
  body('cedula').trim().notEmpty().withMessage('La cedula es obligatoria'),
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio'),
  body('apellido').trim().notEmpty().withMessage('El apellido es obligatorio'),
  body('correo').trim().isEmail().withMessage('El correo debe ser valido').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('La contrasena debe tener al menos 6 caracteres'),
  body('rol')
    .optional()
    .isIn(ROLE_VALUES)
    .withMessage('El rol no es valido')
];

export const loginValidator = [
  body('identificador').trim().notEmpty().withMessage('La cedula o el correo son obligatorios'),
  body('password').notEmpty().withMessage('La contrasena es obligatoria')
];
