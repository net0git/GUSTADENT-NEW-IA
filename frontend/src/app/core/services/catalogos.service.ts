import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { EntradaCatalogo, Procedencia, Sucursal } from '../models/catalogo.model';

export type { EntradaCatalogo, ItemCatalogo, Procedencia, Sucursal } from '../models/catalogo.model';

@Injectable({ providedIn: 'root' })
export class CatalogosService {
  private readonly http = inject(HttpClient);

  listarSucursales(soloActivas = true): Observable<Sucursal[]> {
    return this.listar<Sucursal>('sucursales', soloActivas);
  }

  crearSucursal(datos: EntradaCatalogo): Observable<Sucursal> {
    return this.http.post<Sucursal>('/api/sucursales', {
      nombre: datos.nombre,
      direccion: datos.direccion || null,
    });
  }

  actualizarSucursal(id: number, datos: EntradaCatalogo): Observable<Sucursal> {
    return this.http.put<Sucursal>(`/api/sucursales/${id}`, {
      nombre: datos.nombre,
      direccion: datos.direccion || null,
    });
  }

  cambiarEstadoSucursal(id: number, activo: boolean): Observable<Sucursal> {
    return this.http.patch<Sucursal>(`/api/sucursales/${id}/estado`, { activo });
  }

  listarProcedencias(soloActivas = true): Observable<Procedencia[]> {
    return this.listar<Procedencia>('procedencias', soloActivas);
  }

  crearProcedencia(datos: EntradaCatalogo): Observable<Procedencia> {
    return this.http.post<Procedencia>('/api/procedencias', { nombre: datos.nombre });
  }

  actualizarProcedencia(id: number, datos: EntradaCatalogo): Observable<Procedencia> {
    return this.http.put<Procedencia>(`/api/procedencias/${id}`, { nombre: datos.nombre });
  }

  cambiarEstadoProcedencia(id: number, activo: boolean): Observable<Procedencia> {
    return this.http.patch<Procedencia>(`/api/procedencias/${id}/estado`, { activo });
  }

  private listar<T>(recurso: string, soloActivas: boolean): Observable<T[]> {
    let parametros = new HttpParams();
    if (!soloActivas) {
      parametros = parametros.set('soloActivas', 'false');
    }
    return this.http.get<T[]>(`/api/${recurso}`, { params: parametros });
  }
}