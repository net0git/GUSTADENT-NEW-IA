import { RequestHandler } from 'express';
import { authContainer } from '../../container';
import { AppError } from '../../shared/errors/app-error';

const PREFIJO_BEARER = 'Bearer ';

export const authenticate: RequestHandler = async (req, res, next) => {
  const encabezado = req.headers.authorization;

  if (!encabezado || !encabezado.startsWith(PREFIJO_BEARER)) {
    throw new AppError(401, 'NO_AUTENTICADO', 'Debes iniciar sesión');
  }

  const token = encabezado.slice(PREFIJO_BEARER.length).trim();
  res.locals.usuario = await authContainer.verificarSesion.execute(token);
  next();
};
