import Turn from '../models/Turn.js';
import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import Specialty from '../models/Specialty.js';
import { AppError } from '../errors/AppError.js';
import { buildPagination } from '../utils/pagination.js';
import { TURN_STATUS } from '../constants/turn-statuses.js';
import {
  emitDashboardUpdate,
  emitQueueUpdate,
  emitTurnRealtime
} from '../realtime/socket.js';

const dateKey = (date = new Date()) => new Date(date).toISOString().slice(0, 10);
const ACTIVE_APPOINTMENT_STATES = ['Confirmada', 'Atendida'];

const generateNumber = async ({ fecha }) => {
  const prefix = 'A-';
  const count = await Turn.countDocuments({
    fecha,
    numeroTurno: { $regex: `^${prefix}` }
  });

  const dateSegment = String(fecha).replaceAll('-', '');
  return `${prefix}${dateSegment}-${String(count + 1).padStart(3, '0')}`;
};

const loadTurnDetails = (query = {}, { activeCitaOnly = false } = {}) => {
  let builder = Turn.find(query).populate('paciente').populate('medico').populate('especialidad');

  builder = activeCitaOnly
    ? builder.populate({
        path: 'cita',
        match: { estado: { $in: ACTIVE_APPOINTMENT_STATES } }
      })
    : builder.populate('cita');

  return builder.sort({ createdAt: 1 });
};

const pruneInvalidActiveTurns = async (turns = []) => {
  const invalidTurns = turns.filter((turn) => !turn?.cita);

  if (invalidTurns.length > 0) {
    await Turn.deleteMany({ _id: { $in: invalidTurns.map((turn) => turn._id) } });
  }

  return turns.filter((turn) => Boolean(turn?.cita));
};

const loadValidActiveTurns = async (query = {}) => pruneInvalidActiveTurns(await loadTurnDetails(query, { activeCitaOnly: true }));

const loadValidActiveTurn = async (query = {}) => {
  const turn = await Turn.findOne(query)
    .populate('paciente')
    .populate('medico')
    .populate('especialidad')
    .populate({
      path: 'cita',
      match: { estado: { $in: ACTIVE_APPOINTMENT_STATES } }
    })
    .sort({ createdAt: 1 });

  if (!turn?.cita) {
    if (turn?._id) {
      await Turn.deleteOne({ _id: turn._id });
    }

    return null;
  }

  return turn;
};

const recalculateQueue = async (medicoId, fecha) => {
  const queue = await loadValidActiveTurns({
    medico: medicoId,
    fecha,
    estado: { $in: [TURN_STATUS.WAITING, TURN_STATUS.IN_ATTENTION] }
  });

  const doctor = await Doctor.findById(medicoId);
  const averageTime = Math.max(Number(doctor?.tiempoPromedioConsulta || 0), 0);
  const waitingTurns = queue.filter((turn) => turn.estado === TURN_STATUS.WAITING);
  const activeTurn = queue.find((turn) => turn.estado === TURN_STATUS.IN_ATTENTION) || null;

  for (const [index, turn] of waitingTurns.entries()) {
    const estimatedMinutes = averageTime * index;
    turn.personasDelante = index;
    turn.tiempoEstimado = estimatedMinutes;
    await turn.save();
  }

  if (activeTurn) {
    activeTurn.personasDelante = 0;
    activeTurn.tiempoEstimado = 0;
    await activeTurn.save();
  }

  return loadValidActiveTurns({
    medico: medicoId,
    fecha,
    estado: { $in: [TURN_STATUS.WAITING, TURN_STATUS.IN_ATTENTION] }
  });
};

const serializeDocument = (document) => {
  if (!document) return null;

  if (typeof document.toJSON === 'function') {
    return document.toJSON();
  }

  if (typeof document.toObject === 'function') {
    return document.toObject({ virtuals: true });
  }

  return document;
};

