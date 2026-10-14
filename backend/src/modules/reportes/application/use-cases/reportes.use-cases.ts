import { ReportesRepository } from '../ports/reportes.repository';
import {
  DeudaAtencion,
  DetalleDeuda,
  FilaCuentaCobrar,
  FiltrosReporte,
  FilaMensual,
  FilaProductividad,
  ReporteCuentasCobrar,
  ReporteSesiones,
  ResumenAtenciones,
} from '../../domain/reporte';

/** Tope de pacientes listados; el resto se sigue sumando en el total. */
const LIMITE_PACIENTES = 100;

/** Cifras globales de atenciones: cuantas se crearon, cuantas siguen abiertas y cuanto generaron. */
export class ResumenAtencionesUseCase {
  constructor(private readonly reportes: ReportesRepository) {}

  execute(filtros: FiltrosReporte): Promise<ResumenAtenciones> {
    return this.reportes.resumenAtenciones(filtros);
  }
}

/** Ingresos por sesion: cuantas se programaron, cuantas se atendieron y cuanto se facturo. */
export class IngresosPorSesionUseCase {
  constructor(private readonly reportes: ReportesRepository) {}

  execute(filtros: FiltrosReporte): Promise<ReporteSesiones> {
    return this.reportes.ingresosPorSesion(filtros);
  }
}

/** Productividad por odontologo: quien atendio mas sesiones y por cuanto monto. */
export class ProductividadPorOdontologoUseCase {
  constructor(private readonly reportes: ReportesRepository) {}

  execute(filtros: FiltrosReporte): Promise<FilaProductividad[]> {
    return this.reportes.productividad(filtros);
  }
}

/**
 * Cuentas por cobrar: es una foto del estado actual, por eso no recibe rango de
 * fechas. Solo se consideran atenciones vigentes; las anuladas no generan deuda.
 */
export class CuentasPorCobrarUseCase {
  constructor(private readonly reportes: ReportesRepository) {}

  async execute(idSucursal: number | null): Promise<ReporteCuentasCobrar> {
    const detalle = await this.reportes.cuentasPorCobrar(idSucursal);
    const porPaciente = new Map<number, FilaCuentaCobrar>();

    for (const atencion of detalle) {
      const fila = porPaciente.get(atencion.idPaciente);

      if (!fila) {
        porPaciente.set(atencion.idPaciente, this.nuevaFila(atencion));
        continue;
      }

      fila.atenciones += 1;
      fila.total += atencion.total;
      fila.pagado += atencion.pagado;
      fila.deuda += atencion.deuda;
      fila.detalle.push(this.aDetalle(atencion));
    }

    const filas = [...porPaciente.values()].sort((a, b) => b.deuda - a.deuda);

    return {
      totalPacientes: filas.length,
      totalDeuda: filas.reduce((suma, fila) => suma + fila.deuda, 0),
      filas: filas.slice(0, LIMITE_PACIENTES),
      truncado: filas.length > LIMITE_PACIENTES,
    };
  }

  private nuevaFila(atencion: DeudaAtencion): FilaCuentaCobrar {
    return {
      idPaciente: atencion.idPaciente,
      nombreCompleto: atencion.nombrePaciente,
      dni: atencion.dniPaciente,
      telefono: atencion.telefonoPaciente,
      atenciones: 1,
      total: atencion.total,
      pagado: atencion.pagado,
      deuda: atencion.deuda,
      detalle: [this.aDetalle(atencion)],
    };
  }

  private aDetalle(atencion: DeudaAtencion): DetalleDeuda {
    return {
      id: atencion.id,
      fecha: atencion.fecha,
      sucursal: atencion.sucursal,
      medico: atencion.medico,
      estado: atencion.estado,
      total: atencion.total,
      pagado: atencion.pagado,
      deuda: atencion.deuda,
    };
  }
}

/** Atenciones por mes: la evolucion del periodo, mes a mes. */
export class AtencionesPorMesUseCase {
  constructor(private readonly reportes: ReportesRepository) {}

  execute(filtros: FiltrosReporte): Promise<FilaMensual[]> {
    return this.reportes.atencionesPorMes(filtros);
  }
}