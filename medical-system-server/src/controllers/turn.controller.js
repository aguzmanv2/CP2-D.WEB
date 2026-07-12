import { asyncHandler } from '../utils/asyncHandler.js';
import {
  finishAttention,
  getCurrentTurn,
  getHistory,
  getNextTurn,
  getPatientTurn,
  getQueue,
  registerArrival,
  startAttention
} from '../services/turn.service.js';

export const registerArrivalController = asyncHandler(async (req, res) => {
  const turn = await registerArrival(req.body);
  res.status(201).json({ success: true, message: 'Llegada registrada correctamente', data: turn });
});

export const queueController = asyncHandler(async (req, res) => {
  const queue = await getQueue(req.query, req.user);
  res.json({ success: true, data: queue });
});

export const currentTurnController = asyncHandler(async (req, res) => {
  const turn = await getCurrentTurn(req.query, req.user);
  res.json({ success: true, data: turn });
});

export const nextTurnController = asyncHandler(async (req, res) => {
  const turn = await getNextTurn(req.query, req.user);
  res.json({ success: true, data: turn });
});

export const patientTurnController = asyncHandler(async (req, res) => {
  const turn = await getPatientTurn(req.query, req.user);
  res.json({ success: true, data: turn });
});

export const startAttentionController = asyncHandler(async (req, res) => {
  const turn = await startAttention(req.body, req.user);
  res.json({ success: true, message: 'Atencion iniciada correctamente', data: turn });
});

export const finishAttentionController = asyncHandler(async (req, res) => {
  const result = await finishAttention(req.body);
  res.json({ success: true, message: 'Atencion finalizada correctamente', data: result });
});

export const historyController = asyncHandler(async (req, res) => {
  const data = await getHistory(req.query);
  res.json({ success: true, data });
});
