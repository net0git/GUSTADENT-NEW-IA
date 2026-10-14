import { ErrorRequestHandler } from 'express';
import { AppError } from '../../shared/errors/app-error';

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      codigo: error.codigo,
      mensaje: error.message,
    });
    return;
  }

  console.error(`[${req.method} ${req.originalUrl}]`, error);
  res.status(500).json({
    codigo: 'ERROR_INTERNO',
    mensaje: 'Ocurrió un error inesperado',
  });
};
