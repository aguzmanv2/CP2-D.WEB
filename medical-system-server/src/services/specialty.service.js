import Specialty from '../models/Specialty.js';
import { AppError } from '../errors/AppError.js';
import { buildPagination } from '../utils/pagination.js';

const buildQuery = ({ search, estado }) => {
  const query = {};

  if (estado) {
    query.estado = estado;
  }

  if (search) {
    query.$or = [
      { nombre: { $regex: search, $options: 'i' } },
      { descripcion: { $regex: search, $options: 'i' } }
    ];
  }

  return query;
};

export const listSpecialties = async (queryParams) => {
  const { page = 1, limit = 10, search = '', estado = '' } = queryParams;
  const query = buildQuery({ search, estado });
  const skip = (Math.max(Number(page) || 1, 1) - 1) * Math.max(Number(limit) || 10, 1);

  const [items, total] = await Promise.all([
    Specialty.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit) || 10),
    Specialty.countDocuments(query)
  ]);

  return {
    items,
    pagination: buildPagination({ page, limit, total })
  };
};

export const getSpecialtyById = async (id) => {
  const specialty = await Specialty.findById(id);

  if (!specialty) {
    throw new AppError('Especialidad no encontrada', 404);
  }

  return specialty;
};

export const createSpecialty = async (payload) => {
  const exists = await Specialty.findOne({ nombre: payload.nombre });
  if (exists) {
    throw new AppError('Ya existe una especialidad con ese nombre', 409);
  }

  return Specialty.create(payload);
};

export const updateSpecialty = async (id, payload) => {
  const specialty = await Specialty.findById(id);

  if (!specialty) {
    throw new AppError('Especialidad no encontrada', 404);
  }

  if (payload.nombre && payload.nombre !== specialty.nombre) {
    const duplicate = await Specialty.findOne({ nombre: payload.nombre });
    if (duplicate) {
      throw new AppError('Ya existe una especialidad con ese nombre', 409);
    }
  }

  Object.assign(specialty, payload);
  await specialty.save();
  return specialty;
};

export const deleteSpecialty = async (id) => {
  const specialty = await Specialty.findByIdAndDelete(id);

  if (!specialty) {
    throw new AppError('Especialidad no encontrada', 404);
  }

  return specialty;
};

