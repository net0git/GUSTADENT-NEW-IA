import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

const RUTA_PACIENTES = '/api/pacientes';
const RUTA_CONDICIONES = '/api/condiciones';

export interface Paciente {
  id: number;
  dni: string;
  nombres: string;
  apPaterno: string;
  apMaterno: string | null;
  fechaNacimiento: string | null;
  sexo: 'M' | 'F' | null;
  telefono: string | null;
  idProcedencia: number | null;
  procedencia: string | null;
  nombreCompleto: string;
}

export interface DatosPaciente {
  dni: string;
  nombres: string;
  apPaterno: string;
  apMaterno: string | null;
  fechaNacimiento: string | null;
  sexo: 'M' | 'F' | null;
  telefono: string | null;
  idProcedencia: number | null;
}

/** Una condicion del paciente: lo que hay que saber antes de atenderlo. */
export interface CondicionPaciente {
  id: number;
  descripcion: string;
  activo: boolean;
  idAtencionAlta: number | null;
  idUsuario: number | null;
  nombreUsuario: string | null;
}

@Injectable({ providedIn: 'root' })
export class PacientesService {
  private readonly http = inject(HttpClient);

  listar(terminoBusqueda: string | null): Observable<Paciente[]> {
    let parametros = new HttpParams();
    if (terminoBusqueda) {
      parametros = parametros.set('buscar', terminoBusqueda);
    }
    return this.http.get<Paciente[]>(RUTA_PACIENTES, { params: parametros });
  }

  condiciones(idPaciente: number, soloActivas = true): Observable<CondicionPaciente[]> {
    const parametros = new HttpParams().set('activas', String(soloActivas));
    return this.http.get<CondicionPaciente[]>(`${RUTA_PACIENTES}/${idPaciente}/condiciones`, {
      params: parametros,
    });
  }

  crearCondicion(
    idPaciente: number,
    descripcion: string,
    idAtencionAlta?: number | null
  ): Observable<CondicionPaciente> {
    return this.http.post<CondicionPaciente>(`${RUTA_PACIENTES}/${idPaciente}/condiciones`, {
      descripcion,
      idAtencionAlta: idAtencionAlta ?? null,
    });
  }

  actualizarCondicion(id: number, descripcion: string): Observable<CondicionPaciente> {
    return this.http.put<CondicionPaciente>(`${RUTA_CONDICIONES}/${id}`, { descripcion });
  }

  cambiarEstadoCondicion(id: number, activo: boolean): Observable<CondicionPaciente> {
    return this.http.post<CondicionPaciente>(`${RUTA_CONDICIONES}/${id}/estado`, { activo });
  }

  obtener(id: number): Observable<Paciente> {
    return this.http.get<Paciente>(`${RUTA_PACIENTES}/${id}`);
  }

  crear(datos: DatosPaciente): Observable<Paciente> {
    return this.http.post<Paciente>(RUTA_PACIENTES, datos);
  }

  actualizar(id: number, datos: DatosPaciente): Observable<Paciente> {
    return this.http.put<Paciente>(`${RUTA_PACIENTES}/${id}`, datos);
  }
}