import { asyncHandler } from '../utils/asyncHandler.js';
import { findUserByCedula, listUsers, updateUserRole } from '../services/user.service.js';

export const lookupByCedula = asyncHandler(async (req, res) => {
  const user = await findUserByCedula(req.query.cedula);

  res.json({
    success: true,
    data: user
  });
});

export const getUsers = asyncHandler(async (req, res) => {
  const data = await listUsers(req.query);

  res.json({
    success: true,
    data
  });
});

export const changeUserRole = asyncHandler(async (req, res) => {
  const user = await updateUserRole({ ...req.params, ...req.body }, req.user?._id);

  res.json({
    success: true,
    message: 'Rol actualizado correctamente',
    data: user
  });
});
