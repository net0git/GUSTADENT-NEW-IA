export type Sexo = 'M' | 'F';

export interface Paciente {
  id: number;
  dni: string;
  nombres: string;
  apPaterno: string;
  apMaterno: string | null;
  fechaNacimiento: string | null;
  sexo: Sexo | null;
  telefono: string | null;
  idProcedencia: number | null;
  procedencia: string | null;
  nombreCompleto: string;
}

/**
 * Una condicion del paciente: texto libre con lo que hay que saber antes de
 * atenderlo. Quitar no borra, solo la desactiva.
 */
export interface CondicionPaciente {
  id: number;
  descripcion: string;
  activo: boolean;
  idAtencionAlta: number | null;
  idUsuario: number | null;
  nombreUsuario: string | null;
}

export interface DatosPaciente {
  dni: string;
  nombres: string;
  apPaterno: string;
  apMaterno: string | null;
  fechaNacimiento: string | null;
  sexo: Sexo | null;
  telefono: string | null;
  idProcedencia: number | null;
}