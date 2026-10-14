import { AppError } from '../errors/app-error';
import { CatalogoBase, CatalogoRepository, EntradaCatalogo } from './dominio-catalogo';

const NOMBRE_DUPLICADO = 'NOMBRE_DUPLICADO';

export interface CasosDeUsoCatalogo<TListado extends CatalogoBase> {
  listar(soloActivas: boolean): Promise<TListado[]>;
  obtener(id: number): Promise<TListado>;
  crear(datos: EntradaCatalogo): Promise<TListado>;
  actualizar(id: number, datos: EntradaCatalogo): Promise<TListado>;
  cambiarEstado(id: number, activo: boolean): Promise<TListado>;
}

/**
 * Reglas comunes de los catálogos: no se repiten nombres, no se desactiva la
 * última entrada activa y no se desactiva una que todavía está en uso.
 */
export function crearCasosDeUsoCatalogo<TListado extends CatalogoBase>(
  repositorio: CatalogoRepository<TListado>
): CasosDeUsoCatalogo<TListado> {
  async function obtenerExistente(id: number): Promise<TListado> {
    const item = await repositorio.obtenerPorId(id);
    if (!item) {
      throw new AppError(404, 'REGISTRO_NO_ENCONTRADO', 'El registro no existe');
    }
    return item;
  }

  async function verificarNombreDisponible(nombre: string, exceptoId: number | null): Promise<void> {
    if (await repositorio.existeConNombre(nombre, exceptoId)) {
      throw new AppError(409, NOMBRE_DUPLICADO, 'Ya existe un registro con ese nombre');
    }
  }

  return {
    listar(soloActivas) {
      return repositorio.listar(soloActivas);
    },

    obtener: obtenerExistente,

    async crear(datos) {
      await verificarNombreDisponible(datos.nombre, null);
      const id = await repositorio.crear(datos);
      return obtenerExistente(id);
    },

    async actualizar(id, datos) {
      await obtenerExistente(id);
      await verificarNombreDisponible(datos.nombre, id);
      await repositorio.actualizar(id, datos);
      return obtenerExistente(id);
    },

    async cambiarEstado(id, activo) {
      const item = await obtenerExistente(id);
      if (item.activo === activo) {
        return item;
      }

      if (!activo) {
        if ((await repositorio.contarActivos()) <= 1) {
          throw new AppError(
            409,
            'NO_SE_PUEDE_DESACTIVAR_ULTIMA',
            'Debe quedar al menos un registro activo'
          );
        }
        if (await repositorio.tieneUsoPendiente(id)) {
          throw new AppError(
            409,
            'REGISTRO_EN_USO',
            'No se puede desactivar porque tiene registros asociados pendientes'
          );
        }
      }

      await repositorio.cambiarEstado(id, activo);
      return obtenerExistente(id);
    },
  };
}