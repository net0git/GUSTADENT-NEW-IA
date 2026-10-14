import { RequestHandler } from 'express';
import { reportesContainer } from '../../../container';
import {
  validarFiltrosReporte,
  validarSucursalReporte,
} from './reportes.schemas';

export const resumenAtenciones: RequestHandler = async (req, res) => {
  res.json(await reportesContainer.resumenAtenciones.execute(validarFiltrosReporte(consulta(req))));
};

export const ingresosPorSesion: RequestHandler = async (req, res) => {
  res.json(await reportesContainer.ingresosPorSesion.execute(validarFiltrosReporte(consulta(req))));
};

export const productividad: RequestHandler = async (req, res) => {
  res.json(await reportesContainer.productividad.execute(validarFiltrosReporte(consulta(req))));
};

export const cuentasPorCobrar: RequestHandler = async (req, res) => {
  res.json(await reportesContainer.cuentasPorCobrar.execute(validarSucursalReporte(consulta(req))));
};

export const atencionesPorMes: RequestHandler = async (req, res) => {
  res.json(await reportesContainer.atencionesPorMes.execute(validarFiltrosReporte(consulta(req))));
};

function consulta(req: Parameters<RequestHandler>[0]): Record<string, unknown> {
  return req.query as Record<string, unknown>;
}