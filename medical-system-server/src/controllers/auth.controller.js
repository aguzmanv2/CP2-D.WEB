import { asyncHandler } from '../utils/asyncHandler.js';
import User from '../models/User.js';
import { registerUser, loginUser } from '../services/auth.service.js';

export const register = asyncHandler(async (req, res) => {
  const result = await registerUser(req.body);

  res.status(201).json({
    success: true,
    message: 'Usuario registrado correctamente',
    data: result
  });
});

export const login = asyncHandler(async (req, res) => {
  const result = await loginUser(req.body);

  res.status(200).json({
    success: true,
    message: 'Inicio de sesion exitoso',
    data: result
  });
});

export const logout = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Cierre de sesion exitoso'
  });
});

export const profile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');

  res.status(200).json({
    success: true,
    data: user
  });
});
