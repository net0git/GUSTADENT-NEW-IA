import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { EstadoAtencion } from './atenciones.service';
import { UsuarioSesion } from './auth.service';

const RUTA_REPORTES = '/api/reportes';

/** El perfil lo devuelve el backend como administrador, odontologo o recepcion. */
type Perfil = UsuarioSesion['perfil'];

export interface FiltrosReporte {
  desde: string;
  hasta: string;
  sucursal?: number;
  medico?: number;
}

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

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private readonly http = inject(HttpClient);

  resumenAtenciones(filtros: FiltrosReporte): Observable<ResumenAtenciones> {
    return this.http.get<ResumenAtenciones>(`${RUTA_REPORTES}/atenciones`, {
      params: this.parametros(filtros),
    });
  }

  ingresosPorSesion(filtros: FiltrosReporte): Observable<ReporteSesiones> {
    return this.http.get<ReporteSesiones>(`${RUTA_REPORTES}/ingresos-sesiones`, {
      params: this.parametros(filtros),
    });
  }

  productividad(filtros: FiltrosReporte): Observable<FilaProductividad[]> {
    return this.http.get<FilaProductividad[]>(`${RUTA_REPORTES}/productividad`, {
      params: this.parametros(filtros),
    });
  }

  cuentasPorCobrar(sucursal?: number): Observable<ReporteCuentasCobrar> {
    let parametros = new HttpParams();
    if (sucursal) {
      parametros = parametros.set('sucursal', String(sucursal));
    }
    return this.http.get<ReporteCuentasCobrar>(`${RUTA_REPORTES}/cuentas-por-cobrar`, {
      params: parametros,
    });
  }

  atencionesPorMes(filtros: FiltrosReporte): Observable<FilaMensual[]> {
    return this.http.get<FilaMensual[]>(`${RUTA_REPORTES}/atenciones-por-mes`, {
      params: this.parametros(filtros),
    });
  }

  private parametros(filtros: FiltrosReporte): HttpParams {
    let parametros = new HttpParams().set('desde', filtros.desde).set('hasta', filtros.hasta);
    if (filtros.sucursal) {
      parametros = parametros.set('sucursal', String(filtros.sucursal));
    }
    if (filtros.medico) {
      parametros = parametros.set('medico', String(filtros.medico));
    }
    return parametros;
  }
}