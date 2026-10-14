import { pool } from '../../../database/pool';
import { traducirErrorBd } from '../../../shared/database/errores-bd';
import { Perfil } from '../../auth/domain/usuario-autenticable';
import { OdontologoDisponible, UsuariosRepository } from '../application/ports/usuarios.repository';
import {
  DatosUsuario,
  FiltrosUsuario,
  NuevoUsuario,
  SucursalAsignada,
  Usuario,
} from '../domain/usuario';

interface UsuarioFila {
  id_usuario: number;
  dni: string;
  nombre_completo: string;
  especialidad: string | null;
  telefono: string | null;
  username: string;
  perfil: Perfil;
  activo: boolean;
  sucursales: SucursalAsignada[];
}

const CONSULTA_USUARIOS = `
  SELECT
    u.id_usuario,
    u.dni,
    u.nombre_completo,
    u.especialidad,
    u.telefono,
    u.username,
    u.perfil,
    u.activo,
    COALESCE(
      json_agg(json_build_object('id', s.id_sucursal, 'nombre', s.nombre) ORDER BY s.nombre)
        FILTER (WHERE s.id_sucursal IS NOT NULL),
      '[]'
    ) AS sucursales
  FROM usuarios u
  LEFT JOIN usuario_sucursales us ON us.id_usuario = u.id_usuario
  LEFT JOIN sucursales s ON s.id_sucursal = us.id_sucursal
`;

const MENSAJE_SUCURSAL_INEXISTENTE = 'Una de las sucursales indicadas no existe';

function aDominio(fila: UsuarioFila): Usuario {
  return {
    id: fila.id_usuario,
    dni: fila.dni,
    nombreCompleto: fila.nombre_completo,
    especialidad: fila.especialidad,
    telefono: fila.telefono,
    username: fila.username,
    perfil: fila.perfil,
    activo: fila.activo,
    sucursales: fila.sucursales,
  };
}

export class PgUsuariosRepository implements UsuariosRepository {
  async listar(filtros: FiltrosUsuario): Promise<Usuario[]> {
    const resultado = await pool.query<UsuarioFila>(
      `${CONSULTA_USUARIOS}
       WHERE ($1::varchar IS NULL OR u.perfil = $1)
         AND ($2::boolean IS NULL OR u.activo = $2)
       GROUP BY u.id_usuario
       ORDER BY u.nombre_completo`,
      [filtros.perfil ?? null, filtros.activo ?? null]
    );
    return resultado.rows.map(aDominio);
  }

  async listarOdontologosActivos(): Promise<OdontologoDisponible[]> {
    const resultado = await pool.query<{
      id_usuario: number;
      nombre_completo: string;
      especialidad: string | null;
    }>(
      `SELECT id_usuario, nombre_completo, especialidad
         FROM usuarios
        WHERE perfil = 'odontologo' AND activo
        ORDER BY nombre_completo`,
      []
    );
    return resultado.rows.map((fila) => ({
      id: fila.id_usuario,
      nombreCompleto: fila.nombre_completo,
      especialidad: fila.especialidad,
    }));
  }

  async obtenerPorId(id: number): Promise<Usuario | null> {
    const resultado = await pool.query<UsuarioFila>(
      `${CONSULTA_USUARIOS}
       WHERE u.id_usuario = $1
       GROUP BY u.id_usuario`,
      [id]
    );
    const fila = resultado.rows[0];
    return fila ? aDominio(fila) : null;
  }

  async actualizarPasswordHash(id: number, passwordHash: string): Promise<void> {
    await pool.query('UPDATE usuarios SET password_hash = $2 WHERE id_usuario = $1', [id, passwordHash]);
  }

  async incrementarTokenVersion(id: number): Promise<void> {
    await pool.query(
      'UPDATE usuarios SET token_version = token_version + 1 WHERE id_usuario = $1',
      [id]
    );
  }

  async crear(datos: NuevoUsuario): Promise<number> {
    const cliente = await pool.connect();
    try {
      await cliente.query('BEGIN');
      const insercion = await cliente.query<{ id_usuario: number }>(
        `INSERT INTO usuarios (dni, nombre_completo, especialidad, telefono, username, password_hash, perfil)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id_usuario`,
        [
          datos.dni,
          datos.nombreCompleto,
          datos.especialidad,
          datos.telefono,
          datos.username,
          datos.passwordHash,
          datos.perfil,
        ]
      );
      const id = insercion.rows[0].id_usuario;

      await cliente.query(
        `INSERT INTO usuario_sucursales (id_usuario, id_sucursal)
         SELECT $1, UNNEST($2::int[])`,
        [id, datos.sucursales]
      );

      await cliente.query('COMMIT');
      return id;
    } catch (error) {
      await cliente.query('ROLLBACK');
      throw traducirErrorBd(error, MENSAJE_SUCURSAL_INEXISTENTE);
    } finally {
      cliente.release();
    }
  }

  async actualizar(id: number, datos: DatosUsuario): Promise<boolean> {
    try {
      const resultado = await pool.query(
        `UPDATE usuarios
            SET dni = $2,
                nombre_completo = $3,
                especialidad = $4,
                telefono = $5,
                username = $6,
                perfil = $7
          WHERE id_usuario = $1`,
        [
          id,
          datos.dni,
          datos.nombreCompleto,
          datos.especialidad,
          datos.telefono,
          datos.username,
          datos.perfil,
        ]
      );
      return (resultado.rowCount ?? 0) > 0;
    } catch (error) {
      throw traducirErrorBd(error);
    }
  }

  async cambiarEstado(id: number, activo: boolean): Promise<boolean> {
    const resultado = await pool.query(
      `UPDATE usuarios
          SET activo = $2,
              token_version = CASE WHEN $2::boolean THEN token_version ELSE token_version + 1 END
        WHERE id_usuario = $1`,
      [id, activo]
    );
    return (resultado.rowCount ?? 0) > 0;
  }

  async reemplazarSucursales(id: number, sucursales: number[]): Promise<void> {
    const cliente = await pool.connect();
    try {
      await cliente.query('BEGIN');
      await cliente.query('DELETE FROM usuario_sucursales WHERE id_usuario = $1', [id]);
      await cliente.query(
        `INSERT INTO usuario_sucursales (id_usuario, id_sucursal)
         SELECT $1, UNNEST($2::int[])`,
        [id, sucursales]
      );
      await cliente.query('COMMIT');
    } catch (error) {
      await cliente.query('ROLLBACK');
      throw traducirErrorBd(error, MENSAJE_SUCURSAL_INEXISTENTE);
    } finally {
      cliente.release();
    }
  }
}
