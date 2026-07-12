import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';

const ROOMS = Object.freeze({
  ADMIN: 'admin',
  RECEPTION: 'reception'
});

let io = null;

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeId = (value) => {
  if (!value) return '';
  if (typeof value === 'object') return String(value._id || value.id || '');
  return String(value);
};

const resolveDoctorRoom = async (user) => {
  if (!user?.nombre || !user?.apellido) {
    return null;
  }

  return Doctor.findOne({
    nombre: new RegExp(`^${escapeRegex(user.nombre)}$`, 'i'),
    apellido: new RegExp(`^${escapeRegex(user.apellido)}$`, 'i')
  }).select('_id');
};

const resolvePatientRoom = async (user) => {
  if (!user?.cedula && !user?.correo) {
    return null;
  }

  const query = user?.cedula
    ? { cedula: new RegExp(`^${escapeRegex(user.cedula)}$`, 'i') }
    : { correo: new RegExp(`^${escapeRegex(user.correo)}$`, 'i') };

  return Patient.findOne(query).select('_id');
};

const getAuthToken = (socket) => {
  const authToken = socket.handshake.auth?.token;
  if (authToken) return authToken;

  const authorization = socket.handshake.headers?.authorization;
  if (authorization && authorization.startsWith('Bearer ')) {
    return authorization.slice(7).trim();
  }

  return null;
};

const getSocketOrigin = () =>
  process.env.CLIENT_URL
    ? {
        origin: process.env.CLIENT_URL,
        credentials: true
      }
    : {};

export const initializeRealtime = (server) => {
  io = new Server(server, {
    cors: getSocketOrigin(),
    pingInterval: 25000,
    pingTimeout: 20000
  });

  io.use(async (socket, next) => {
    const token = getAuthToken(socket);

    if (!token) {
      return next(new Error('No autorizado'));
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.userId).select('-password');

      if (!user || !user.estado) {
        return next(new Error('No autorizado'));
      }

      socket.user = user;
      socket.tokenPayload = payload;
      next();
    } catch (error) {
      next(new Error(error.name === 'TokenExpiredError' ? 'Token expirado' : 'No autorizado'));
    }
  });

  io.on('connection', async (socket) => {
    const user = socket.user;
    const rooms = [];

    if (user?.rol === 'Administrador') {
      rooms.push(ROOMS.ADMIN);
    }

    if (user?.rol === 'Recepcionista') {
      rooms.push(ROOMS.RECEPTION);
    }

    if (user?.rol === 'Medico') {
      const doctor = await resolveDoctorRoom(user);
      if (doctor?._id) {
        rooms.push(`doctor_${normalizeId(doctor._id)}`);
      }
    }

    if (user?.rol === 'Paciente') {
      const patient = await resolvePatientRoom(user);
      if (patient?._id) {
        rooms.push(`patient_${normalizeId(patient._id)}`);
      }
    }

    const uniqueRooms = [...new Set(rooms.filter(Boolean))];
    uniqueRooms.forEach((room) => socket.join(room));

    socket.emit('connected', {
      message: 'Socket conectado correctamente',
      rooms: uniqueRooms,
      user: {
        id: normalizeId(user?._id),
        rol: user?.rol
      }
    });

    socket.on('client:heartbeat', (payload = {}) => {
      socket.emit('server:heartbeat', {
        ts: new Date().toISOString(),
        echo: payload.ts || null
      });
    });
  });

  return io;
};

export const getRealtime = () => io;

export const emitToRooms = (eventName, rooms = [], payload = {}) => {
  if (!io) return;

  const uniqueRooms = [...new Set(rooms.filter(Boolean))];
  if (uniqueRooms.length === 0) return;

  uniqueRooms.forEach((room) => {
    io.to(room).emit(eventName, payload);
  });
};

export const getTurnRooms = (turn) => {
  const doctorId = normalizeId(turn?.medico?._id || turn?.medico);
  const patientId = normalizeId(turn?.paciente?._id || turn?.paciente);

  return [
    ROOMS.ADMIN,
    ROOMS.RECEPTION,
    doctorId ? `doctor_${doctorId}` : null,
    patientId ? `patient_${patientId}` : null
  ].filter(Boolean);
};

export const emitTurnRealtime = (eventName, turn, payload = {}) => {
  emitToRooms(eventName, getTurnRooms(turn), payload);
};

export const emitDashboardUpdate = (payload = {}, rooms = [ROOMS.ADMIN, ROOMS.RECEPTION]) => {
  emitToRooms('dashboardUpdated', rooms, payload);
};

export const emitQueueUpdate = (payload = {}, turn) => {
  emitToRooms('queueUpdated', getTurnRooms(turn), payload);
};

export const SOCKET_ROOMS = ROOMS;
