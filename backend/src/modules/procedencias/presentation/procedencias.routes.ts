import { Router } from 'express';
import { procedenciasContainer } from '../../../container';
import { authenticate } from '../../../http/middlewares/authenticate';
import { authorize } from '../../../http/middlewares/authorize';
import { crearControladoresCatalogo } from '../../../shared/catalogos/presentacion-catalogo';

const { listar, obtener, crear, actualizar, cambiarEstado } = crearControladoresCatalogo(
  procedenciasContainer.catalogo,
  false
);

export const procedenciasRouter = Router();

procedenciasRouter.use(authenticate);

procedenciasRouter.get('/', listar);
procedenciasRouter.get('/:id', obtener);
procedenciasRouter.post('/', authorize('administrador'), crear);
procedenciasRouter.put('/:id', authorize('administrador'), actualizar);
procedenciasRouter.patch('/:id/estado', authorize('administrador'), cambiarEstado);