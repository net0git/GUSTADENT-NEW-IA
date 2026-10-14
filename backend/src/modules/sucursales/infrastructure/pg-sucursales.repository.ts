import { pool } from '../../../database/pool';
import { traducirErrorBd } from '../../../shared/database/errores-bd';
import { CatalogoRepository, EntradaCatalogo } from '../../../shared/catalogos/dominio-catalogo';
import { Sucursal } from '../application/ports/sucursales.repository';

interface SucursalFila {
  id_sucursal: number;
  nombre: string;
  direccion: string | null;
  activo: boolean;
}

const ESTADOS_ATENCION_PENDIENTE = "('borrador', 'activo')";

export class PgSucursalesRepository implements CatalogoRepository<Sucursal> {
  async listar(soloActivas: boolean): Promise<Sucursal[]> {
    const resultado = await pool.query<SucursalFila>(
      `SELECT id_sucursal, nombre, direccion, activo
         FROM sucursales
        WHERE NOT $1::boolean OR activo
        ORDER BY nombre`,
      [soloActivas]
    );
    return resultado.rows.map(this.aDominio);
  }

  async obtenerPorId(id: number): Promise<Sucursal | null> {
    const resultado = await pool.query<SucursalFila>(
      `SELECT id_sucursal, nombre, direccion, activo
         FROM sucursales
        WHERE id_sucursal = $1`,
      [id]
    );
    const fila = resultado.rows[0];
    return fila ? this.aDominio(fila) : null;
  }

  async crear(datos: EntradaCatalogo): Promise<number> {
    try {
      const resultado = await pool.query<{ id_sucursal: number }>(
        `INSERT INTO sucursales (nombre, direccion)
         VALUES ($1, $2)
         RETURNING id_sucursal`,
        [datos.nombre, datos.direccion]
      );
      return resultado.rows[0].id_sucursal;
    } catch (error) {
      throw traducirErrorBd(error);
    }
  }

  async actualizar(id: number, datos: EntradaCatalogo): Promise<boolean> {
    try {
      const resultado = await pool.query(
        'UPDATE sucursales SET nombre = $2, direccion = $3 WHERE id_sucursal = $1',
        [id, datos.nombre, datos.direccion]
      );
      return (resultado.rowCount ?? 0) > 0;
    } catch (error) {
      throw traducirErrorBd(error);
    }
  }

  async cambiarEstado(id: number, activo: boolean): Promise<boolean> {
    const resultado = await pool.query(
      'UPDATE sucursales SET activo = $2 WHERE id_sucursal = $1',
      [id, activo]
    );
    return (resultado.rowCount ?? 0) > 0;
  }

  async contarActivos(): Promise<number> {
    const resultado = await pool.query<{ total: number }>(
      'SELECT COUNT(*)::int AS total FROM sucursales WHERE activo'
    );
    return resultado.rows[0].total;
  }

  async existeConNombre(nombre: string, exceptoId: number | null): Promise<boolean> {
    const resultado = await pool.query<{ existe: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM sucursales
          WHERE LOWER(nombre) = LOWER($1)
            AND ($2::int IS NULL OR id_sucursal <> $2)
       ) AS existe`,
      [nombre, exceptoId]
    );
    return resultado.rows[0].existe;
  }

  async tieneUsoPendiente(id: number): Promise<boolean> {
    const resultado = await pool.query<{ existe: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM tickets
          WHERE id_sucursal = $1 AND estado IN ${ESTADOS_ATENCION_PENDIENTE}
       ) AS existe`,
      [id]
    );
    return resultado.rows[0].existe;
  }

  private aDominio(fila: SucursalFila): Sucursal {
    return {
      id: fila.id_sucursal,
      nombre: fila.nombre,
      direccion: fila.direccion,
      activo: fila.activo,
    };
  }
}