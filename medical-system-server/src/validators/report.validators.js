import { param, query } from 'express-validator';

const sortFields = [
  'numeroTurno',
  'paciente',
  'medico',
  'especialidad',
  'horaLlegada',
  'horaInicio',
  'horaFin',
  'tiempoTotalEspera',
  'tiempoTotalConsulta',
  'estado',
  'fecha',
  'createdAt'
];

const sortOrders = ['asc', 'desc'];
const exportFormats = ['csv', 'excel', 'pdf'];

export const reportQueryValidator = [
  query('fechaInicio').optional({ checkFalsy: true }).isISO8601().withMessage('La fecha inicial es invalida'),
  query('fechaFin').optional({ checkFalsy: true }).isISO8601().withMessage('La fecha final es invalida'),
  query('especialidad').optional({ checkFalsy: true }).isMongoId().withMessage('La especialidad es invalida'),
  query('medico').optional({ checkFalsy: true }).isMongoId().withMessage('El medico es invalido'),
  query('search').optional({ checkFalsy: true }).isString().withMessage('La busqueda es invalida'),
  query('page').optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage('La pagina es invalida'),
  query('limit').optional({ checkFalsy: true }).isInt({ min: 1, max: 100 }).withMessage('El limite es invalido'),
  query('sortBy').optional({ checkFalsy: true }).isIn(sortFields).withMessage('El ordenamiento es invalido'),
  query('sortOrder').optional({ checkFalsy: true }).isIn(sortOrders).withMessage('El sentido de ordenamiento es invalido')
];

export const reportExportValidator = [
  param('format').isIn(exportFormats).withMessage('El formato de exportacion es invalido'),
  ...reportQueryValidator
];
