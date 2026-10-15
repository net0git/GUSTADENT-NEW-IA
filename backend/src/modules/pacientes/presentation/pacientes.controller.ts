import { RequestHandler } from 'express';
import { pacientesContainer } from '../../../container';
import { AppError } from '../../../shared/errors/app-error';
import { validarDatosPaciente, validarDescripcionCondicion } from './pacientes.schemas';

function idDeRuta(parametro: unknown): number {
  const numero = Number(parametro);
  if (!Number.isInteger(numero) || numero <= 0) {
    throw new AppError(400, 'VALIDACION', 'El identificador no es válido');
  }
  return numero;
}

export const listarCondiciones: RequestHandler = async (req, res) => {
  const soloActivas = req.query.activas !== 'false';
  res.json(
    await pacientesContainer.listarCondiciones.execute(idDeRuta(req.params.id), soloActivas)
  );
};

export const crearCondicion: RequestHandler = async (req, res) => {
  const atencion = req.body?.idAtencionAlta;
  res.status(201).json(
    await pacientesContainer.crearCondicion.execute(
      idDeRuta(req.params.id),
      validarDescripcionCondicion(req.body),
      res.locals.usuario.id,
      typeof atencion === 'number' && Number.isInteger(atencion) && atencion > 0 ? atencion : null
    )
  );
};

export const actualizarCondicion: RequestHandler = async (req, res) => {
  res.json(
    await pacientesContainer.actualizarCondicion.execute(
      idDeRuta(req.params.id),
      validarDescripcionCondicion(req.body)
    )
  );
};

export const cambiarEstadoCondicion: RequestHandler = async (req, res) => {
  const activo = req.body?.activo;
  res.json(
    await pacientesContainer.cambiarEstadoCondicion.execute(
      idDeRuta(req.params.id),
      typeof activo === 'boolean' ? activo : true
    )
  );
};

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