const emitTurnChanges = async ({ eventName, turn, queue = [], nextTurn = null, extra = {} }) => {
  const payload = {
    event: eventName,
    turn: serializeDocument(turn),
    nextTurn: serializeDocument(nextTurn),
    queue: queue.map(serializeDocument),
    ...extra
  };

  emitTurnRealtime(eventName, turn, payload);
  emitQueueUpdate(payload, turn);
  emitDashboardUpdate(payload);
};

export const ensureTurnForAppointment = async (appointment) => {
  if (!appointment?._id || appointment.estado !== 'Confirmada') {
    return null;
  }

  const today = dateKey(appointment.fecha);
  const existingTurn = await Turn.findOne({ cita: appointment._id })
    .populate('paciente')
    .populate('medico')
    .populate('especialidad')
    .populate('cita');

  if (existingTurn) {
    return existingTurn;
  }

  const medico = await Doctor.findById(appointment.medico);
  const patient = await Patient.findById(appointment.paciente);
  const specialty = await Specialty.findById(appointment.especialidad);

  if (!medico) {
    throw new AppError('El medico no existe', 404);
  }

  if (!patient) {
    throw new AppError('El paciente no existe', 404);
  }

  if (!specialty) {
    throw new AppError('La especialidad no existe', 404);
  }

  if (String(medico.especialidad) !== String(specialty._id)) {
    throw new AppError('El medico no pertenece a la especialidad seleccionada', 400);
  }

  const turno = await Turn.create({
    numeroTurno: await generateNumber({ fecha: today }),
    paciente: patient._id,
    medico: medico._id,
    especialidad: specialty._id,
    cita: appointment._id,
    estado: TURN_STATUS.WAITING,
    fecha: today
  });

  const queue = await recalculateQueue(medico._id, today);
  const createdTurn = await Turn.findById(turno._id).populate('paciente').populate('medico').populate('especialidad').populate('cita');

  await emitTurnChanges({
    eventName: 'queueUpdated',
    turn: createdTurn,
    queue,
    extra: {
      citaId: String(appointment._id),
      medicoId: String(medico._id),
      pacienteId: String(patient._id),
      especialidadId: String(specialty._id)
    }
  });

  return createdTurn;
};

export const deleteTurnForAppointment = async (appointmentId) => {
  const turn = await Turn.findOne({ cita: appointmentId })
    .populate('paciente')
    .populate('medico')
    .populate('especialidad')
    .populate('cita');

  if (!turn) {
    return null;
  }

  await Turn.deleteOne({ _id: turn._id });

  const queue = await recalculateQueue(turn.medico._id, turn.fecha);

  await emitTurnChanges({
    eventName: 'turnDeleted',
    turn,
    queue,
    extra: {
      citaId: String(appointmentId),
      medicoId: String(turn.medico._id),
      pacienteId: String(turn.paciente._id),
      especialidadId: String(turn.especialidad._id),
      deleted: true
    }
  });

  return turn;
};

export const resolveDoctorFromUser = async (user) => {
  if (!user?.nombre || !user?.apellido) {
    return null;
  }

  return Doctor.findOne({
    nombre: new RegExp(`^${user.nombre}$`, 'i'),
    apellido: new RegExp(`^${user.apellido}$`, 'i')
  });
};

export const resolvePatientFromUser = async (user) => {
  if (!user?.cedula && !user?.correo) {
    return null;
  }

  const query = user?.cedula
    ? { cedula: new RegExp(`^${user.cedula}$`, 'i') }
    : { correo: new RegExp(`^${user.correo}$`, 'i') };

  return Patient.findOne(query);
};

