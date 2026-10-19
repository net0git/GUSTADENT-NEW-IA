import { Router } from 'express';
import { authenticate } from '../../../http/middlewares/authenticate';
import { authorize } from '../../../http/middlewares/authorize';
import { limiteConfiguracionInicial } from '../../../http/middlewares/limites-solicitudes';
import {
  actualizarEmpresa,
  obtenerEmpresa,
  obtenerEstado,
  registrarAdministrador,
  registrarEmpresa,
  registrarSucursal,
} from './setup.controller';
import { verificarSetupToken } from './verificar-setup-token';

export const setupRouter = Router();

setupRouter.get('/estado', obtenerEstado);

// Configuracion inicial: exige el token de setup y solo se ejecuta una vez.
setupRouter.post('/empresa', limiteConfiguracionInicial, verificarSetupToken, registrarEmpresa);
setupRouter.post('/sucursal', limiteConfiguracionInicial, verificarSetupToken, registrarSucursal);
setupRouter.post(
  '/administrador',
  limiteConfiguracionInicial,
  verificarSetupToken,
  registrarAdministrador
);

// Modulo de configuracion: el administrador ya autenticado lee y edita la empresa.
setupRouter.get('/empresa', authenticate, authorize('administrador'), obtenerEmpresa);
setupRouter.put('/empresa', authenticate, authorize('administrador'), actualizarEmpresa);