import { Router } from 'express';
import { sucursalesContainer } from '../../../container';
import { authenticate } from '../../../http/middlewares/authenticate';
import { authorize } from '../../../http/middlewares/authorize';
import { crearControladoresCatalogo } from '../../../shared/catalogos/presentacion-catalogo';

const { listar, obtener, crear, actualizar, cambiarEstado } = crearControladoresCatalogo(
  sucursalesContainer.catalogo,
  true
);

export const sucursalesRouter = Router();

sucursalesRouter.use(authenticate);

sucursalesRouter.get('/', listar);
sucursalesRouter.get('/:id', obtener);
sucursalesRouter.post('/', authorize('administrador'), crear);
sucursalesRouter.put('/:id', authorize('administrador'), actualizar);
sucursalesRouter.patch('/:id/estado', authorize('administrador'), cambiarEstado);