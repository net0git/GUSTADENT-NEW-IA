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
