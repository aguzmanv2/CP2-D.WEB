import User from '../models/User.js';
import { AppError } from '../errors/AppError.js';
import { generateToken } from './token.service.js';

const sanitizeUser = (user) => user.toJSON();

export const registerUser = async (payload) => {
  const normalizedEmail = String(payload.correo || '').trim().toLowerCase();
  const normalizedCedula = String(payload.cedula || '').trim();

  payload.correo = normalizedEmail;
  payload.cedula = normalizedCedula;
  payload.email = normalizedEmail;

  const cedulaExists = await User.findOne({ cedula: payload.cedula });
  if (cedulaExists) {
    throw new AppError('Cedula ya registrada', 409);
  }

  const existingUser = await User.findOne({ correo: payload.correo });

  if (existingUser) {
    throw new AppError('Correo ya registrado', 409);
  }

  const user = await User.create(payload);
  const token = generateToken(user);

  return {
    token,
    user: sanitizeUser(user)
  };
};

export const loginUser = async ({ identificador, password }) => {
  const normalizedIdentifier = String(identificador || '').trim().toLowerCase();
  const isEmail = normalizedIdentifier.includes('@');
  const query = isEmail
    ? { $or: [{ correo: normalizedIdentifier }, { email: normalizedIdentifier }] }
    : { cedula: normalizedIdentifier };

  const user = await User.findOne(query).select('+password');

  if (!user || !user.estado) {
    throw new AppError('Credenciales invalidas', 401);
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw new AppError('Credenciales invalidas', 401);
  }

  const token = generateToken(user);

  return {
    token,
    user: sanitizeUser(user)
  };
};
