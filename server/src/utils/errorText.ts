import { AppError } from "./AppError";

export const getErrorText = (error: unknown) => {
  if (error instanceof AppError) return error.message;
  if (error instanceof Error) return error.message;
  return "Naməlum xəta";
};
