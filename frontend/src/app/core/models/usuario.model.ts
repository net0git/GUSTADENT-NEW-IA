export type Perfil = 'administrador' | 'odontologo' | 'recepcion';

export const ETIQUETAS_PERFIL: Record<Perfil, string> = {
  administrador: 'Administrador',
  odontologo: 'Odontólogo',
  recepcion: 'Recepción',
};

export interface SucursalAsignada {
  id: number;
  nombre: string;
}

export interface Usuario {
  id: number;
  dni: string;
  nombreCompleto: string;
  especialidad: string | null;
  telefono: string | null;
  username: string;
  perfil: Perfil;
  activo: boolean;
  sucursales: SucursalAsignada[];
}

export interface DatosUsuario {
  dni: string;
  nombreCompleto: string;
  especialidad: string | null;
  telefono: string | null;
  username: string;
  perfil: Perfil;
}

export interface NuevoUsuario extends DatosUsuario {
  password: string;
  sucursales: number[];
}

export interface FiltrosUsuario {
  perfil?: Perfil;
  activo?: boolean;
}