export const registerArrival = async ({ cita: citaId }) => {
  const appointment = await Appointment.findById(citaId).populate('paciente').populate('medico').populate('especialidad');

  if (!appointment) {
    throw new AppError('La cita no existe', 404);
  }

  if (appointment.estado === 'Cancelada') {
    throw new AppError('No se puede registrar una llegada para una cita cancelada', 400);
  }

  const today = dateKey();
  const appointmentDate = dateKey(appointment.fecha);

  if (appointmentDate !== today) {
    throw new AppError('Solo se pueden registrar llegadas para citas del dia', 400);
  }

  const medico = await Doctor.findById(appointment.medico._id);
  if (!medico) {
    throw new AppError('El medico no existe', 404);
  }

  const existingTurn = await Turn.findOne({ cita: appointment._id })
    .populate('paciente')
    .populate('medico')
    .populate('especialidad')
    .populate('cita');

  let turno = existingTurn;

  if (!turno) {
    turno = await Turn.create({
      numeroTurno: await generateNumber({ fecha: today }),
      paciente: appointment.paciente._id,
      medico: appointment.medico._id,
      especialidad: appointment.especialidad._id,
      cita: appointment._id,
      estado: TURN_STATUS.WAITING,
      horaLlegada: new Date(),
      fecha: today
    });
  } else if (!turno.horaLlegada) {
    turno.horaLlegada = new Date();
    turno.fecha = today;
    turno.estado = TURN_STATUS.WAITING;
    await turno.save();
  } else {
    throw new AppError('Ya existe un turno para esta cita', 409);
  }

  appointment.estado = 'Confirmada';
  await appointment.save();

  const queue = await recalculateQueue(medico._id, today);
  const updatedTurn = await Turn.findById(turno._id).populate('paciente').populate('medico').populate('especialidad').populate('cita');

  await emitTurnChanges({
    eventName: 'patientCheckedIn',
    turn: updatedTurn,
    queue,
    extra: {
      cita: serializeDocument(appointment),
      medicoId: String(medico._id),
      pacienteId: String(appointment.paciente._id),
      especialidadId: String(appointment.especialidad._id)
    }
  });

  return updatedTurn;
};

export const getQueue = async ({ medico, fecha = dateKey() }, user) => {
  const resolvedDoctor = medico ? await Doctor.findById(medico) : await resolveDoctorFromUser(user);

  if (!resolvedDoctor) {
    throw new AppError('Debe indicar el medico', 400);
  }

  const turns = await loadValidActiveTurns({
    medico: resolvedDoctor._id,
    fecha: dateKey(fecha),
    estado: { $in: [TURN_STATUS.WAITING, TURN_STATUS.IN_ATTENTION] }
  });

  return turns;
};

export const getCurrentTurn = async ({ medico, fecha = dateKey() }, user) => {
  const resolvedDoctor = medico ? await Doctor.findById(medico) : await resolveDoctorFromUser(user);

  if (!resolvedDoctor) {
    return null;
  }

  return loadValidActiveTurn({
    medico: resolvedDoctor._id,
    fecha: dateKey(fecha),
    estado: TURN_STATUS.IN_ATTENTION
  });
};

export const getNextTurn = async ({ medico, fecha = dateKey() }, user) => {
  const resolvedDoctor = medico ? await Doctor.findById(medico) : await resolveDoctorFromUser(user);

  if (!resolvedDoctor) {
    return null;
  }

  return loadValidActiveTurn({
    medico: resolvedDoctor._id,
    fecha: dateKey(fecha),
    estado: TURN_STATUS.WAITING
  });
};

export const getPatientTurn = async ({ paciente, fecha = dateKey() }, user) => {
  const resolvedPatient = paciente ? await Patient.findById(paciente) : await resolvePatientFromUser(user);

  if (!resolvedPatient) {
    return null;
  }

  const turn = await Turn.findOne({
    paciente: resolvedPatient._id,
    fecha: dateKey(fecha),
    estado: { $in: [TURN_STATUS.WAITING, TURN_STATUS.IN_ATTENTION] }
  })
    .sort({ createdAt: -1 })
    .populate('paciente')
    .populate('medico')
    .populate('especialidad')
    .populate({
      path: 'cita',
      match: { estado: { $in: ACTIVE_APPOINTMENT_STATES } }
    });

  if (!turn?.cita) {
    if (turn?._id) {
      await Turn.deleteOne({ _id: turn._id });
    }

    return null;
  }

  return turn;
};

