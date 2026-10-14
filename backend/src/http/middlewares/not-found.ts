import { RequestHandler } from 'express';

export const notFound: RequestHandler = (req, res) => {
  res.status(404).json({
    codigo: 'RUTA_NO_ENCONTRADA',
    mensaje: `No existe la ruta ${req.method} ${req.originalUrl}`,
  });
};
