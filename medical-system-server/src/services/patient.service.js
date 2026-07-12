import Patient from '../models/Patient.js';
import { AppError } from '../errors/AppError.js';
import { buildPagination } from '../utils/pagination.js';

const buildQuery = ({ search, estado }) => {
  const query = {};

  if (estado) {
    query.estado = estado;
  }

  if (search) {
    query.$or = [
      { cedula: { $regex: search, $options: 'i' } },
      { nombre: { $regex: search, $options: 'i' } },
      { apellido: { $regex: search, $options: 'i' } },
      { correo: { $regex: search, $options: 'i' } },
      { telefono: { $regex: search, $options: 'i' } }
    ];
  }

  return query;
};

export const listPatients = async (queryParams) => {
  const { page = 1, limit = 10, search = '', estado = '' } = queryParams;
  const query = buildQuery({ search, estado });
  const skip = (Math.max(Number(page) || 1, 1) - 1) * Math.max(Number(limit) || 10, 1);

  const [items, total] = await Promise.all([
    Patient.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit) || 10),
    Patient.countDocuments(query)
  ]);

  return {
    items,
    pagination: buildPagination({ page, limit, total })
  };
};

export const getPatientById = async (id) => {
  const patient = await Patient.findById(id);

  if (!patient) {
    throw new AppError('Paciente no encontrado', 404);
  }

  return patient;
};

export const createPatient = async (payload) => {
  const exists = await Patient.findOne({ cedula: payload.cedula });
  if (exists) {
    throw new AppError('Ya existe un paciente con esa cedula', 409);
  }

  const emailExists = await Patient.findOne({ correo: payload.correo });
  if (emailExists) {
    throw new AppError('Ya existe un paciente con ese correo', 409);
  }

  return Patient.create(payload);
};

export const updatePatient = async (id, payload) => {
  const patient = await Patient.findById(id);

  if (!patient) {
    throw new AppError('Paciente no encontrado', 404);
  }

  if (payload.cedula && payload.cedula !== patient.cedula) {
    const duplicate = await Patient.findOne({ cedula: payload.cedula });
    if (duplicate) {
      throw new AppError('Ya existe un paciente con esa cedula', 409);
    }
  }

  if (payload.correo && payload.correo !== patient.correo) {
    const duplicateEmail = await Patient.findOne({ correo: payload.correo });
    if (duplicateEmail) {
      throw new AppError('Ya existe un paciente con ese correo', 409);
    }
  }

  Object.assign(patient, payload);
  await patient.save();
  return patient;
};

export const deletePatient = async (id) => {
  const patient = await Patient.findByIdAndDelete(id);

  if (!patient) {
    throw new AppError('Paciente no encontrado', 404);
  }

  return patient;
};
