import { RequestHandler } from 'express';
import { setupContainer } from '../../../container';
import { validarAdministrador, validarEmpresa, validarSucursal } from './setup.schemas';

export const obtenerEstado: RequestHandler = async (_req, res) => {
  res.json(await setupContainer.obtenerEstado.execute());
};

export const registrarEmpresa: RequestHandler = async (req, res) => {
  await setupContainer.registrarEmpresa.execute(validarEmpresa(req.body));
  res.status(201).json(await setupContainer.obtenerEstado.execute());
};

export const registrarSucursal: RequestHandler = async (req, res) => {
  await setupContainer.registrarSucursal.execute(validarSucursal(req.body));
  res.status(201).json(await setupContainer.obtenerEstado.execute());
};

export const registrarAdministrador: RequestHandler = async (req, res) => {
  await setupContainer.registrarAdministrador.execute(validarAdministrador(req.body));
  res.status(201).json(await setupContainer.obtenerEstado.execute());
};
