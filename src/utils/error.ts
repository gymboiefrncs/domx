import type { CustomErrorContent } from "../common/types.js";

export abstract class AppError extends Error {
  abstract readonly statusCode: number;

  constructor(
    public readonly message: string,
    public readonly logging: boolean = false,
    public readonly context: Record<string, unknown> = {},
  ) {
    super(message);

    Object.setPrototypeOf(this, new.target.prototype);
  }

  get errors(): CustomErrorContent {
    return { message: this.message, context: this.context };
  }
}

export class ValidationError extends AppError {
  readonly statusCode = 422;
}

export class NotFoundError extends AppError {
  readonly statusCode = 404;
}

export class ConflictError extends AppError {
  readonly statusCode = 409;
}

export class UnauthorizedError extends AppError {
  readonly statusCode = 401;
}
