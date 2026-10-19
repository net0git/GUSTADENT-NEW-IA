import { pool } from '../../../database/pool';
import { traducirErrorBd } from '../../../shared/database/errores-bd';
import {
  AdministradorSetup,
  EmpresaSetup,
  EstadoSetup,
  SetupRepository,
  SucursalSetup,
} from '../application/ports/setup.repository';

const BLOQUEO_CONFIGURACION = "SELECT pg_advisory_xact_lock(hashtext('configuracion_inicial'))";

export class PgSetupRepository implements SetupRepository {
  async obtenerEstado(): Promise<EstadoSetup> {
    const resultado = await pool.query<{ empresa: boolean; sucursal: boolean; administrador: boolean }>(
      `SELECT
         EXISTS (SELECT 1 FROM empresa)                                  AS empresa,
         EXISTS (SELECT 1 FROM sucursales)                               AS sucursal,
         EXISTS (SELECT 1 FROM usuarios WHERE perfil = 'administrador')  AS administrador`
    );
    const fila = resultado.rows[0];
    return {
      empresa: fila.empresa,
      sucursal: fila.sucursal,
      administrador: fila.administrador,
    };
  }

  registrarEmpresa(datos: EmpresaSetup): Promise<boolean> {
    return this.insertarSiNoExiste(
      'SELECT EXISTS (SELECT 1 FROM empresa) AS existe',
      `INSERT INTO empresa (nombre_empresa, ruc, direccion, telefono, logo)
       VALUES ($1, $2, $3, $4, $5)`,
      [datos.nombreEmpresa, datos.ruc, datos.direccion, datos.telefono, datos.logo]
    );
  }

  async obtenerEmpresa(): Promise<EmpresaSetup | null> {
    const resultado = await pool.query<{
      nombre_empresa: string;
      ruc: string;
      direccion: string | null;
      telefono: string | null;
      logo: string | null;
    }>('SELECT nombre_empresa, ruc, direccion, telefono, logo FROM empresa LIMIT 1');

    const fila = resultado.rows[0];
    if (!fila) {
      return null;
    }

    return {
      nombreEmpresa: fila.nombre_empresa,
      ruc: fila.ruc,
      direccion: fila.direccion,
      telefono: fila.telefono,
      logo: fila.logo,
    };
  }

  async actualizarEmpresa(datos: EmpresaSetup): Promise<boolean> {
    const resultado = await pool.query(
      `UPDATE empresa
          SET nombre_empresa = $1, ruc = $2, direccion = $3, telefono = $4, logo = $5`,
      [datos.nombreEmpresa, datos.ruc, datos.direccion, datos.telefono, datos.logo]
    );
    return (resultado.rowCount ?? 0) > 0;
  }

  registrarSucursal(datos: SucursalSetup): Promise<boolean> {
    return this.insertarSiNoExiste(
      'SELECT EXISTS (SELECT 1 FROM sucursales) AS existe',
      'INSERT INTO sucursales (nombre, direccion) VALUES ($1, $2)',
      [datos.nombre, datos.direccion]
    );
  }

  registrarAdministrador(datos: AdministradorSetup): Promise<boolean> {
    return this.insertarSiNoExiste(
      "SELECT EXISTS (SELECT 1 FROM usuarios WHERE perfil = 'administrador') AS existe",
      `INSERT INTO usuarios (dni, nombre_completo, username, password_hash, perfil)
       VALUES ($1, $2, $3, $4, 'administrador')`,
      [datos.dni, datos.nombreCompleto, datos.username, datos.passwordHash]
    );
  }

  /**
   * Inserta solo si la consulta de existencia devuelve falso. El bloqueo de
   * asesoría evita que dos solicitudes simultáneas registren el mismo paso.
   */
  private async insertarSiNoExiste(
    consultaExistencia: string,
    insercion: string,
    parametros: unknown[]
  ): Promise<boolean> {
    const cliente = await pool.connect();
    try {
      await cliente.query('BEGIN');
      await cliente.query(BLOQUEO_CONFIGURACION);

      const existencia = await cliente.query<{ existe: boolean }>(consultaExistencia);
      if (existencia.rows[0].existe) {
        await cliente.query('ROLLBACK');
        return false;
      }

      await cliente.query(insercion, parametros);
      await cliente.query('COMMIT');
      return true;
    } catch (error) {
      await cliente.query('ROLLBACK');
      throw traducirErrorBd(error);
    } finally {
      cliente.release();
    }
  }
}
