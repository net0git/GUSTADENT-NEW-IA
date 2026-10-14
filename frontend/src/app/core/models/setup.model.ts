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
