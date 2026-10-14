import { CatalogoBase } from '../../../../shared/catalogos/dominio-catalogo';

export interface Sucursal extends CatalogoBase {
  direccion: string | null;
}