import { pool } from '../../../database/pool';
import { CatalogoRepository, EntradaCatalogo } from '../../../shared/catalogos/dominio-catalogo';
import { Procedencia } from '../application/ports/procedencias.repository';

interface ProcedenciaFila {
  id_procedencia: number;
  nombre: string;
  activo: boolean;
}

export class PgProcedenciasRepository implements CatalogoRepository<Procedencia> {
  async listar(soloActivas: boolean): Promise<Procedencia[]> {
    const resultado = await pool.query<ProcedenciaFila>(
      `SELECT id_procedencia, nombre, activo
         FROM procedencias
        WHERE NOT $1::boolean OR activo
        ORDER BY nombre`,
      [soloActivas]
    );
    return resultado.rows.map((fila) => ({
      id: fila.id_procedencia,
      nombre: fila.nombre,
      activo: fila.activo,
    }));
  }

  async obtenerPorId(id: number): Promise<Procedencia | null> {
    const resultado = await pool.query<ProcedenciaFila>(
      `SELECT id_procedencia, nombre, activo
         FROM procedencias
        WHERE id_procedencia = $1`,
      [id]
    );
    const fila = resultado.rows[0];
    return fila ? { id: fila.id_procedencia, nombre: fila.nombre, activo: fila.activo } : null;
  }

  async crear(datos: EntradaCatalogo): Promise<number> {
    const resultado = await pool.query<{ id_procedencia: number }>(
      `INSERT INTO procedencias (nombre)
       VALUES ($1)
       RETURNING id_procedencia`,
      [datos.nombre]
    );
    return resultado.rows[0].id_procedencia;
  }

  async actualizar(id: number, datos: EntradaCatalogo): Promise<boolean> {
    const resultado = await pool.query('UPDATE procedencias SET nombre = $2 WHERE id_procedencia = $1', [
      id,
      datos.nombre,
    ]);
    return (resultado.rowCount ?? 0) > 0;
  }

  async cambiarEstado(id: number, activo: boolean): Promise<boolean> {
    const resultado = await pool.query('UPDATE procedencias SET activo = $2 WHERE id_procedencia = $1', [
      id,
      activo,
    ]);
    return (resultado.rowCount ?? 0) > 0;
  }

  async contarActivos(): Promise<number> {
    const resultado = await pool.query<{ total: number }>(
      'SELECT COUNT(*)::int AS total FROM procedencias WHERE activo'
    );
    return resultado.rows[0].total;
  }

  async existeConNombre(nombre: string, exceptoId: number | null): Promise<boolean> {
    const resultado = await pool.query<{ existe: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM procedencias
          WHERE LOWER(nombre) = LOWER($1)
            AND ($2::int IS NULL OR id_procedencia <> $2)
       ) AS existe`,
      [nombre, exceptoId]
    );
    return resultado.rows[0].existe;
  }

  async tieneUsoPendiente(): Promise<boolean> {
    // Los pacientes conservan su procedencia aunque esta se desactive, por lo
    // que no hay registros que impidan desactivarla.
    return false;
  }
}