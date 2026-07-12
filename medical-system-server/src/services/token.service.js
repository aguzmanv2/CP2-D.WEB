import jwt from 'jsonwebtoken';

export const generateToken = (user) => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || '1d';

  return jwt.sign(
    {
      userId: user._id.toString(),
      role: user.rol,
      cedula: user.cedula,
      correo: user.correo
    },
    secret,
    { expiresIn }
  );
};
