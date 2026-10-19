export interface EstadoSetup {
  empresa: boolean;
  sucursal: boolean;
  administrador: boolean;
}

export interface EmpresaSetup {
  nombreEmpresa: string;
  ruc: string;
  direccion: string | null;
  telefono: string | null;
  logo: string | null;
}

export interface SucursalSetup {
  nombre: string;
  direccion: string | null;
}

export interface AdministradorSetup {
  username: string;
  passwordHash: string;
  dni: string;
  nombreCompleto: string;
}

export interface SetupRepository {
  obtenerEstado(): Promise<EstadoSetup>;
  obtenerEmpresa(): Promise<EmpresaSetup | null>;
  registrarEmpresa(datos: EmpresaSetup): Promise<boolean>;
  actualizarEmpresa(datos: EmpresaSetup): Promise<boolean>;
  registrarSucursal(datos: SucursalSetup): Promise<boolean>;
  registrarAdministrador(datos: AdministradorSetup): Promise<boolean>;
}