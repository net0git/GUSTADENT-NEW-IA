import { RequestHandler } from 'express';
import { pacientesContainer } from '../../../container';
import { AppError } from '../../../shared/errors/app-error';
import { validarDatosPaciente } from './pacientes.schemas';

function idDeRuta(parametro: unknown): number {
  const numero = Number(parametro);
  if (!Number.isInteger(numero) || numero <= 0) {
    throw new AppError(400, 'VALIDACION', 'El identificador no es válido');
  }
  return numero;
}

export const listarPacientes: RequestHandler = async (req, res) => {
  const termino = req.query.buscar;
  res.json(
    await pacientesContainer.listar.execute(typeof termino === 'string' ? termino : null)
  );
};

export const obtenerPaciente: RequestHandler = async (req, res) => {
  res.json(await pacientesContainer.obtener.execute(idDeRuta(req.params.id)));
};

export const crearPaciente: RequestHandler = async (req, res) => {
  res.status(201).json(await pacientesContainer.crear.execute(validarDatosPaciente(req.body)));
};

export const actualizarPaciente: RequestHandler = async (req, res) => {
  res.json(
    await pacientesContainer.actualizar.execute(idDeRuta(req.params.id), validarDatosPaciente(req.body))
  );
};