import { body, param, query } from 'express-validator';
import { ROLE_VALUES } from '../constants/roles.js';

export const lookupByCedulaValidator = [
  query('cedula').trim().notEmpty().withMessage('La cedula es obligatoria')
];

export const listUsersValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('La pagina debe ser mayor o igual a 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('El limite debe estar entre 1 y 100'),
  query('search').optional().trim().isString().withMessage('La busqueda debe ser texto'),
  query('rol').optional().trim().isIn([...ROLE_VALUES, '']).withMessage('El rol seleccionado no es valido'),
  query('estado').optional().trim().isIn(['Activo', 'Inactivo', '']).withMessage('El estado seleccionado no es valido')
];

export const updateUserRoleValidator = [
  param('id').isMongoId().withMessage('Identificador invalido'),
  body('rol').trim().notEmpty().withMessage('El rol es obligatorio').isIn(ROLE_VALUES).withMessage('El rol seleccionado no es valido')
];
