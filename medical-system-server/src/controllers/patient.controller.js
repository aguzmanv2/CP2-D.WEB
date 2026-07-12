import { asyncHandler } from '../utils/asyncHandler.js';
import {
  createPatient,
  deletePatient,
  getPatientById,
  listPatients,
  updatePatient
} from '../services/patient.service.js';

export const index = asyncHandler(async (req, res) => {
  const data = await listPatients(req.query);
  res.json({ success: true, data });
});

export const show = asyncHandler(async (req, res) => {
  const patient = await getPatientById(req.params.id);
  res.json({ success: true, data: patient });
});

export const store = asyncHandler(async (req, res) => {
  const patient = await createPatient(req.body);
  res.status(201).json({ success: true, message: 'Paciente creado correctamente', data: patient });
});

export const update = asyncHandler(async (req, res) => {
  const patient = await updatePatient(req.params.id, req.body);
  res.json({ success: true, message: 'Paciente actualizado correctamente', data: patient });
});

export const destroy = asyncHandler(async (req, res) => {
  await deletePatient(req.params.id);
  res.json({ success: true, message: 'Paciente eliminado correctamente' });
});

