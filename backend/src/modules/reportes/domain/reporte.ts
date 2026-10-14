import { EstadoAtencion } from '../../atenciones/domain/atencion';
import { Perfil } from '../../auth/domain/usuario-autenticable';

export { EstadoAtencion };

/** Rango de fechas y filtros opcionales comunes a los reportes. */
export interface FiltrosReporte {
  desde: string;
  hasta: string;
  idSucursal: number | null;
  idUsuario: number | null;
}

/** Cifras globales de las atenciones creadas en el periodo. */
export interface ResumenAtenciones {
  total: number;
  borrador: number;
  activo: number;
  finalizado: number;
  anulado: number;
  pacientes: number;
  costo: number;
  descuento: number;
  pagado: number;
  deuda: number;
}

/** Conteos y montos de las sesiones programadas en el periodo. */
export interface ResumenSesiones {
  total: number;
  programadas: number;
  atendidas: number;
  canceladas: number;
  citas: number;
  continuaciones: number;
  montoProgramado: number;
  montoAtendido: number;
}

/** Una fila por dia, incluso si ese dia no tuvo sesiones. */
export interface FilaDia {
  fecha: string;
  total: number;
  atendidas: number;
  monto: number;
}

export interface ReporteSesiones {
  resumen: ResumenSesiones;
  porDia: FilaDia[];
}

/** Una fila por odontologo con su carga de sesiones en el periodo. */
export interface FilaProductividad {
  idUsuario: number;
  nombre: string;
  perfil: Perfil;
  total: number;
  programadas: number;
  atendidas: number;
  canceladas: number;
  pacientes: number;
  montoAtendido: number;
  promedio: number;
}

/** Una atencion vigente que todavia suma deuda a un paciente. */
export interface DetalleDeuda {
  id: number;
  fecha: string;
  sucursal: string;
  medico: string;
  estado: EstadoAtencion;
  total: number;
  pagado: number;
  deuda: number;
}

/** La misma atencion, con los datos del paciente para poder agruparla. */
export interface DeudaAtencion extends DetalleDeuda {
  idPaciente: number;
  nombrePaciente: string;
  dniPaciente: string;
  telefonoPaciente: string | null;
}

/** Deuda acumulada de un paciente, con el detalle de sus atenciones. */
export interface FilaCuentaCobrar {
  idPaciente: number;
  nombreCompleto: string;
  dni: string;
  telefono: string | null;
  atenciones: number;
  total: number;
  pagado: number;
  deuda: number;
  detalle: DetalleDeuda[];
}

export interface ReporteCuentasCobrar {
  totalPacientes: number;
  totalDeuda: number;
  filas: FilaCuentaCobrar[];
  truncado: boolean;
}

/** Una fila por mes del periodo, incluso si ese mes no registro atenciones. */
export interface FilaMensual {
  anio: number;
  mes: number;
  atenciones: number;
  finalizadas: number;
  sesiones: number;
  atendidas: number;
  monto: number;
  costo: number;
  deuda: number;
}