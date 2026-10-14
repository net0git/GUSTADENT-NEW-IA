import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import {
  AdministradorSetup,
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

  obtenerEstado(): Observable<EstadoSetup> {
    if (this.configuracionCompleta) {
      return of(ESTADO_COMPLETO);
    }
    return this.http.get<EstadoSetup>(`${RUTA_SETUP}/estado`).pipe(
      tap((estado) => (this.configuracionCompleta = estado.configurado))
    );
  }

  registrarEmpresa(datos: EmpresaSetup, token: string): Observable<EstadoSetup> {
    return this.http.post<EstadoSetup>(`${RUTA_SETUP}/empresa`, datos, this.opciones(token));
  }

  registrarSucursal(datos: SucursalSetup, token: string): Observable<EstadoSetup> {
    return this.http.post<EstadoSetup>(`${RUTA_SETUP}/sucursal`, datos, this.opciones(token));
  }

  registrarAdministrador(datos: AdministradorSetup, token: string): Observable<EstadoSetup> {
    return this.http.post<EstadoSetup>(`${RUTA_SETUP}/administrador`, datos, this.opciones(token));
  }

  private opciones(token: string): { headers: Record<string, string> } {
    return { headers: { [ENCABEZADO_TOKEN]: token } };
  }
}
