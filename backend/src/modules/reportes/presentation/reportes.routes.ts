import { Router } from 'express';
import { authenticate } from '../../../http/middlewares/authenticate';
import { authorize } from '../../../http/middlewares/authorize';
import {
  atencionesPorMes,
  cuentasPorCobrar,
  ingresosPorSesion,
  productividad,
  resumenAtenciones,
} from './reportes.controller';

export const reportesRouter = Router();

/** Los reportes muestran ingresos y deudas de toda la clinica: solo el administrador. */
reportesRouter.use(authenticate, authorize('administrador'));

reportesRouter.get('/atenciones', resumenAtenciones);
reportesRouter.get('/ingresos-sesiones', ingresosPorSesion);
reportesRouter.get('/productividad', productividad);
reportesRouter.get('/cuentas-por-cobrar', cuentasPorCobrar);
reportesRouter.get('/atenciones-por-mes', atencionesPorMes);