import Appointment from '../models/Appointment.js';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
import Specialty from '../models/Specialty.js';
import { AppError } from '../errors/AppError.js';
import { buildPagination } from '../utils/pagination.js';
import { deleteTurnForAppointment, ensureTurnForAppointment } from './turn.service.js';

const buildQuery = ({ search, estado, fecha, paciente, medico, especialidad }) => {
  const query = {};

  if (estado) {
    query.estado = estado;
  }

  if (fecha) {
    const start = new Date(fecha);
    const end = new Date(fecha);
    end.setHours(23, 59, 59, 999);
    query.fecha = { $gte: start, $lte: end };
  }

  if (paciente) {
    query.paciente = paciente;
  }

  if (medico) {
    query.medico = medico;
  }

  if (especialidad) {
    query.especialidad = especialidad;
  }

  if (search) {
    query.$or = [];
  }

  return query;
};

const ensureRelationsExist = async ({ paciente, medico, especialidad }) => {
  const [patient, doctor, specialty] = await Promise.all([
    Patient.findById(paciente),
    Doctor.findById(medico),
    Specialty.findById(especialidad)
  ]);

  if (!patient) {
    throw new AppError('Paciente no encontrado', 404);
  }

  if (!doctor) {
    throw new AppError('Medico no encontrado', 404);
  }

  if (!specialty) {
    throw new AppError('Especialidad no encontrada', 404);
  }

  if (doctor.especialidad.toString() !== specialty._id.toString()) {
    throw new AppError('El medico no pertenece a la especialidad seleccionada', 400);
  }
};

const loadPopulatedAppointment = (id) =>
  Appointment.findById(id)
    .populate('paciente')
    .populate('medico')
    .populate('especialidad');

export const listAppointments = async (queryParams) => {
  const { page = 1, limit = 10, search = '', estado = '', fecha = '', paciente = '', medico = '', especialidad = '' } = queryParams;
  const query = buildQuery({ search, estado, fecha, paciente, medico, especialidad });
  const skip = (Math.max(Number(page) || 1, 1) - 1) * Math.max(Number(limit) || 10, 1);

  const pipelineSearch = search
    ? [
        { 'pacienteData.nombre': { $regex: search, $options: 'i' } },
        { 'pacienteData.apellido': { $regex: search, $options: 'i' } },
        { 'medicoData.nombre': { $regex: search, $options: 'i' } },
        { 'medicoData.apellido': { $regex: search, $options: 'i' } }
      ]
    : [];

  const aggregation = [
    { $match: query },
    { $sort: { createdAt: -1 } },
    {
      $lookup: {
        from: 'patients',
        localField: 'paciente',
        foreignField: '_id',
        as: 'pacienteData'
      }
    },
    { $unwind: '$pacienteData' },
    {
      $lookup: {
        from: 'doctors',
        localField: 'medico',
        foreignField: '_id',
        as: 'medicoData'
      }
    },
    { $unwind: '$medicoData' },
    {
      $lookup: {
        from: 'specialties',
        localField: 'especialidad',
        foreignField: '_id',
        as: 'especialidadData'
      }
    },
    { $unwind: '$especialidadData' }
  ];

  if (pipelineSearch.length > 0) {
    aggregation.push({
      $match: {
        $or: pipelineSearch
      }
    });
  }

  const [items, totalResult] = await Promise.all([
    Appointment.aggregate([...aggregation, { $skip: skip }, { $limit: Number(limit) || 10 }]),
    Appointment.aggregate([...aggregation, { $count: 'total' }])
  ]);

  const total = totalResult[0]?.total || 0;

  return {
    items,
    pagination: buildPagination({ page, limit, total })
  };
};

export const getAppointmentById = async (id) => {
  const appointment = await Appointment.findById(id)
    .populate('paciente')
    .populate('medico')
    .populate('especialidad');

  if (!appointment) {
    throw new AppError('Cita no encontrada', 404);
  }

  return appointment;
};

export const createAppointment = async (payload) => {
  await ensureRelationsExist(payload);
  const appointment = await Appointment.create(payload);

  if (appointment.estado === 'Confirmada') {
    await ensureTurnForAppointment(appointment);
  }

  return loadPopulatedAppointment(appointment._id);
};

export const updateAppointment = async (id, payload) => {
  const appointment = await Appointment.findById(id);

  if (!appointment) {
    throw new AppError('Cita no encontrada', 404);
  }

  const nextPayload = { ...appointment.toObject(), ...payload };
  await ensureRelationsExist(nextPayload);

  Object.assign(appointment, payload);
  await appointment.save();

  if (appointment.estado === 'Confirmada') {
    await ensureTurnForAppointment(appointment);
  }

  return loadPopulatedAppointment(appointment._id);
};

export const deleteAppointment = async (id) => {
  const appointment = await Appointment.findById(id);

  if (!appointment) {
    throw new AppError('Cita no encontrada', 404);
  }

  await deleteTurnForAppointment(appointment._id);
  await Appointment.deleteOne({ _id: appointment._id });

  return appointment;
};
