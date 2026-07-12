import Doctor from '../models/Doctor.js';
import Specialty from '../models/Specialty.js';
import { AppError } from '../errors/AppError.js';
import { buildPagination } from '../utils/pagination.js';

const buildQuery = ({ search, estado, especialidad }) => {
  const query = {};

  if (estado) {
    query.estado = estado;
  }

  if (especialidad) {
    query.especialidad = especialidad;
  }

  if (search) {
    query.$or = [
      { nombre: { $regex: search, $options: 'i' } },
      { apellido: { $regex: search, $options: 'i' } },
      { consultorio: { $regex: search, $options: 'i' } }
    ];
  }

  return query;
};

const ensureSpecialtyExists = async (specialtyId) => {
  const specialty = await Specialty.findById(specialtyId);
  if (!specialty) {
    throw new AppError('Especialidad no encontrada', 404);
  }
  return specialty;
};

export const listDoctors = async (queryParams) => {
  const { page = 1, limit = 10, search = '', estado = '', especialidad = '' } = queryParams;
  const query = buildQuery({ search, estado, especialidad });
  const skip = (Math.max(Number(page) || 1, 1) - 1) * Math.max(Number(limit) || 10, 1);

  const [items, total] = await Promise.all([
    Doctor.find(query).populate('especialidad').sort({ createdAt: -1 }).skip(skip).limit(Number(limit) || 10),
    Doctor.countDocuments(query)
  ]);

  return {
    items,
    pagination: buildPagination({ page, limit, total })
  };
};

export const getDoctorById = async (id) => {
  const doctor = await Doctor.findById(id).populate('especialidad');

  if (!doctor) {
    throw new AppError('Medico no encontrado', 404);
  }

  return doctor;
};

export const createDoctor = async (payload) => {
  await ensureSpecialtyExists(payload.especialidad);
  return Doctor.create(payload);
};

export const updateDoctor = async (id, payload) => {
  const doctor = await Doctor.findById(id);

  if (!doctor) {
    throw new AppError('Medico no encontrado', 404);
  }

  if (payload.especialidad) {
    await ensureSpecialtyExists(payload.especialidad);
  }

  Object.assign(doctor, payload);
  await doctor.save();
  return doctor.populate('especialidad');
};

export const deleteDoctor = async (id) => {
  const doctor = await Doctor.findByIdAndDelete(id);

  if (!doctor) {
    throw new AppError('Medico no encontrado', 404);
  }

  return doctor;
};

