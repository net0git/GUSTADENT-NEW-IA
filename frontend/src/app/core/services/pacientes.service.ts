import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

const RUTA_PACIENTES = '/api/pacientes';

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