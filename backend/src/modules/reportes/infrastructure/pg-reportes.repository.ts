import { env } from '../../../config/env';
import { pool } from '../../../database/pool';
import { Perfil } from '../../auth/domain/usuario-autenticable';
import { ReportesRepository } from '../application/ports/reportes.repository';
import {
  DeudaAtencion,
  EstadoAtencion,
  FiltrosReporte,
  FilaMensual,
  FilaProductividad,
  FilaDia,
  ReporteSesiones,
  ResumenAtenciones,
  ResumenSesiones,
} from '../domain/reporte';

interface ResumenAtencionesFila {
  total: string;
  borrador: string;
  activo: string;
  finalizado: string;
  anulado: string;
  pacientes: string;
  costo: string;
  descuento: string;
  pagado: string;
  deuda: string;
}

interface ResumenSesionesFila {
  total: string;
  programadas: string;
  atendidas: string;
  canceladas: string;
  citas: string;
  continuaciones: string;
  monto_programado: string;
  monto_atendido: string;
}

interface DiaFila {
  fecha: string;
  total: string;
  atendidas: string;
  monto: string;
}

interface ProductividadFila {
  id_usuario: number;
  nombre: string;
  perfil: Perfil;
  total: string;
  programadas: string;
  atendidas: string;
  canceladas: string;
  pacientes: string;
  monto_atendido: string;
}

interface DeudaFila {
  id_ticket: number;
  id_paciente: number;
  nombre_paciente: string;
  dni_paciente: string;
  telefono_paciente: string | null;
  fecha: Date;
  nombre_sucursal: string;
  nombre_medico: string;
  estado: EstadoAtencion;
  total: string;
  pagado: string;
  deuda: string;
}

interface MensualFila {
  anio: number;
  mes: number;
  atenciones: string;
  finalizadas: string;
  sesiones: string;
  atendidas: string;
  monto: string;
  costo: string;
  deuda: string;
}

/** Zona en la que se cuentan los dias y meses de las sesiones. */
const ZONA = env.zonaHoraria;

/** Una atencion anulada no suma ni costo ni deuda. */
const ATENCIONES_VIGENTES = `t.estado <> 'anulado'`;

/**
 * La sesion se atribuye al odontologo responsable de la atencion, que es el
 * mismo medico que muestra el resto del sistema. El usuario que registro o
 * atendio la sesion puede ser recepcion o el propio administrador.
 */
const MEDICO_DE_LA_SESION = `t.id_usuario`;

/**
 * Filtros del rango. Se repiten en cada consulta porque cada reporte cuenta
 * cosas distintas: las atenciones por su fecha de creacion y las sesiones por
 * la fecha en que ocurren.
 */
const FILTROS_ATENCION = `
  WHERE t.fecha BETWEEN $1::date AND $2::date
    AND ($3::int IS NULL OR t.id_sucursal = $3)
    AND ($4::int IS NULL OR t.id_usuario = $4)`;

const FILTROS_SESION = `
  WHERE (s.fecha_hora AT TIME ZONE $5)::date BETWEEN $1::date AND $2::date
    AND ${ATENCIONES_VIGENTES}
    AND ($3::int IS NULL OR t.id_sucursal = $3)
    AND ($4::int IS NULL OR ${MEDICO_DE_LA_SESION} = $4)`;

const COLUMNAS_SESION = `
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE s.estado = 'programado')  AS programadas,
  COUNT(*) FILTER (WHERE s.estado = 'atendido')   AS atendidas,
  COUNT(*) FILTER (WHERE s.estado = 'cancelado')  AS canceladas,
  COUNT(*) FILTER (WHERE s.tipo = 'primera')      AS citas,
  COUNT(*) FILTER (WHERE s.tipo = 'sesion')       AS continuaciones`;

const CONTEO_DE_SESIONES = `
  FROM sesiones s
  JOIN tickets t ON t.id_ticket = s.id_ticket
  ${FILTROS_SESION}`;

function numero(valor: string | number): number {
  return typeof valor === 'number' ? valor : Number(valor);
}

function decimales(valor: string): number {
  return Math.round(Number(valor) * 100) / 100;
}

