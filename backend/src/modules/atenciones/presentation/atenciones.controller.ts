import { RequestHandler } from 'express';
import { atencionesContainer } from '../../../container';
import {
  idDeRuta,
  validarAtencionSesion,
  validarDatosAtencion,
  validarDatosSesion,
  validarFiltros,
  validarFiltrosSesion,
  validarRangoCalendario,
} from './atenciones.schemas';

export const listarAtenciones: RequestHandler = async (req, res) => {
  res.json(await atencionesContainer.listar.execute(validarFiltros(req.query as Record<string, unknown>)));
};

export const obtenerAtencion: RequestHandler = async (req, res) => {
  res.json(await atencionesContainer.obtener.execute(idDeRuta(req.params.id)));
};

export const crearAtencion: RequestHandler = async (req, res) => {
  res
    .status(201)
    .json(
      await atencionesContainer.crear.execute(validarDatosAtencion(req.body), res.locals.usuario.id)
    );
};

export const guardarBorrador: RequestHandler = async (req, res) => {
  res.json(
    await atencionesContainer.guardarBorrador.execute(idDeRuta(req.params.id), validarDatosAtencion(req.body))
  );
};

export const activarAtencion: RequestHandler = async (req, res) => {
  res.json(await atencionesContainer.activar.execute(idDeRuta(req.params.id)));
};

export const finalizarAtencion: RequestHandler = async (req, res) => {
  res.json(await atencionesContainer.finalizar.execute(idDeRuta(req.params.id)));
};

export const anularAtencion: RequestHandler = async (req, res) => {
  res.json(await atencionesContainer.anular.execute(idDeRuta(req.params.id)));
};

export const crearSesion: RequestHandler = async (req, res) => {
  res.status(201).json(
    await atencionesContainer.crearSesion.execute(
      idDeRuta(req.params.id),
      validarDatosSesion(req.body),
      res.locals.usuario.id
    )
  );
};

export const listarSesiones: RequestHandler = async (req, res) => {
  res.json(
    await atencionesContainer.listarSesionesCitas.execute(
      validarFiltrosSesion(req.query as Record<string, unknown>)
    )
  );
};

export const listarResumenCalendario: RequestHandler = async (req, res) => {
  const rango = validarRangoCalendario(req.query as Record<string, unknown>);
  res.json(await atencionesContainer.listarResumenCalendario.execute(rango.desde, rango.hasta));
};

export const actualizarSesion: RequestHandler = async (req, res) => {
  res.json(
    await atencionesContainer.actualizarSesion.execute(idDeRuta(req.params.id), validarDatosSesion(req.body))
  );
};

export const atenderSesion: RequestHandler = async (req, res) => {
  res.json(
    await atencionesContainer.atenderSesion.execute(
      idDeRuta(req.params.id),
      res.locals.usuario.id,
      validarAtencionSesion(req.body)
    )
  );
};

export const cancelarSesion: RequestHandler = async (req, res) => {
  res.json(await atencionesContainer.cancelarSesion.execute(idDeRuta(req.params.id)));
};

export const eliminarSesion: RequestHandler = async (req, res) => {
  await atencionesContainer.eliminarSesion.execute(idDeRuta(req.params.id));
  res.status(204).end();
};