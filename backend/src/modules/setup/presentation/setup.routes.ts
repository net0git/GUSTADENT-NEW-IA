import { Router } from 'express';
import { limiteConfiguracionInicial } from '../../../http/middlewares/limites-solicitudes';
import {
  obtenerEstado,
  registrarAdministrador,
  registrarEmpresa,
  registrarSucursal,
} from './setup.controller';
import { verificarSetupToken } from './verificar-setup-token';

export const setupRouter = Router();

setupRouter.get('/estado', obtenerEstado);
setupRouter.post('/empresa', limiteConfiguracionInicial, verificarSetupToken, registrarEmpresa);
setupRouter.post('/sucursal', limiteConfiguracionInicial, verificarSetupToken, registrarSucursal);
setupRouter.post(
  '/administrador',
  limiteConfiguracionInicial,
  verificarSetupToken,
  registrarAdministrador
);