export const startAttention = async ({ turnoId }, user) => {
  const turn = await Turn.findById(turnoId).populate('medico').populate('paciente').populate('especialidad').populate('cita');

  if (!turn) {
    throw new AppError('Turno no encontrado', 404);
  }

  if (turn.estado !== TURN_STATUS.WAITING) {
    throw new AppError('Solo los turnos en espera pueden ser atendidos', 400);
  }

  const activeTurn = await Turn.findOne({
    medico: turn.medico._id,
    fecha: turn.fecha,
    estado: TURN_STATUS.IN_ATTENTION
  });

  if (activeTurn) {
    throw new AppError('Ya existe un paciente en atencion para este medico', 409);
  }

  turn.estado = TURN_STATUS.IN_ATTENTION;
  turn.horaInicio = new Date();
  await turn.save();

  const queue = await recalculateQueue(turn.medico._id, turn.fecha);
  const updatedTurn = await Turn.findById(turn._id).populate('paciente').populate('medico').populate('especialidad').populate('cita');

  await emitTurnChanges({
    eventName: 'appointmentStarted',
    turn: updatedTurn,
    queue,
    extra: {
      medicoId: String(turn.medico._id),
      pacienteId: String(turn.paciente._id),
      especialidadId: String(turn.especialidad._id)
    }
  });

  return updatedTurn;
};

export const finishAttention = async ({ turnoId }) => {
  const turn = await Turn.findById(turnoId).populate('medico').populate('paciente').populate('especialidad').populate('cita');

  if (!turn) {
    throw new AppError('Turno no encontrado', 404);
  }

  if (turn.estado !== TURN_STATUS.IN_ATTENTION) {
    throw new AppError('Solo los turnos en atencion pueden finalizarse', 400);
  }

  turn.estado = TURN_STATUS.FINISHED;
  turn.horaFin = new Date();
  turn.tiempoTotalEspera = turn.horaLlegada && turn.horaInicio ? Math.max((new Date(turn.horaInicio) - new Date(turn.horaLlegada)) / 60000, 0) : 0;
  turn.tiempoTotalConsulta = turn.horaInicio && turn.horaFin ? Math.max((new Date(turn.horaFin) - new Date(turn.horaInicio)) / 60000, 0) : 0;
  await turn.save();

  if (turn.cita) {
    turn.cita.estado = 'Atendida';
    await turn.cita.save();
  }

  const nextTurn = await Turn.findOne({
    medico: turn.medico._id,
    fecha: turn.fecha,
    estado: TURN_STATUS.WAITING
  }).sort({ createdAt: 1 });

  if (nextTurn) {
    nextTurn.estado = TURN_STATUS.IN_ATTENTION;
    nextTurn.horaInicio = new Date();
    await nextTurn.save();
  }

  const queue = await recalculateQueue(turn.medico._id, turn.fecha);
  const finishedTurn = await Turn.findById(turn._id).populate('paciente').populate('medico').populate('especialidad').populate('cita');
  const updatedNextTurn = nextTurn
    ? await Turn.findById(nextTurn._id).populate('paciente').populate('medico').populate('especialidad').populate('cita')
    : null;

  await emitTurnChanges({
    eventName: 'appointmentFinished',
    turn: finishedTurn,
    nextTurn: updatedNextTurn,
    queue,
    extra: {
      medicoId: String(turn.medico._id),
      pacienteId: String(turn.paciente._id),
      especialidadId: String(turn.especialidad._id)
    }
  });

  return {
    finishedTurn,
    nextTurn: updatedNextTurn
  };
};

export const getHistory = async (queryParams) => {
  const { medico, paciente, estado, fecha, page = 1, limit = 10 } = queryParams;
  const query = {};

  if (medico) query.medico = medico;
  if (paciente) query.paciente = paciente;
  if (estado) query.estado = estado;
  if (fecha) query.fecha = dateKey(fecha);

  const skip = (Math.max(Number(page) || 1, 1) - 1) * Math.max(Number(limit) || 10, 1);

  const [items, total] = await Promise.all([
    loadTurnDetails(query).skip(skip).limit(Number(limit) || 10),
    Turn.countDocuments(query)
  ]);

  return {
    items,
    pagination: buildPagination({ page, limit, total })
  };
};
