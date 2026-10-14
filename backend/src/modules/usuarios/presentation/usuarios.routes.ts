import { Router } from 'express';
import { authenticate } from '../../../http/middlewares/authenticate';
import { authorize } from '../../../http/middlewares/authorize';
import {
  actualizarUsuario,
  asignarSucursales,
  cambiarEstadoUsuario,
  crearUsuario,
  listarOdontologos,
  listarUsuarios,
  obtenerUsuario,
  resetearPassword,
} from './usuarios.controller';

export const usuariosRouter = Router();

// Available para cualquier perfil autenticado: las atenciones necesitan elegir
// al odontologo responsable.
usuariosRouter.get('/odontologos', authenticate, listarOdontologos);

usuariosRouter.use(authenticate, authorize('administrador'));

usuariosRouter.get('/', listarUsuarios);
usuariosRouter.get('/:id', obtenerUsuario);
usuariosRouter.post('/', crearUsuario);
usuariosRouter.put('/:id', actualizarUsuario);
usuariosRouter.patch('/:id/estado', cambiarEstadoUsuario);
usuariosRouter.post('/:id/resetear-password', resetearPassword);
usuariosRouter.put('/:id/sucursales', asignarSucursales);