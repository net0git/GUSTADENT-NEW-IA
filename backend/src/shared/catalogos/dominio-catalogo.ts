export interface CatalogoBase {
  id: number;
  nombre: string;
  activo: boolean;
}

export interface EntradaCatalogo {
  nombre: string;
  direccion: string | null;
}

export interface CatalogoRepository<TListado extends CatalogoBase> {
  listar(soloActivas: boolean): Promise<TListado[]>;
  obtenerPorId(id: number): Promise<TListado | null>;
  crear(datos: EntradaCatalogo): Promise<number>;
  actualizar(id: number, datos: EntradaCatalogo): Promise<boolean>;
  cambiarEstado(id: number, activo: boolean): Promise<boolean>;
  contarActivos(): Promise<number>;
  existeConNombre(nombre: string, exceptoId: number | null): Promise<boolean>;
  tieneUsoPendiente(id: number): Promise<boolean>;
}