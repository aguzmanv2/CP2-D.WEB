import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { AppError } from '../errors/AppError.js';

export const verifyToken = async (req, res, next) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return next(new AppError('No autorizado', 401));
  }

  const token = authorizationHeader.slice(7).trim();

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.userId).select('-password');

    if (!user || !user.estado) {
      return next(new AppError('No autorizado', 401));
    }

    req.user = user;
    req.tokenPayload = payload;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token expirado', 401));
    }

    return next(new AppError('No autorizado', 401));
  }
};

export const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return next(new AppError('No autorizado', 401));
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.rol)) {
    return next(new AppError('Acceso denegado', 403));
  }

  next();
};