function fechaCorta(valor: Date): string {
  const fecha = new Date(valor);
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

function parametros(filtros: FiltrosReporte): unknown[] {
  return [filtros.desde, filtros.hasta, filtros.idSucursal, filtros.idUsuario, ZONA];
}

export class PgReportesRepository implements ReportesRepository {
  async resumenAtenciones(filtros: FiltrosReporte): Promise<ResumenAtenciones> {
    const resultado = await pool.query<ResumenAtencionesFila>(
      `SELECT
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE t.estado = 'borrador')   AS borrador,
         COUNT(*) FILTER (WHERE t.estado = 'activo')     AS activo,
         COUNT(*) FILTER (WHERE t.estado = 'finalizado') AS finalizado,
         COUNT(*) FILTER (WHERE t.estado = 'anulado')    AS anulado,
         COUNT(DISTINCT t.id_paciente)                   AS pacientes,
         COALESCE(SUM(r.costo)     FILTER (WHERE ${ATENCIONES_VIGENTES}), 0) AS costo,
         COALESCE(SUM(r.descuento) FILTER (WHERE ${ATENCIONES_VIGENTES}), 0) AS descuento,
         COALESCE(SUM(r.pagado)    FILTER (WHERE ${ATENCIONES_VIGENTES}), 0) AS pagado,
         COALESCE(SUM(r.deuda)     FILTER (WHERE ${ATENCIONES_VIGENTES}), 0) AS deuda
       FROM tickets t
       LEFT JOIN v_resumen_ticket r ON r.id_ticket = t.id_ticket
       ${FILTROS_ATENCION}`,
      [filtros.desde, filtros.hasta, filtros.idSucursal, filtros.idUsuario]
    );

    const fila = resultado.rows[0];

    return {
      total: numero(fila.total),
      borrador: numero(fila.borrador),
      activo: numero(fila.activo),
      finalizado: numero(fila.finalizado),
      anulado: numero(fila.anulado),
      pacientes: numero(fila.pacientes),
      costo: decimales(fila.costo),
      descuento: decimales(fila.descuento),
      pagado: decimales(fila.pagado),
      deuda: decimales(fila.deuda),
    };
  }

  async ingresosPorSesion(filtros: FiltrosReporte): Promise<ReporteSesiones> {
    const [resumen, porDia] = await Promise.all([
      this.resumenSesiones(filtros),
      this.sesionesPorDia(filtros),
    ]);

    return { resumen, porDia };
  }

  /** Un dia por dia del rango, aunque no haya tenido sesiones. */
  private async sesionesPorDia(filtros: FiltrosReporte): Promise<FilaDia[]> {
    const resultado = await pool.query<DiaFila>(
      `WITH dias AS (
         SELECT dia::date AS dia
           FROM generate_series($1::date, $2::date, interval '1 day') AS dia
       ),
       datos AS (
         SELECT (s.fecha_hora AT TIME ZONE $5)::date AS dia,
                ${COLUMNAS_SESION},
                COALESCE(SUM(s.monto) FILTER (WHERE s.estado <> 'cancelado'), 0) AS monto
           ${CONTEO_DE_SESIONES}
          GROUP BY 1
       )
       SELECT d.dia::text AS fecha,
              COALESCE(x.total, 0)     AS total,
              COALESCE(x.atendidas, 0) AS atendidas,
              COALESCE(x.monto, 0)     AS monto
         FROM dias d
         LEFT JOIN datos x ON x.dia = d.dia
        ORDER BY d.dia`,
      parametros(filtros)
    );

    return resultado.rows.map((fila) => ({
      fecha: fila.fecha,
      total: numero(fila.total),
      atendidas: numero(fila.atendidas),
      monto: decimales(fila.monto),
    }));
  }

  private async resumenSesiones(filtros: FiltrosReporte): Promise<ResumenSesiones> {
    const resultado = await pool.query<ResumenSesionesFila>(
      `SELECT
         ${COLUMNAS_SESION},
         COALESCE(SUM(s.monto) FILTER (WHERE s.estado = 'programado'), 0) AS monto_programado,
         COALESCE(SUM(s.monto) FILTER (WHERE s.estado = 'atendido'), 0)  AS monto_atendido
       ${CONTEO_DE_SESIONES}`,
      parametros(filtros)
    );

    const fila = resultado.rows[0];

    return {
      total: numero(fila.total),
      programadas: numero(fila.programadas),
      atendidas: numero(fila.atendidas),
      canceladas: numero(fila.canceladas),
      citas: numero(fila.citas),
      continuaciones: numero(fila.continuaciones),
      montoProgramado: decimales(fila.monto_programado),
      montoAtendido: decimales(fila.monto_atendido),
    };
  }

  async productividad(filtros: FiltrosReporte): Promise<FilaProductividad[]> {
    const resultado = await pool.query<ProductividadFila>(
      `SELECT
         u.id_usuario           AS id_usuario,
         u.nombre_completo     AS nombre,
         u.perfil              AS perfil,
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE s.estado = 'programado') AS programadas,
         COUNT(*) FILTER (WHERE s.estado = 'atendido')  AS atendidas,
         COUNT(*) FILTER (WHERE s.estado = 'cancelado') AS canceladas,
         COUNT(DISTINCT t.id_paciente)                   AS pacientes,
         COALESCE(SUM(s.monto) FILTER (WHERE s.estado = 'atendido'), 0) AS monto_atendido
       FROM sesiones s
       JOIN tickets t ON t.id_ticket = s.id_ticket
       JOIN usuarios u ON u.id_usuario = ${MEDICO_DE_LA_SESION}
       ${FILTROS_SESION}
       GROUP BY u.id_usuario, u.nombre_completo, u.perfil
       ORDER BY monto_atendido DESC, atendidas DESC, u.nombre_completo`,
      parametros(filtros)
    );

    return resultado.rows.map((fila) => {
      const atendidas = numero(fila.atendidas);
      const montoAtendido = decimales(fila.monto_atendido);

      return {
        idUsuario: fila.id_usuario,
        nombre: fila.nombre,
        perfil: fila.perfil,
        total: numero(fila.total),
        programadas: numero(fila.programadas),
        atendidas,
        canceladas: numero(fila.canceladas),
        pacientes: numero(fila.pacientes),
        montoAtendido,
        promedio: atendidas === 0 ? 0 : Math.round((montoAtendido / atendidas) * 100) / 100,
      };
    });
  }

  async cuentasPorCobrar(idSucursal: number | null): Promise<DeudaAtencion[]> {
    const resultado = await pool.query<DeudaFila>(
      `SELECT
         t.id_ticket,
         t.id_paciente,
         TRIM(CONCAT(p.nombres, ' ', p.ap_paterno, ' ', COALESCE(p.ap_materno, ''))) AS nombre_paciente,
         p.dni     AS dni_paciente,
         p.telefono AS telefono_paciente,
         t.fecha,
         sc.nombre AS nombre_sucursal,
         u.nombre_completo AS nombre_medico,
         t.estado,
         t.costo - t.descuento AS total,
         COALESCE(r.pagado, 0) AS pagado,
         COALESCE(r.deuda, t.costo - t.descuento) AS deuda
       FROM tickets t
       JOIN pacientes p  ON p.id_paciente = t.id_paciente
       JOIN sucursales sc ON sc.id_sucursal = t.id_sucursal
       JOIN usuarios u   ON u.id_usuario = t.id_usuario
       LEFT JOIN v_resumen_ticket r ON r.id_ticket = t.id_ticket
       WHERE ${ATENCIONES_VIGENTES}
         AND ($1::int IS NULL OR t.id_sucursal = $1)
         AND COALESCE(r.deuda, t.costo - t.descuento) > 0
       ORDER BY t.id_paciente, t.fecha DESC`,
      [idSucursal]
    );

    return resultado.rows.map((fila) => ({
      id: fila.id_ticket,
      idPaciente: fila.id_paciente,
      nombrePaciente: fila.nombre_paciente,
      dniPaciente: fila.dni_paciente,
      telefonoPaciente: fila.telefono_paciente,
      fecha: fechaCorta(fila.fecha),
      sucursal: fila.nombre_sucursal,
      medico: fila.nombre_medico,
      estado: fila.estado,
      total: decimales(fila.total),
      pagado: decimales(fila.pagado),
      deuda: decimales(fila.deuda),
    }));
  }

  async atencionesPorMes(filtros: FiltrosReporte): Promise<FilaMensual[]> {
    const resultado = await pool.query<MensualFila>(
      `WITH meses AS (
         SELECT mes::date AS mes
           FROM generate_series(
                  date_trunc('month', $1::date)::date,
                  date_trunc('month', $2::date)::date,
                  interval '1 month'
                ) AS mes
       ),
       atenciones AS (
         SELECT date_trunc('month', t.fecha)::date AS mes,
                COUNT(*) AS cantidad,
                COUNT(*) FILTER (WHERE t.estado = 'finalizado') AS finalizadas,
                COALESCE(SUM(r.costo)     FILTER (WHERE ${ATENCIONES_VIGENTES}), 0) AS costo,
                COALESCE(SUM(r.pagado)    FILTER (WHERE ${ATENCIONES_VIGENTES}), 0) AS monto,
                COALESCE(SUM(r.deuda)     FILTER (WHERE ${ATENCIONES_VIGENTES}), 0) AS deuda
           FROM tickets t
           LEFT JOIN v_resumen_ticket r ON r.id_ticket = t.id_ticket
           ${FILTROS_ATENCION}
           GROUP BY 1
       ),
       sesiones AS (
         SELECT date_trunc('month', (s.fecha_hora AT TIME ZONE $5))::date AS mes,
                COUNT(*) AS cantidad,
                COUNT(*) FILTER (WHERE s.estado = 'atendido') AS atendidas
           FROM sesiones s
           JOIN tickets t ON t.id_ticket = s.id_ticket
           ${FILTROS_SESION}
           GROUP BY 1
       )
       SELECT EXTRACT(YEAR FROM m.mes)::int AS anio,
              EXTRACT(MONTH FROM m.mes)::int AS mes,
              COALESCE(a.cantidad, 0)   AS atenciones,
              COALESCE(a.finalizadas, 0) AS finalizadas,
              COALESCE(s.cantidad, 0)   AS sesiones,
              COALESCE(s.atendidas, 0)  AS atendidas,
              COALESCE(a.monto, 0)      AS monto,
              COALESCE(a.costo, 0)      AS costo,
              COALESCE(a.deuda, 0)      AS deuda
         FROM meses m
         LEFT JOIN atenciones a ON a.mes = m.mes
         LEFT JOIN sesiones  s ON s.mes = m.mes
        ORDER BY m.mes`,
      parametros(filtros)
    );

    return resultado.rows.map((fila) => ({
      anio: fila.anio,
      mes: fila.mes,
      atenciones: numero(fila.atenciones),
      finalizadas: numero(fila.finalizadas),
      sesiones: numero(fila.sesiones),
      atendidas: numero(fila.atendidas),
      monto: decimales(fila.monto),
      costo: decimales(fila.costo),
      deuda: decimales(fila.deuda),
    }));
  }
}