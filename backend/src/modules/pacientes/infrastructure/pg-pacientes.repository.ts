import { pool } from '../../../database/pool';
import { traducirErrorBd } from '../../../shared/database/errores-bd';
import { PacientesRepository } from '../application/ports/pacientes.repository';
import { DatosPaciente, Paciente, Sexo } from '../domain/paciente';

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

const MENSAJE_PROCEDENCIA_INEXISTENTE = 'La procedencia indicada no existe';
const LIMITE_RESULTADOS = 50;

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
}