export const getErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : "Something went wrong";
};
