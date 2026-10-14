import {
  DatosUsuario,
  FiltrosUsuario,
  NuevoUsuario,
  Usuario,
} from '../../domain/usuario';

export interface OdontologoDisponible {
  id: number;
  nombreCompleto: string;
  especialidad: string | null;
}

export interface UsuariosRepository {
  listar(filtros: FiltrosUsuario): Promise<Usuario[]>;
  listarOdontologosActivos(): Promise<OdontologoDisponible[]>;
  obtenerPorId(id: number): Promise<Usuario | null>;
  actualizarPasswordHash(id: number, passwordHash: string): Promise<void>;
  incrementarTokenVersion(id: number): Promise<void>;
  crear(datos: NuevoUsuario): Promise<number>;
  actualizar(id: number, datos: DatosUsuario): Promise<boolean>;
  cambiarEstado(id: number, activo: boolean): Promise<boolean>;
  reemplazarSucursales(id: number, sucursales: number[]): Promise<void>;
}
