import { RequestHandler } from 'express';
import { authContainer } from '../../../container';
import { validarCambioPassword, validarLogin } from './auth.schemas';

export const login: RequestHandler = async (req, res) => {
  const entrada = validarLogin(req.body);
  const resultado = await authContainer.login.execute(entrada);
  res.json(resultado);
};

export const obtenerUsuarioActual: RequestHandler = (_req, res) => {
  res.json({ usuario: res.locals.usuario });
};

export const logout: RequestHandler = async (_req, res) => {
  await authContainer.logout.execute(res.locals.usuario.id);
  res.status(204).end();
};

export const cambiarPassword: RequestHandler = async (req, res) => {
  const entrada = validarCambioPassword(req.body);
  await authContainer.cambiarPassword.execute({
    idUsuario: res.locals.usuario.id,
    ...entrada,
  });
  res.status(204).end();
};
