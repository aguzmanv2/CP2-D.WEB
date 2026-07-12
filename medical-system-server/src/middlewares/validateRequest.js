import { validationResult } from 'express-validator';
import { AppError } from '../errors/AppError.js';

export const validateRequest = (req, res, next) => {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    return next(new AppError('Validation failed', 400, { errors: result.array() }));
  }

  next();
};

