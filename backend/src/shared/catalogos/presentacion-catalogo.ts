import { RequestHandler } from 'express';
import { AppError } from '../errors/app-error';
import { CasosDeUsoCatalogo } from './casos-de-uso-catalogo';
import { CatalogoBase, EntradaCatalogo } from './dominio-catalogo';
import { objetoDeCuerpo, textoOpcional, textoRequerido } from '../validation/validadores';

export function validarEntradaCatalogo(cuerpo: unknown, conDireccion: boolean): EntradaCatalogo {
  const datos = objetoDeCuerpo(cuerpo);
  return {
    nombre: textoRequerido(datos.nombre, 'nombre', 30),
    direccion: conDireccion ? textoOpcional(datos.direccion, 'direccion', 80) : null,
  };
}

export function idDeRutaCatalogo(parametro: unknown): number {
  const numero = Number(parametro);
  if (!Number.isInteger(numero) || numero <= 0) {
    throw new AppError(400, 'VALIDACION', 'El identificador no es válido');
  }
  return numero;
}

export function crearControladoresCatalogo<TListado extends CatalogoBase>(
  casos: CasosDeUsoCatalogo<TListado>,
  conDireccion: boolean
): { listar: RequestHandler; obtener: RequestHandler; crear: RequestHandler; actualizar: RequestHandler; cambiarEstado: RequestHandler } {
  const listar: RequestHandler = async (req, res) => {
    const soloActivas = req.query.soloActivas !== 'false';
    res.json(await casos.listar(soloActivas));
  };

  const obtener: RequestHandler = async (req, res) => {
    res.json(await casos.obtener(idDeRutaCatalogo(req.params.id)));
  };

  const crear: RequestHandler = async (req, res) => {
    res.status(201).json(await casos.crear(validarEntradaCatalogo(req.body, conDireccion)));
  };

  const actualizar: RequestHandler = async (req, res) => {
    res.json(await casos.actualizar(idDeRutaCatalogo(req.params.id), validarEntradaCatalogo(req.body, conDireccion)));
  };

  const cambiarEstado: RequestHandler = async (req, res) => {
    const datos = objetoDeCuerpo(req.body);
    if (typeof datos.activo !== 'boolean') {
      throw new AppError(400, 'VALIDACION', 'El campo activo debe ser verdadero o falso');
    }
    res.json(await casos.cambiarEstado(idDeRutaCatalogo(req.params.id), datos.activo));
  };

  return { listar, obtener, crear, actualizar, cambiarEstado };
}