import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, of, tap } from 'rxjs';
import {
  AdministradorSetup,
  EmpresaRegistro,
  EmpresaSetup,
  EstadoSetup,
  SucursalSetup,
} from '../models/setup.model';

const RUTA_SETUP = '/api/setup';
const ENCABEZADO_TOKEN = 'X-Setup-Token';

const ESTADO_COMPLETO: EstadoSetup = {
  empresa: true,
  sucursal: true,
  administrador: true,
  configurado: true,
};

@Injectable({ providedIn: 'root' })
export class SetupService {
  private readonly http = inject(HttpClient);
  private configuracionCompleta = false;

  /** Empresa vigente, compartida para que el layout refleje el logo al guardar. */
  private readonly empresaInterna = signal<EmpresaSetup | null>(null);
  readonly empresa = this.empresaInterna.asReadonly();

  obtenerEstado(): Observable<EstadoSetup> {
    if (this.configuracionCompleta) {
      return of(ESTADO_COMPLETO);
    }
    return this.http.get<EstadoSetup>(`${RUTA_SETUP}/estado`).pipe(
      tap((estado) => (this.configuracionCompleta = estado.configurado))
    );
  }

  registrarEmpresa(datos: EmpresaRegistro, token: string): Observable<EstadoSetup> {
    return this.http.post<EstadoSetup>(`${RUTA_SETUP}/empresa`, datos, this.opciones(token));
  }

  registrarSucursal(datos: SucursalSetup, token: string): Observable<EstadoSetup> {
    return this.http.post<EstadoSetup>(`${RUTA_SETUP}/sucursal`, datos, this.opciones(token));
  }

  registrarAdministrador(datos: AdministradorSetup, token: string): Observable<EstadoSetup> {
    return this.http.post<EstadoSetup>(`${RUTA_SETUP}/administrador`, datos, this.opciones(token));
  }

  /** Datos de la empresa ya registrada, para el modulo de configuracion. */
  obtenerEmpresa(): Observable<EmpresaSetup> {
    return this.http.get<EmpresaSetup>(`${RUTA_SETUP}/empresa`);
  }

  /** Carga la empresa y actualiza la señal compartida. Silencia el 404. */
  cargarEmpresa(): Observable<EmpresaSetup | null> {
    return this.obtenerEmpresa().pipe(
      tap((empresa) => this.empresaInterna.set(empresa)),
      catchError(() => {
        this.empresaInterna.set(null);
        return of(null);
      })
    );
  }

  /** Guarda los cambios de la empresa (incluido el logo) y refresca la señal. */
  actualizarEmpresa(datos: EmpresaSetup): Observable<EmpresaSetup> {
    return this.http.put<EmpresaSetup>(`${RUTA_SETUP}/empresa`, datos).pipe(
      tap((empresa) => this.empresaInterna.set(empresa))
    );
  }

  private opciones(token: string): { headers: Record<string, string> } {
    return { headers: { [ENCABEZADO_TOKEN]: token } };
  }
}