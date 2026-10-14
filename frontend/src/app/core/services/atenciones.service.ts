import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';

const RUTA_ATENCIONES = '/api/atenciones';
const RUTA_SESIONES = '/api/sesiones';

export type EstadoAtencion = 'borrador' | 'activo' | 'finalizado' | 'anulado';
export type EstadoSesion = 'programado' | 'atendido' | 'cancelado';
export type TipoSesion = 'primera' | 'sesion';

export const ETIQUETAS_ESTADO_ATENCION: Record<EstadoAtencion, string> = {
  borrador: 'Borrador',
  activo: 'Activa',
  finalizado: 'Finalizada',
  anulado: 'Anulada',
};

export const ETIQUETAS_ESTADO_SESION: Record<EstadoSesion, string> = {
  programado: 'Programado',
  atendido: 'Atendido',
  cancelado: 'Cancelado',
};

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
  descripcion: string | null;
  costo: number;
  descuento: number;
  estado: EstadoAtencion;
  hora: string;
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

export interface DatosSesion {
  fechaHora: string;
  observaciones: string | null;
  monto: number;
}

/** Al atender se corrigen las observaciones y el monto de la sesion. */
export interface DatosAtencionSesion {
  observaciones: string | null;
  monto: number;
}

export interface FiltrosAtencion {
  fecha?: string;
  sucursal?: number;
  medico?: number;
  paciente?: number;
  estado?: EstadoAtencion;
}

/** Cada sesion es una cita concreta y se lista junto a su atencion. */
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

/** Dia con citas pendientes, para marcar en el calendario. */
export interface ResumenDia {
  fecha: string;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class AtencionesService {
  private readonly http = inject(HttpClient);

  /** Se dispara cuando una sesion se crea, cambia o se elimina. */
  private readonly cambios = new Subject<void>();
  readonly sesionesModificadas = this.cambios.asObservable();

  /** Avisa al calendario que los dias marcados ya no son los mismos. */
  notificarCalendario(): void {
    this.cambios.next();
  }

  listar(filtros: FiltrosAtencion): Observable<Atencion[]> {
    let parametros = new HttpParams();
    if (filtros.fecha) parametros = parametros.set('fecha', filtros.fecha);
    if (filtros.sucursal) parametros = parametros.set('sucursal', String(filtros.sucursal));
    if (filtros.medico) parametros = parametros.set('medico', String(filtros.medico));
    if (filtros.paciente) parametros = parametros.set('paciente', String(filtros.paciente));
    if (filtros.estado) parametros = parametros.set('estado', filtros.estado);
    return this.http.get<Atencion[]>(RUTA_ATENCIONES, { params: parametros });
  }

  obtener(id: number): Observable<Atencion> {
    return this.http.get<Atencion>(`${RUTA_ATENCIONES}/${id}`);
  }

  crear(datos: DatosAtencion): Observable<Atencion> {
    return this.http.post<Atencion>(RUTA_ATENCIONES, datos);
  }

  guardarBorrador(id: number, datos: DatosAtencion): Observable<Atencion> {
    return this.http.put<Atencion>(`${RUTA_ATENCIONES}/${id}`, datos);
  }

  activar(id: number): Observable<Atencion> {
    return this.http.post<Atencion>(`${RUTA_ATENCIONES}/${id}/activar`, null);
  }

  finalizar(id: number): Observable<Atencion> {
    return this.http.post<Atencion>(`${RUTA_ATENCIONES}/${id}/finalizar`, null);
  }

  anular(id: number): Observable<Atencion> {
    return this.http.post<Atencion>(`${RUTA_ATENCIONES}/${id}/anular`, null);
  }

  crearSesion(idTicket: number, datos: DatosSesion): Observable<Sesion> {
    return this.http.post<Sesion>(`${RUTA_ATENCIONES}/${idTicket}/sesiones`, datos);
  }

  listarCitas(filtros: { fecha?: string; desde?: string; hasta?: string }): Observable<SesionCita[]> {
    let parametros = new HttpParams();
    if (filtros.fecha) parametros = parametros.set('fecha', filtros.fecha);
    if (filtros.desde) parametros = parametros.set('desde', filtros.desde);
    if (filtros.hasta) parametros = parametros.set('hasta', filtros.hasta);
    return this.http.get<SesionCita[]>(RUTA_SESIONES, { params: parametros });
  }

  /** Dias del rango con sesiones programadas; el calendario los marca. */
  resumenCalendario(desde: string, hasta: string): Observable<ResumenDia[]> {
    const parametros = new HttpParams().set('desde', desde).set('hasta', hasta);
    return this.http.get<ResumenDia[]>(`${RUTA_SESIONES}/calendario`, { params: parametros });
  }

  actualizarSesion(id: number, datos: DatosSesion): Observable<Sesion> {
    return this.http.put<Sesion>(`${RUTA_SESIONES}/${id}`, datos);
  }

  atenderSesion(id: number, datos: DatosAtencionSesion): Observable<Sesion> {
    return this.http.post<Sesion>(`${RUTA_SESIONES}/${id}/atender`, datos);
  }

  cancelarSesion(id: number): Observable<Sesion> {
    return this.http.post<Sesion>(`${RUTA_SESIONES}/${id}/cancelar`, null);
  }

  eliminarSesion(id: number): Observable<void> {
    return this.http.delete<void>(`${RUTA_SESIONES}/${id}`);
  }
}