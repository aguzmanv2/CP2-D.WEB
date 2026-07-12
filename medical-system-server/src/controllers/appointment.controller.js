import { asyncHandler } from '../utils/asyncHandler.js';
import {
  createAppointment,
  deleteAppointment,
  getAppointmentById,
  listAppointments,
  updateAppointment
} from '../services/appointment.service.js';

export const index = asyncHandler(async (req, res) => {
  const data = await listAppointments(req.query);
  res.json({ success: true, data });
});

export const show = asyncHandler(async (req, res) => {
  const appointment = await getAppointmentById(req.params.id);
  res.json({ success: true, data: appointment });
});

export const store = asyncHandler(async (req, res) => {
  const appointment = await createAppointment(req.body);
  res.status(201).json({ success: true, message: 'Cita creada correctamente', data: appointment });
});

export const update = asyncHandler(async (req, res) => {
  const appointment = await updateAppointment(req.params.id, req.body);
  res.json({ success: true, message: 'Cita actualizada correctamente', data: appointment });
});

export const destroy = asyncHandler(async (req, res) => {
  await deleteAppointment(req.params.id);
  res.json({ success: true, message: 'Cita eliminada correctamente' });
});

