export type EstadoAtencion = 'borrador' | 'activo' | 'finalizado' | 'anulado';
export type EstadoSesion = 'programado' | 'atendido' | 'cancelado';
export type TipoSesion = 'primera' | 'sesion';

export interface Sesion {
  id: number;
  idTicket: number;
  numero: number;
  tipo: TipoSesion;
  fechaHora: string;
  observaciones: string | null;
  monto: number;
  estado: EstadoSesion;
  idUsuario: number | null;
  nombreUsuario: string | null;
}

/** Una sesion es una cita: se muestra con los datos del paciente y su atencion. */
export interface SesionCita {
  id: number;
  idTicket: number;
  numeroAtencion: number;
  estadoAtencion: EstadoAtencion;
  numero: number;
  tipo: TipoSesion;
  fechaHora: string;
  estado: EstadoSesion;
  idPaciente: number;
  nombreCompletoPaciente: string;
  dniPaciente: string;
  nombreMedico: string;
  nombreSucursal: string;
}

export interface FiltrosSesion {
  fecha?: string;
  desde?: string;
  hasta?: string;
}

/**
 * Dias con sesiones programadas, para marcar en el calendario.
 * Solo cuentan las que siguen pendientes: las atendidas y las canceladas ya
 * no son una cita por atender.
 */
export interface ResumenDia {
  fecha: string;
  total: number;
}

export interface ResumenCuenta {
  costo: number;
  descuento: number;
  pagado: number;
  deuda: number;
}

export interface Atencion {
  id: number;
  idPaciente: number;
  nombreCompletoPaciente: string;
  dniPaciente: string;
  idSucursal: number;
  nombreSucursal: string;
  idUsuario: number;
  nombreMedico: string;
  fecha: string;
  hora: string;
  descripcion: string | null;
  costo: number;
  descuento: number;
  estado: EstadoAtencion;
  sesiones: Sesion[];
  resumen: ResumenCuenta;
}

export interface DatosAtencion {
  idPaciente: number;
  idSucursal: number;
  idUsuario: number;
  fecha: string;
  hora: string;
  descripcion: string | null;
  costo: number;
  descuento: number;
}

export interface FiltrosAtencion {
  fecha?: string;
  idSucursal?: number;
  idUsuario?: number;
  idPaciente?: number;
  estado?: EstadoAtencion;
}

export interface DatosSesion {
  numero: number;
  tipo: TipoSesion;
  fechaHora: string;
  observaciones: string | null;
  monto: number;
}

/** Datos que ingresa el usuario; el numero y el tipo los calcula el sistema. */
export type DatosSesionIngresados = Omit<DatosSesion, 'numero' | 'tipo'>;

/**
 * Al atender una sesion se pueden corregir las observaciones y el monto, que
 * es cuando queda fijado lo que se cobro. Lo que no se envia se conserva.
 */
export interface DatosAtencionSesion {
  observaciones: string | null;
  monto: number | null;
}