export interface EstadoSetup {
  empresa: boolean;
  sucursal: boolean;
  administrador: boolean;
  configurado: boolean;
}

export interface EmpresaSetup {
  nombreEmpresa: string;
  ruc: string;
  direccion: string | null;
  telefono: string | null;
  logo: string | null; // URL o base64 del logo
}

/** Datos de la clinica en el asistente inicial: el logo se configura despues. */
export type EmpresaRegistro = Omit<EmpresaSetup, 'logo'>;

export interface SucursalSetup {
  nombre: string;
  direccion: string | null;
}

export interface AdministradorSetup {
  username: string;
  password: string;
  dni: string;
  nombreCompleto: string;
}
