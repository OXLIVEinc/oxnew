/**
 * server/middleware/error.middleware.ts
 * -------------------------------------------------------------------------
 * `AppError` - throw this from services/controllers for expected error
 *              conditions (not found, validation, conflict, etc). It carries
 *              an HTTP status code so the handler below can respond
 *              correctly without every route having its own try/catch logic.
 *
 * `errorHandler` - the last middleware in the chain (registered in app.ts).
 *              Converts AppError / ZodError / anything else into a
 *              consistent JSON error shape.
 * -------------------------------------------------------------------------
 */
import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { isProduction } from "@/config/env";

export class AppError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 400, code = "BAD_REQUEST") {
    super(message);
    this.status = status;
    this.code = code;
  }

  static notFound(message = "Resource not found") {
    return new AppError(message, 404, "NOT_FOUND");
  }

  static forbidden(message = "You do not have permission to perform this action") {
    return new AppError(message, 403, "FORBIDDEN");
  }

  static conflict(message = "This request conflicts with existing data") {
    return new AppError(message, 409, "CONFLICT");
  }
}

/** Wraps an async route handler so thrown/rejected errors reach `errorHandler`. */
export function asyncHandler<T extends (req: Request, res: Response, next: NextFunction) => Promise<unknown>>(
  fn: T
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message, code: err.code });
  }

  if (err instanceof ZodError) {
    return res.status(422).json({
      error: "Validation failed",
      code: "VALIDATION_ERROR",
      issues: err.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
    });
  }

  console.error("[unhandled error]", err);
  return res.status(500).json({
    error: isProduction ? "Something went wrong" : (err as Error)?.message ?? "Unknown error",
    code: "INTERNAL_ERROR",
  });
}
