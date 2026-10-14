import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, finalize, map, tap } from 'rxjs';

export interface UsuarioSesion {
  id: number;
  username: string;
  nombreCompleto: string;
  perfil: 'administrador' | 'odontologo' | 'recepcion';
}

interface RespuestaLogin {
  token: string;
  usuario: UsuarioSesion;
}

const CLAVE_TOKEN = 'gustadent.token';
const CLAVE_USUARIO = 'gustadent.usuario';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  iniciarSesion(username: string, password: string): Observable<UsuarioSesion> {
    return this.http.post<RespuestaLogin>('/api/auth/login', { username, password }).pipe(
      tap((respuesta) => {
        localStorage.setItem(CLAVE_TOKEN, respuesta.token);
        localStorage.setItem(CLAVE_USUARIO, JSON.stringify(respuesta.usuario));
      }),
      map((respuesta) => respuesta.usuario)
    );
  }

  cerrarSesion(): Observable<unknown> {
    return this.http.post('/api/auth/logout', null).pipe(finalize(() => this.limpiarSesion()));
  }

  obtenerToken(): string | null {
    return localStorage.getItem(CLAVE_TOKEN);
  }

  obtenerUsuario(): UsuarioSesion | null {
    const guardado = localStorage.getItem(CLAVE_USUARIO);
    return guardado ? (JSON.parse(guardado) as UsuarioSesion) : null;
  }

  /**
   * Cambiar la contraseña cierra las sesiones del usuario, pero solo cuando el
   * cambio se aplico de verdad: si falla, la sesion actual sigue vigente.
   */
  cambiarPassword(passwordActual: string, passwordNueva: string): Observable<void> {
    return this.http.put<void>('/api/auth/password', { passwordActual, passwordNueva });
  }

  limpiarSesion(): void {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_USUARIO);
  }
}
