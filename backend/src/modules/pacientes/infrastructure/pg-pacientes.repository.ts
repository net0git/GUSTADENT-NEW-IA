import { pool } from '../../../database/pool';
import { traducirErrorBd } from '../../../shared/database/errores-bd';
import { PacientesRepository } from '../application/ports/pacientes.repository';
import { DatosPaciente, CondicionPaciente, Paciente, Sexo } from '../domain/paciente';

interface PacienteFila {
  id_paciente: number;
  dni: string;
  nombres: string;
  ap_paterno: string;
  ap_materno: string | null;
  fecha_nacimiento: Date | null;
  sexo: Sexo | null;
  telefono: string | null;
  id_procedencia: number | null;
  procedencia: string | null;
  nombre_completo: string;
}

interface CondicionFila {
  id_condicion: number;
  descripcion: string;
  activo: boolean;
  id_atencion_alta: number | null;
  id_usuario: number | null;
  nombre_usuario: string | null;
}

const MENSAJE_PROCEDENCIA_INEXISTENTE = 'La procedencia indicada no existe';
const LIMITE_RESULTADOS = 50;

function aCondicion(fila: CondicionFila): CondicionPaciente {
  return {
    id: fila.id_condicion,
    descripcion: fila.descripcion,
    activo: fila.activo,
    idAtencionAlta: fila.id_atencion_alta,
    idUsuario: fila.id_usuario,
    nombreUsuario: fila.nombre_usuario,
  };
}

const COLUMNAS = `
  p.id_paciente,
  p.dni,
  p.nombres,
  p.ap_paterno,
  p.ap_materno,
  p.fecha_nacimiento,
  p.sexo,
  p.telefono,
  p.id_procedencia,
  pr.nombre AS procedencia,
  TRIM(CONCAT(p.nombres, ' ', p.ap_paterno, ' ', COALESCE(p.ap_materno, ''))) AS nombre_completo
`;

function aDominio(fila: PacienteFila): Paciente {
  const fechaNacimiento = fila.fecha_nacimiento;
  return {
    id: fila.id_paciente,
    dni: fila.dni,
    nombres: fila.nombres,
    apPaterno: fila.ap_paterno,
    apMaterno: fila.ap_materno,
    fechaNacimiento: fechaNacimiento
      ? new Date(fechaNacimiento).toISOString().slice(0, 10)
      : null,
    sexo: fila.sexo,
    telefono: fila.telefono,
    idProcedencia: fila.id_procedencia,
    procedencia: fila.procedencia,
    nombreCompleto: fila.nombre_completo,
  };
}

export class PgPacientesRepository implements PacientesRepository {
  /**
   * Sin término devuelve los pacientes recientes. Con término busca por DNI
   * exacto o, si no hay coincidencias exactas, por nombre o apellidos.
   */
  async listar(terminoBusqueda: string | null): Promise<Paciente[]> {
    if (terminoBusqueda === null) {
      const recientes = await pool.query<PacienteFila>(
        `SELECT ${COLUMNAS}
           FROM pacientes p
           LEFT JOIN procedencias pr ON pr.id_procedencia = p.id_procedencia
          ORDER BY p.id_paciente DESC
          LIMIT $1`,
        [LIMITE_RESULTADOS]
      );
      return recientes.rows.map(aDominio);
    }

    const porDni = await pool.query<PacienteFila>(
      `SELECT ${COLUMNAS}
         FROM pacientes p
         LEFT JOIN procedencias pr ON pr.id_procedencia = p.id_procedencia
        WHERE p.dni = $1
        LIMIT $2`,
      [terminoBusqueda, LIMITE_RESULTADOS]
    );

    if (porDni.rows.length > 0) {
      return porDni.rows.map(aDominio);
    }

    const patron = `%${terminoBusqueda}%`;
    const porNombre = await pool.query<PacienteFila>(
      `SELECT ${COLUMNAS}
         FROM pacientes p
         LEFT JOIN procedencias pr ON pr.id_procedencia = p.id_procedencia
        WHERE p.dni ILIKE $1
           OR p.nombres ILIKE $1
           OR p.ap_paterno ILIKE $1
           OR p.ap_materno ILIKE $1
        ORDER BY p.ap_paterno, p.ap_materno, p.nombres
        LIMIT $2`,
      [patron, LIMITE_RESULTADOS]
    );
    return porNombre.rows.map(aDominio);
  }

