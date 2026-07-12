import User from '../models/User.js';
import { AppError } from '../errors/AppError.js';
import { buildPagination } from '../utils/pagination.js';

const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const findUserByCedula = async (cedula) => {
  const normalizedCedula = String(cedula || '').trim();

  if (!normalizedCedula) {
    throw new AppError('La cedula es obligatoria', 400);
  }

  const user = await User.findOne({ cedula: normalizedCedula }).select('cedula nombre apellido correo rol estado createdAt updatedAt');

  if (!user) {
    throw new AppError('Usuario no encontrado', 404);
  }

  return user;
};

export const listUsers = async ({ page = 1, limit = 10, search = '', rol = '', estado = '' }) => {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.max(Number(limit) || 10, 1);
  const skip = (safePage - 1) * safeLimit;
  const query = {};

  if (rol) {
    query.rol = rol;
  }

  if (estado === 'Activo') {
    query.estado = true;
  } else if (estado === 'Inactivo') {
    query.estado = false;
  }

  const term = String(search || '').trim();
  if (term) {
    const pattern = new RegExp(escapeRegex(term), 'i');
    query.$or = [{ cedula: pattern }, { nombre: pattern }, { apellido: pattern }, { correo: pattern }, { rol: pattern }];
  }

  const [items, total] = await Promise.all([
    User.find(query)
      .select('cedula nombre apellido correo rol estado createdAt updatedAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit),
    User.countDocuments(query)
  ]);

  return {
    items,
    pagination: buildPagination({ page: safePage, limit: safeLimit, total })
  };
};

export const updateUserRole = async ({ id, rol }, actorId = null) => {
  const user = await User.findById(id);

  if (!user) {
    throw new AppError('Usuario no encontrado', 404);
  }

  if (actorId && String(actorId) === String(user._id)) {
    throw new AppError('No puede modificar su propio rol', 400);
  }

  user.rol = rol;
  await user.save();

  return user;
};
