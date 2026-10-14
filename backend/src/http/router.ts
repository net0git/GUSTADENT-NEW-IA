import { Router } from 'express';
import { atencionesRouter, sesionesRouter } from '../modules/atenciones/presentation/atenciones.routes';
import { authRouter } from '../modules/auth/presentation/auth.routes';
import { setupRouter } from '../modules/setup/presentation/setup.routes';
import { pacientesRouter } from '../modules/pacientes/presentation/pacientes.routes';
import { reportesRouter } from '../modules/reportes/presentation/reportes.routes';
import { sucursalesRouter } from '../modules/sucursales/presentation/sucursales.routes';
import { procedenciasRouter } from '../modules/procedencias/presentation/procedencias.routes';
import { usuariosRouter } from '../modules/usuarios/presentation/usuarios.routes';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({ estado: 'ok' });
});

apiRouter.use('/setup', setupRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/usuarios', usuariosRouter);
apiRouter.use('/pacientes', pacientesRouter);
apiRouter.use('/atenciones', atencionesRouter);
apiRouter.use('/sesiones', sesionesRouter);
apiRouter.use('/sucursales', sucursalesRouter);
apiRouter.use('/procedencias', procedenciasRouter);
apiRouter.use('/reportes', reportesRouter);
