import { pool } from '../../../database/pool';
import { traducirErrorBd } from '../../../shared/database/errores-bd';
import { AtencionesRepository } from '../application/ports/atenciones.repository';
import {
  Atencion,
  DatosAtencion,
  DatosAtencionSesion,
  DatosSesion,
  DatosSesionIngresados,
  EstadoAtencion,
  EstadoSesion,
  FiltrosAtencion,
  FiltrosSesion,
  ResumenDia,
  Sesion,
  SesionCita,
  TipoSesion,
} from '../domain/atencion';

interface AtencionFila {
  id_ticket: number;
  id_paciente: number;
  nombre_completo_paciente: string;
  dni_paciente: string;
  id_sucursal: number;
  nombre_sucursal: string;
  id_usuario: number;
  nombre_medico: string;
  fecha: Date;
  hora_atencion: string;
  descripcion: string | null;
  costo: string;
  descuento: string;
  estado: EstadoAtencion;
  pagado: string;
}

interface SesionFila {
  id_sesion: number;
  id_ticket: number;
  numero: number;
  tipo: TipoSesion;
  fecha_hora: Date;
  observaciones: string | null;
  monto: string;
  estado: EstadoSesion;
  id_usuario: number | null;
  nombre_usuario: string | null;
}

interface SesionCitaFila {
  id_sesion: number;
  id_ticket: number;
  numero_atencion: number;
  estado_atencion: EstadoAtencion;
  numero: number;
  tipo: TipoSesion;
  fecha_hora: Date;
  estado: EstadoSesion;
  id_paciente: number;
  nombre_completo_paciente: string;
  dni_paciente: string;
  nombre_medico: string;
  nombre_sucursal: string;
}

interface ResumenDiaFila {
  fecha: string;
  total: string;
}

const MENSAJE_REFERENCIA = 'El paciente, la sucursal o el médico indicados no existen';

const CONSULTA_ATENCION = `
  SELECT
    t.id_ticket,
    t.id_paciente,
    TRIM(CONCAT(p.nombres, ' ', p.ap_paterno, ' ', COALESCE(p.ap_materno, ''))) AS nombre_completo_paciente,
    p.dni AS dni_paciente,
    t.id_sucursal,
    s.nombre AS nombre_sucursal,
    t.id_usuario,
    u.nombre_completo AS nombre_medico,
    t.fecha,
    TO_CHAR(t.hora, 'HH24:MI') AS hora_atencion,
    t.descripcion,
    t.costo,
    t.descuento,
    t.estado,
    COALESCE(r.pagado, 0) AS pagado
  FROM tickets t
  JOIN pacientes p ON p.id_paciente = t.id_paciente
  JOIN sucursales s ON s.id_sucursal = t.id_sucursal
  JOIN usuarios u ON u.id_usuario = t.id_usuario
  LEFT JOIN v_resumen_ticket r ON r.id_ticket = t.id_ticket
`;

const COLUMNAS_SESION = `
  s.id_sesion,
  s.id_ticket,
  s.numero,
  s.tipo,
  s.fecha_hora,
  s.observaciones,
  s.monto,
  s.estado,
  s.id_usuario,
  u.nombre_completo AS nombre_usuario
`;

const CONSULTA_SESIONES = `
  SELECT ${COLUMNAS_SESION}
    FROM sesiones s
    LEFT JOIN usuarios u ON u.id_usuario = s.id_usuario
`;

function numero(valor: string | number): number {
  return typeof valor === 'number' ? valor : Number(valor);
}

function fechaIso(valor: Date): string {
  return new Date(valor).toISOString();
}

