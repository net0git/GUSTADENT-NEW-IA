import {
  DeudaAtencion,
  FiltrosReporte,
  FilaMensual,
  FilaProductividad,
  ReporteSesiones,
  ResumenAtenciones,
} from '../../domain/reporte';

export interface ReportesRepository {
  resumenAtenciones(filtros: FiltrosReporte): Promise<ResumenAtenciones>;
  ingresosPorSesion(filtros: FiltrosReporte): Promise<ReporteSesiones>;
  productividad(filtros: FiltrosReporte): Promise<FilaProductividad[]>;
  /** Atenciones con deuda pendiente, agrupadas por paciente. */
  cuentasPorCobrar(idSucursal: number | null): Promise<DeudaAtencion[]>;
  atencionesPorMes(filtros: FiltrosReporte): Promise<FilaMensual[]>;
}