  async obtenerPorId(id: number): Promise<Paciente | null> {
    const resultado = await pool.query<PacienteFila>(
      `SELECT ${COLUMNAS}
         FROM pacientes p
         LEFT JOIN procedencias pr ON pr.id_procedencia = p.id_procedencia
        WHERE p.id_paciente = $1`,
      [id]
    );
    const fila = resultado.rows[0];
    return fila ? aDominio(fila) : null;
  }

  async crear(datos: DatosPaciente): Promise<number> {
    try {
      const resultado = await pool.query<{ id_paciente: number }>(
        `INSERT INTO pacientes
           (dni, nombres, ap_paterno, ap_materno, fecha_nacimiento, sexo, telefono, id_procedencia)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id_paciente`,
        [
          datos.dni,
          datos.nombres,
          datos.apPaterno,
          datos.apMaterno,
          datos.fechaNacimiento,
          datos.sexo,
          datos.telefono,
          datos.idProcedencia,
        ]
      );
      return resultado.rows[0].id_paciente;
    } catch (error) {
      throw traducirErrorBd(error, MENSAJE_PROCEDENCIA_INEXISTENTE);
    }
  }

  async actualizar(id: number, datos: DatosPaciente): Promise<boolean> {
    try {
      const resultado = await pool.query(
        `UPDATE pacientes
            SET dni = $2,
                nombres = $3,
                ap_paterno = $4,
                ap_materno = $5,
                fecha_nacimiento = $6,
                sexo = $7,
                telefono = $8,
                id_procedencia = $9
          WHERE id_paciente = $1`,
        [
          id,
          datos.dni,
          datos.nombres,
          datos.apPaterno,
          datos.apMaterno,
          datos.fechaNacimiento,
          datos.sexo,
          datos.telefono,
          datos.idProcedencia,
        ]
      );
      return (resultado.rowCount ?? 0) > 0;
    } catch (error) {
      throw traducirErrorBd(error, MENSAJE_PROCEDENCIA_INEXISTENTE);
    }
  }

  async listarCondiciones(idPaciente: number, soloActivas: boolean): Promise<CondicionPaciente[]> {
    const resultado = await pool.query<CondicionFila>(
      `SELECT c.id_condicion,
              c.descripcion,
              c.activo,
              c.id_atencion_alta,
              c.id_usuario,
              u.nombre_completo AS nombre_usuario
         FROM condiciones_paciente c
         LEFT JOIN usuarios u ON u.id_usuario = c.id_usuario
        WHERE c.id_paciente = $1
          AND ($2::boolean IS FALSE OR c.activo)
        ORDER BY c.id_condicion DESC`,
      [idPaciente, soloActivas]
    );

    return resultado.rows.map(aCondicion);
  }

  async obtenerCondicion(id: number): Promise<CondicionPaciente | null> {
    const resultado = await pool.query<CondicionFila>(
      `SELECT c.id_condicion,
              c.descripcion,
              c.activo,
              c.id_atencion_alta,
              c.id_usuario,
              u.nombre_completo AS nombre_usuario
         FROM condiciones_paciente c
         LEFT JOIN usuarios u ON u.id_usuario = c.id_usuario
        WHERE c.id_condicion = $1`,
      [id]
    );
    const fila = resultado.rows[0];
    return fila ? aCondicion(fila) : null;
  }

  async crearCondicion(
    idPaciente: number,
    descripcion: string,
    idUsuario: number,
    idAtencionAlta: number | null
  ): Promise<number> {
    try {
      const resultado = await pool.query<{ id_condicion: number }>(
        `INSERT INTO condiciones_paciente
           (id_paciente, descripcion, id_atencion_alta, id_usuario)
         VALUES ($1, $2, $3, $4)
         RETURNING id_condicion`,
        [idPaciente, descripcion, idAtencionAlta, idUsuario]
      );
      return resultado.rows[0].id_condicion;
    } catch (error) {
      throw traducirErrorBd(error, MENSAJE_PROCEDENCIA_INEXISTENTE);
    }
  }

  async actualizarCondicion(id: number, descripcion: string): Promise<boolean> {
    const resultado = await pool.query(
      'UPDATE condiciones_paciente SET descripcion = $2 WHERE id_condicion = $1',
      [id, descripcion]
    );
    return (resultado.rowCount ?? 0) > 0;
  }

  /** Quitar no borra: la condicion queda desactivada para conservar la historia. */
  async cambiarEstadoCondicion(id: number, activo: boolean): Promise<boolean> {
    const resultado = await pool.query(
      'UPDATE condiciones_paciente SET activo = $2 WHERE id_condicion = $1',
      [id, activo]
    );
    return (resultado.rowCount ?? 0) > 0;
  }
}