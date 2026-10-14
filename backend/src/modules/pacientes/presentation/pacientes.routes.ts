import { Router } from 'express';
import { authenticate } from '../../../http/middlewares/authenticate';
import {
  actualizarPaciente,
  crearPaciente,
  listarPacientes,
  obtenerPaciente,
} from './pacientes.controller';

export const pacientesRouter = Router();

pacientesRouter.use(authenticate);

pacientesRouter.get('/', listarPacientes);
pacientesRouter.get('/:id', obtenerPaciente);
pacientesRouter.post('/', crearPaciente);
pacientesRouter.put('/:id', actualizarPaciente);