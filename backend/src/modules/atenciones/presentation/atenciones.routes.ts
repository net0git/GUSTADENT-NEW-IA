import { Router } from 'express';
import { authenticate } from '../../../http/middlewares/authenticate';
import { authorize } from '../../../http/middlewares/authorize';
import {
  activarAtencion,
  anularAtencion,
  atenderSesion,
  actualizarSesion,
  cancelarSesion,
  crearAtencion,
  crearSesion,
  eliminarSesion,
  finalizarAtencion,
  guardarBorrador,
  listarAtenciones,
  listarResumenCalendario,
  listarSesiones,
  obtenerAtencion,
} from './atenciones.controller';

export const atencionesRouter = Router();

atencionesRouter.use(authenticate);

atencionesRouter.get('/', listarAtenciones);
atencionesRouter.get('/:id', obtenerAtencion);
atencionesRouter.post('/', crearAtencion);
atencionesRouter.put('/:id', guardarBorrador);
atencionesRouter.post('/:id/activar', activarAtencion);
atencionesRouter.post('/:id/finalizar', finalizarAtencion);
atencionesRouter.post('/:id/anular', authorize('administrador'), anularAtencion);
atencionesRouter.post('/:id/sesiones', crearSesion);

export const sesionesRouter = Router();

sesionesRouter.use(authenticate);

sesionesRouter.get('/', listarSesiones);
sesionesRouter.get('/calendario', listarResumenCalendario);
sesionesRouter.put('/:id', actualizarSesion);
sesionesRouter.post('/:id/atender', atenderSesion);
sesionesRouter.post('/:id/cancelar', cancelarSesion);
sesionesRouter.delete('/:id', eliminarSesion);