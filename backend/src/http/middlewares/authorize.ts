import { RequestHandler } from 'express';
import { Perfil } from '../../modules/auth/domain/usuario-autenticable';
import { AppError } from '../../shared/errors/app-error';

export function authorize(...perfilesPermitidos: Perfil[]): RequestHandler {
  return (_req, res, next) => {
    const usuario = res.locals.usuario as { perfil: Perfil } | undefined;

    if (!usuario || !perfilesPermitidos.includes(usuario.perfil)) {
      throw new AppError(403, 'SIN_PERMISO', 'No tienes permiso para realizar esta acción');
    }

    next();
  };
}
