import { timingSafeEqual } from 'crypto';
import { RequestHandler } from 'express';
import { env } from '../../../config/env';
import { AppError } from '../../../shared/errors/app-error';

const ENCABEZADO_TOKEN = 'X-Setup-Token';

export const verificarSetupToken: RequestHandler = (req, _res, next) => {
  const recibido = Buffer.from(req.header(ENCABEZADO_TOKEN) ?? '');
  const esperado = Buffer.from(env.setupToken);

  const coincide = recibido.length === esperado.length && timingSafeEqual(recibido, esperado);
  if (!coincide) {
    throw new AppError(401, 'SETUP_TOKEN_INVALIDO', 'El token de configuración no es válido');
  }

  next();
};
