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