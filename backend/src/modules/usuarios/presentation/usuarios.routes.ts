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

usuariosRouter.use(authenticate);

// El administrador y recepcion consultan el personal; solo el administrador
// puede crear, editar, resetear contrasenas o asignar sucursales.
usuariosRouter.get('/', authorize('administrador', 'recepcion'), listarUsuarios);
usuariosRouter.get('/:id', authorize('administrador', 'recepcion'), obtenerUsuario);

usuariosRouter.use(authorize('administrador'));

usuariosRouter.post('/', crearUsuario);
usuariosRouter.put('/:id', actualizarUsuario);
usuariosRouter.patch('/:id/estado', cambiarEstadoUsuario);
usuariosRouter.post('/:id/resetear-password', resetearPassword);
usuariosRouter.put('/:id/sucursales', asignarSucursales);