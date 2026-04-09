const FALLBACK_ERROR = "Something went wrong";

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

export const getApiErrorMessage = (
  payload: unknown,
  fallback = FALLBACK_ERROR,
): string => {
  if (typeof payload === "string" && payload.trim().length > 0) {
    return payload;
  }

  if (!isRecord(payload)) {
    return fallback;
  }

  const directMessage = payload.message;
  if (typeof directMessage === "string" && directMessage.trim().length > 0) {
    return directMessage;
  }

  const directPayload = payload.payload;
  if (typeof directPayload === "string" && directPayload.trim().length > 0) {
    return directPayload;
  }

  const errors = payload.errors;
  if (Array.isArray(errors) && errors.length > 0 && isRecord(errors[0])) {
    const firstMessage = errors[0].message;
    if (typeof firstMessage === "string" && firstMessage.trim().length > 0) {
      return firstMessage;
    }
  }

  return fallback;
};

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return getApiErrorMessage(error, FALLBACK_ERROR);
};
