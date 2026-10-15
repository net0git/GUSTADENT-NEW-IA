import { Router } from 'express';
import { authenticate } from '../../../http/middlewares/authenticate';
import {
  actualizarCondicion,
  actualizarPaciente,
  cambiarEstadoCondicion,
  crearCondicion,
  crearPaciente,
  listarCondiciones,
  listarPacientes,
  obtenerPaciente,
} from './pacientes.controller';

export const pacientesRouter = Router();

pacientesRouter.use(authenticate);

pacientesRouter.get('/', listarPacientes);
pacientesRouter.get('/:id', obtenerPaciente);
pacientesRouter.post('/', crearPaciente);
pacientesRouter.put('/:id', actualizarPaciente);

// Condiciones del paciente. Se cargan al crear el paciente y se pueden
// agregar, corregir o quitar durante una atencion.
pacientesRouter.get('/:id/condiciones', listarCondiciones);
pacientesRouter.post('/:id/condiciones', crearCondicion);

export const condicionesRouter = Router();

condicionesRouter.use(authenticate);

condicionesRouter.put('/:id', actualizarCondicion);
condicionesRouter.post('/:id/estado', cambiarEstadoCondicion);