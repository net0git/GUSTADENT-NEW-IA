export interface ItemCatalogo {
  id: number;
  nombre: string;
  activo: boolean;
}

export interface Sucursal extends ItemCatalogo {
  direccion: string | null;
}

export type Procedencia = ItemCatalogo;

export interface EntradaCatalogo {
  nombre: string;
  direccion?: string | null;
}