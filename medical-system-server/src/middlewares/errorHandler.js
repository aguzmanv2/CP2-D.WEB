export const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';

  const payload = {
    success: false,
    message
  };

  if (error.details) {
    payload.details = error.details;
  }

  res.status(statusCode).json(payload);
};
