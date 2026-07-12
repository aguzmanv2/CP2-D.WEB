import { asyncHandler } from '../utils/asyncHandler.js';
import {
  createDoctor,
  deleteDoctor,
  getDoctorById,
  listDoctors,
  updateDoctor
} from '../services/doctor.service.js';

export const index = asyncHandler(async (req, res) => {
  const data = await listDoctors(req.query);
  res.json({ success: true, data });
});

export const show = asyncHandler(async (req, res) => {
  const doctor = await getDoctorById(req.params.id);
  res.json({ success: true, data: doctor });
});

export const store = asyncHandler(async (req, res) => {
  const doctor = await createDoctor(req.body);
  res.status(201).json({ success: true, message: 'Medico creado correctamente', data: doctor });
});

export const update = asyncHandler(async (req, res) => {
  const doctor = await updateDoctor(req.params.id, req.body);
  res.json({ success: true, message: 'Medico actualizado correctamente', data: doctor });
});

export const destroy = asyncHandler(async (req, res) => {
  await deleteDoctor(req.params.id);
  res.json({ success: true, message: 'Medico eliminado correctamente' });
});

