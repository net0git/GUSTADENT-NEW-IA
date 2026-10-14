import { RequestHandler } from 'express';
import { usuariosContainer } from '../../../container';
import {
  validarDatosUsuario,
  validarEstado,
  validarFiltros,
  validarIdentificador,
  validarNuevoUsuario,
  validarSucursalesAsignadas,
} from './usuarios.schemas';

function idDeRuta(parametro: string | string[] | undefined): number {
  return validarIdentificador(String(parametro ?? ''));
}

export const listarOdontologos: RequestHandler = async (_req, res) => {
  res.json(await usuariosContainer.listarOdontologos.execute());
};

export const listarUsuarios: RequestHandler = async (req, res) => {
  const filtros = validarFiltros(req.query as Record<string, unknown>);
  res.json(await usuariosContainer.listar.execute(filtros));
};

export const obtenerUsuario: RequestHandler = async (req, res) => {
  res.json(await usuariosContainer.obtener.execute(idDeRuta(req.params.id)));
};

export const crearUsuario: RequestHandler = async (req, res) => {
  const usuario = await usuariosContainer.crear.execute(validarNuevoUsuario(req.body));
  res.status(201).json(usuario);
};

export const actualizarUsuario: RequestHandler = async (req, res) => {
  const usuario = await usuariosContainer.actualizar.execute(
    res.locals.usuario.id,
    idDeRuta(req.params.id),
    validarDatosUsuario(req.body)
  );
  res.json(usuario);
};

export const cambiarEstadoUsuario: RequestHandler = async (req, res) => {
  const usuario = await usuariosContainer.cambiarEstado.execute(
    res.locals.usuario.id,
    idDeRuta(req.params.id),
    validarEstado(req.body)
  );
  res.json(usuario);
};

export const resetearPassword: RequestHandler = async (req, res) => {
  res.json(await usuariosContainer.resetearPassword.execute(idDeRuta(req.params.id)));
};

export const asignarSucursales: RequestHandler = async (req, res) => {
  const usuario = await usuariosContainer.asignarSucursales.execute(
    idDeRuta(req.params.id),
    validarSucursalesAsignadas(req.body)
  );
  res.json(usuario);
};
