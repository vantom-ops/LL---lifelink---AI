import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('[Error Middleware]', err);

  const statusCode = err.statusCode || (err.name === 'ValidationError' ? 400 : 500);
  const message = err.message || 'An unexpected internal server error occurred.';

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}
