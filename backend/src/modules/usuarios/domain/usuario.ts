import { Perfil } from '../../auth/domain/usuario-autenticable';

export const PERFILES: readonly Perfil[] = ['administrador', 'odontologo', 'recepcion'];

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
  passwordHash: string;
  sucursales: number[];
}

export interface FiltrosUsuario {
  perfil?: Perfil;
  activo?: boolean;
}
