export type Perfil = 'administrador' | 'odontologo' | 'recepcion';

export interface UsuarioAutenticable {
  id: number;
  username: string;
  nombreCompleto: string;
  perfil: Perfil;
  activo: boolean;
  passwordHash: string;
  tokenVersion: number;
}

export interface UsuarioSesion {
  id: number;
  username: string;
  nombreCompleto: string;
  perfil: Perfil;
}
