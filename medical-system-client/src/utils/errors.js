export const getApiErrorMessage = (error, fallback = 'Ocurrio un error inesperado') => {
  const detailErrors = error?.response?.data?.details?.errors;
  if (Array.isArray(detailErrors) && detailErrors.length > 0) {
    return detailErrors[0].msg || fallback;
  }

  return error?.response?.data?.message || error?.message || fallback;
};