function fechaCorta(valor: Date): string {
  const fecha = new Date(valor);
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

export class PgAtencionesRepository implements AtencionesRepository {
  async listar(filtros: FiltrosAtencion): Promise<Atencion[]> {
    const resultado = await pool.query<AtencionFila>(
      `${CONSULTA_ATENCION}
       WHERE ($1::date IS NULL OR t.fecha = $1::date)
         AND ($2::int IS NULL OR t.id_sucursal = $2)
         AND ($3::int IS NULL OR t.id_usuario = $3)
         AND ($4::int IS NULL OR t.id_paciente = $4)
         AND ($5::varchar IS NULL OR t.estado = $5)
       ORDER BY t.fecha DESC, t.id_ticket DESC`,
      [
        filtros.fecha ?? null,
        filtros.idSucursal ?? null,
        filtros.idUsuario ?? null,
        filtros.idPaciente ?? null,
        filtros.estado ?? null,
      ]
    );
    return Promise.all(resultado.rows.map((fila) => this.construirAtencion(fila)));
  }

  async obtenerPorId(id: number): Promise<Atencion | null> {
    const resultado = await pool.query<AtencionFila>(
      `${CONSULTA_ATENCION} WHERE t.id_ticket = $1`,
      [id]
    );
    const fila = resultado.rows[0];
    return fila ? this.construirAtencion(fila) : null;
  }

  async crear(datos: DatosAtencion): Promise<number> {
    try {
      const resultado = await pool.query<{ id_ticket: number }>(
        `INSERT INTO tickets (id_paciente, id_sucursal, id_usuario, fecha, hora, descripcion, costo, descuento, estado)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'borrador')
         RETURNING id_ticket`,
        [
          datos.idPaciente,
          datos.idSucursal,
          datos.idUsuario,
          datos.fecha,
          datos.hora,
          datos.descripcion,
          datos.costo,
          datos.descuento,
        ]
      );
      return resultado.rows[0].id_ticket;
    } catch (error) {
      throw traducirErrorBd(error, MENSAJE_REFERENCIA);
    }
  }

  async actualizarDatos(id: number, datos: DatosAtencion): Promise<boolean> {
    try {
      const resultado = await pool.query(
        `UPDATE tickets
            SET id_paciente = $2,
                id_sucursal = $3,
                id_usuario = $4,
                fecha = $5,
                hora = $6,
                descripcion = $7,
                costo = $8,
                descuento = $9
          WHERE id_ticket = $1`,
        [
          id,
          datos.idPaciente,
          datos.idSucursal,
          datos.idUsuario,
          datos.fecha,
          datos.hora,
          datos.descripcion,
          datos.costo,
          datos.descuento,
        ]
      );
      return (resultado.rowCount ?? 0) > 0;
    } catch (error) {
      throw traducirErrorBd(error, MENSAJE_REFERENCIA);
    }
  }

  async cambiarEstado(id: number, estado: EstadoAtencion): Promise<boolean> {
    const resultado = await pool.query(
      'UPDATE tickets SET estado = $2 WHERE id_ticket = $1',
      [id, estado]
    );
    return (resultado.rowCount ?? 0) > 0;
  }

  async listarSesiones(idTicket: number): Promise<Sesion[]> {
    const resultado = await pool.query<SesionFila>(
      `${CONSULTA_SESIONES} WHERE s.id_ticket = $1 ORDER BY s.numero`,
      [idTicket]
    );
    return resultado.rows.map(this.aSesion);
  }

  async listarSesionesCitas(filtros: FiltrosSesion): Promise<SesionCita[]> {
    const resultado = await pool.query<SesionCitaFila>(
      `SELECT
         s.id_sesion,
         s.id_ticket,
         t.id_ticket AS numero_atencion,
         t.estado AS estado_atencion,
         s.numero,
         s.tipo,
         s.fecha_hora,
         s.estado,
         t.id_paciente,
         TRIM(CONCAT(p.nombres, ' ', p.ap_paterno, ' ', COALESCE(p.ap_materno, ''))) AS nombre_completo_paciente,
         p.dni AS dni_paciente,
         u.nombre_completo AS nombre_medico,
         sc.nombre AS nombre_sucursal
       FROM sesiones s
       JOIN tickets t ON t.id_ticket = s.id_ticket
       JOIN pacientes p ON p.id_paciente = t.id_paciente
       JOIN usuarios u ON u.id_usuario = t.id_usuario
       JOIN sucursales sc ON sc.id_sucursal = t.id_sucursal
       WHERE ($1::date IS NULL OR s.fecha_hora::date = $1::date)
         AND ($2::date IS NULL OR s.fecha_hora::date >= $2::date)
         AND ($3::date IS NULL OR s.fecha_hora::date <= $3::date)
       ORDER BY s.fecha_hora`,
      [filtros.fecha ?? null, filtros.desde ?? null, filtros.hasta ?? null]
    );

    return resultado.rows.map((fila) => ({
      id: fila.id_sesion,
      idTicket: fila.id_ticket,
      numeroAtencion: fila.numero_atencion,
      estadoAtencion: fila.estado_atencion,
      numero: fila.numero,
      tipo: fila.tipo,
      fechaHora: fechaIso(fila.fecha_hora),
      estado: fila.estado,
      idPaciente: fila.id_paciente,
      nombreCompletoPaciente: fila.nombre_completo_paciente,
      dniPaciente: fila.dni_paciente,
      nombreMedico: fila.nombre_medico,
      nombreSucursal: fila.nombre_sucursal,
    }));
  }

  /** Solo las sesiones programadas: son las unicas que el calendario debe marcar. */
  async listarResumenCalendario(desde: string, hasta: string): Promise<ResumenDia[]> {
    const resultado = await pool.query<ResumenDiaFila>(
      `SELECT s.fecha_hora::date::text AS fecha, COUNT(*) AS total
         FROM sesiones s
         JOIN tickets t ON t.id_ticket = s.id_ticket
        WHERE s.estado = 'programado'
          AND t.estado <> 'anulado'
          AND s.fecha_hora::date BETWEEN $1::date AND $2::date
        GROUP BY 1
        ORDER BY 1`,
      [desde, hasta]
    );

    return resultado.rows.map((fila) => ({
      fecha: fila.fecha,
      total: numero(fila.total),
    }));
  }

  async obtenerSesion(id: number): Promise<Sesion | null> {
    const resultado = await pool.query<SesionFila>(
      `${CONSULTA_SESIONES} WHERE s.id_sesion = $1`,
      [id]
    );
    const fila = resultado.rows[0];
    return fila ? this.aSesion(fila) : null;
  }

  /** El numero y el tipo se derivan de las sesiones ya existentes del ticket. */
  async crearSesion(idTicket: number, datos: DatosSesion, idUsuario: number): Promise<number> {
    try {
      const resultado = await pool.query<{ id_sesion: number; numero: number }>(
        `INSERT INTO sesiones (id_ticket, numero, tipo, fecha_hora, observaciones, monto, estado, id_usuario)
         VALUES ($1, $2, $3, $4, $5, $6, 'programado', $7)
         RETURNING id_sesion, numero`,
        [
          idTicket,
          datos.numero,
          datos.tipo,
          datos.fechaHora,
          datos.observaciones,
          datos.monto,
          idUsuario,
        ]
      );
      return resultado.rows[0].id_sesion;
    } catch (error) {
      throw traducirErrorBd(error);
    }
  }

  async actualizarSesion(id: number, datos: DatosSesionIngresados): Promise<boolean> {
    try {
      const resultado = await pool.query(
        `UPDATE sesiones
            SET fecha_hora = $2,
                observaciones = $3,
                monto = $4
          WHERE id_sesion = $1`,
        [id, datos.fechaHora, datos.observaciones, datos.monto]
      );
      return (resultado.rowCount ?? 0) > 0;
    } catch (error) {
      throw traducirErrorBd(error);
    }
  }

  async atenderSesion(
    id: number,
    idUsuario: number,
    datos: DatosAtencionSesion
  ): Promise<boolean> {
    try {
      const resultado = await pool.query(
        `UPDATE sesiones
            SET estado = 'atendido',
                id_usuario = $2,
                observaciones = COALESCE($3, observaciones),
                monto = COALESCE($4, monto)
          WHERE id_sesion = $1`,
        [id, idUsuario, datos.observaciones, datos.monto]
      );
      return (resultado.rowCount ?? 0) > 0;
    } catch (error) {
      throw traducirErrorBd(error);
    }
  }

  async cancelarSesion(id: number): Promise<boolean> {
    const resultado = await pool.query(
      `UPDATE sesiones SET estado = 'cancelado' WHERE id_sesion = $1`,
      [id]
    );
    return (resultado.rowCount ?? 0) > 0;
  }

  async eliminarSesion(id: number): Promise<boolean> {
    const resultado = await pool.query('DELETE FROM sesiones WHERE id_sesion = $1', [id]);
    return (resultado.rowCount ?? 0) > 0;
  }

  async contarSesionesProgramadas(idTicket: number): Promise<number> {
    const resultado = await pool.query<{ total: number }>(
      `SELECT COUNT(*)::int AS total FROM sesiones WHERE id_ticket = $1 AND estado = 'programado'`,
      [idTicket]
    );
    return resultado.rows[0].total;
  }

  async obtenerTotalesSesiones(
    idTicket: number
  ): Promise<{ limite: number; montoSesiones: number }> {
    const resultado = await pool.query<{ limite: string; monto_sesiones: string }>(
      `SELECT t.costo - t.descuento AS limite,
              COALESCE(SUM(s.monto), 0) AS monto_sesiones
         FROM tickets t
         LEFT JOIN sesiones s ON s.id_ticket = t.id_ticket
        WHERE t.id_ticket = $1
        GROUP BY t.costo, t.descuento`,
      [idTicket]
    );

    const fila = resultado.rows[0];
    return { limite: numero(fila.limite), montoSesiones: numero(fila.monto_sesiones) };
  }

  async obtenerUltimaSesion(idTicket: number): Promise<{ fechaHora: string; numero: number } | null> {
    const resultado = await pool.query<{ fecha_hora: Date; numero: number }>(
      `SELECT fecha_hora, numero
         FROM sesiones
        WHERE id_ticket = $1
        ORDER BY numero DESC
        LIMIT 1`,
      [idTicket]
    );
    const fila = resultado.rows[0];
    if (!fila) {
      return null;
    }
    return { fechaHora: fechaIso(fila.fecha_hora), numero: fila.numero };
  }

  private async construirAtencion(fila: AtencionFila): Promise<Atencion> {
    const sesiones = await this.listarSesiones(fila.id_ticket);
    const costo = numero(fila.costo);
    const descuento = numero(fila.descuento);
    const pagado = numero(fila.pagado);

    return {
      id: fila.id_ticket,
      idPaciente: fila.id_paciente,
      nombreCompletoPaciente: fila.nombre_completo_paciente,
      dniPaciente: fila.dni_paciente,
      idSucursal: fila.id_sucursal,
      nombreSucursal: fila.nombre_sucursal,
      idUsuario: fila.id_usuario,
      nombreMedico: fila.nombre_medico,
      fecha: fechaCorta(fila.fecha),
      hora: fila.hora_atencion,
      descripcion: fila.descripcion,
      costo,
      descuento,
      estado: fila.estado,
      sesiones,
      resumen: {
        costo,
        descuento,
        pagado,
        deuda: Number((costo - descuento - pagado).toFixed(2)),
      },
    };
  }

  private aSesion(fila: SesionFila): Sesion {
    return {
      id: fila.id_sesion,
      idTicket: fila.id_ticket,
      numero: fila.numero,
      tipo: fila.tipo,
      fechaHora: fechaIso(fila.fecha_hora),
      observaciones: fila.observaciones,
      monto: numero(fila.monto),
      estado: fila.estado,
      idUsuario: fila.id_usuario,
      nombreUsuario: fila.nombre_usuario,
    };
  }
}