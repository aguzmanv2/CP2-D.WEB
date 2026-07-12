import { asyncHandler } from '../utils/asyncHandler.js';
import {
  createSpecialty,
  deleteSpecialty,
  getSpecialtyById,
  listSpecialties,
  updateSpecialty
} from '../services/specialty.service.js';

export const index = asyncHandler(async (req, res) => {
  const data = await listSpecialties(req.query);
  res.json({ success: true, data });
});

export const show = asyncHandler(async (req, res) => {
  const specialty = await getSpecialtyById(req.params.id);
  res.json({ success: true, data: specialty });
});

export const store = asyncHandler(async (req, res) => {
  const specialty = await createSpecialty(req.body);
  res.status(201).json({ success: true, message: 'Especialidad creada correctamente', data: specialty });
});

export const update = asyncHandler(async (req, res) => {
  const specialty = await updateSpecialty(req.params.id, req.body);
  res.json({ success: true, message: 'Especialidad actualizada correctamente', data: specialty });
});

export const destroy = asyncHandler(async (req, res) => {
  await deleteSpecialty(req.params.id);
  res.json({ success: true, message: 'Especialidad eliminada correctamente' });
});

