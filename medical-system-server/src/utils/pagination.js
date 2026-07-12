export const buildPagination = ({ page = 1, limit = 10, total = 0 }) => {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.max(Number(limit) || 10, 1);
  const totalPages = Math.max(Math.ceil(total / safeLimit), 1);

  return {
    page: safePage,
    limit: safeLimit,
    total,
    totalPages,
    hasPrevPage: safePage > 1,
    hasNextPage: safePage < totalPages
  };
};

