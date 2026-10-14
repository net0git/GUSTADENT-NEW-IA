import {
  Atencion,
  DatosAtencion,
  DatosAtencionSesion,
  DatosSesion,
  DatosSesionIngresados,
  FiltrosAtencion,
  FiltrosSesion,
  ResumenDia,
  Sesion,
  SesionCita,
} from '../../domain/atencion';

export interface AtencionesRepository {
  listar(filtros: FiltrosAtencion): Promise<Atencion[]>;
  obtenerPorId(id: number): Promise<Atencion | null>;
  crear(datos: DatosAtencion): Promise<number>;
  actualizarDatos(id: number, datos: DatosAtencion): Promise<boolean>;
  cambiarEstado(id: number, estado: 'activo' | 'finalizado' | 'anulado'): Promise<boolean>;

  listarSesiones(idTicket: number): Promise<Sesion[]>;
  listarSesionesCitas(filtros: FiltrosSesion): Promise<SesionCita[]>;
  /** Dias del rango con sesiones programadas. */
  listarResumenCalendario(desde: string, hasta: string): Promise<ResumenDia[]>;
  obtenerSesion(id: number): Promise<Sesion | null>;
  crearSesion(idTicket: number, datos: DatosSesion, idUsuario: number): Promise<number>;
  actualizarSesion(id: number, datos: DatosSesionIngresados): Promise<boolean>;
  atenderSesion(id: number, idUsuario: number, datos: DatosAtencionSesion): Promise<boolean>;
  cancelarSesion(id: number): Promise<boolean>;
  eliminarSesion(id: number): Promise<boolean>;

  contarSesionesProgramadas(idTicket: number): Promise<number>;
  /** Limite a cobrar (costo menos descuento) y lo que ya suman las sesiones. */
  obtenerTotalesSesiones(idTicket: number): Promise<{ limite: number; montoSesiones: number }>;
  obtenerUltimaSesion(idTicket: number): Promise<{ fechaHora: string; numero: number } | null>;
}