import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  DatosUsuario,
  FiltrosUsuario,
  NuevoUsuario,
  Usuario,
} from '../models/usuario.model';
import { Sucursal } from '../models/catalogo.model';

const RUTA_USUARIOS = '/api/usuarios';
const RUTA_SUCURSALES = '/api/sucursales';

export interface Odontologo {
  id: number;
  nombreCompleto: string;
  especialidad: string | null;
}

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly http = inject(HttpClient);

  listar(filtros: FiltrosUsuario): Observable<Usuario[]> {
    let parametros = new HttpParams();
    if (filtros.perfil) {
      parametros = parametros.set('perfil', filtros.perfil);
    }
    if (filtros.activo !== undefined) {
      parametros = parametros.set('activo', String(filtros.activo));
    }
    return this.http.get<Usuario[]>(RUTA_USUARIOS, { params: parametros });
  }

  obtener(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${RUTA_USUARIOS}/${id}`);
  }

  crear(datos: NuevoUsuario): Observable<Usuario> {
    return this.http.post<Usuario>(RUTA_USUARIOS, datos);
  }

  actualizar(id: number, datos: DatosUsuario): Observable<Usuario> {
    return this.http.put<Usuario>(`${RUTA_USUARIOS}/${id}`, datos);
  }

  resetearPassword(id: number): Observable<{ passwordTemporal: string; username: string }> {
    return this.http.post<{ passwordTemporal: string; username: string }>(
      `${RUTA_USUARIOS}/${id}/resetear-password`,
      null
    );
  }

  cambiarEstado(id: number, activo: boolean): Observable<Usuario> {
    return this.http.patch<Usuario>(`${RUTA_USUARIOS}/${id}/estado`, { activo });
  }

  asignarSucursales(id: number, sucursales: number[]): Observable<Usuario> {
    return this.http.put<Usuario>(`${RUTA_USUARIOS}/${id}/sucursales`, { sucursales });
  }

  listarSucursales(): Observable<Sucursal[]> {
    return this.http.get<Sucursal[]>(RUTA_SUCURSALES);
  }

  listarOdontologos(): Observable<Odontologo[]> {
    return this.http.get<Odontologo[]>('/api/usuarios/odontologos');
  }
}
