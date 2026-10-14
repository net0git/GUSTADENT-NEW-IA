import { Router } from 'express';
import { authenticate } from '../../../http/middlewares/authenticate';
import { limiteLogin } from '../../../http/middlewares/limites-solicitudes';
import { cambiarPassword, login, logout, obtenerUsuarioActual } from './auth.controller';

export const authRouter = Router();

authRouter.post('/login', limiteLogin, login);
authRouter.get('/me', authenticate, obtenerUsuarioActual);
authRouter.post('/logout', authenticate, logout);
authRouter.put('/password', authenticate, cambiarPassword);
