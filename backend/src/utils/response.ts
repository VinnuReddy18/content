export const success = <T>(data: T, message: string = "Success") => {
  return {
    success: true,
    message,
    data,
  };
};

export const paginated = <T>(data: T[], total: number, page: number, limit: number) => {
  return {
    success: true,
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};
