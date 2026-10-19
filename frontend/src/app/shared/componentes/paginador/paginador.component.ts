import { Component, computed, input, output } from '@angular/core';

/** Filas que se muestran por fragmento en las tablas del sistema. */
export const TAMANO_PAGINA = 10;

/** Recorta una lista a la página indicada (las páginas empiezan en 1). */
export function rebanarPagina<T>(
  items: readonly T[],
  pagina: number,
  tamano: number = TAMANO_PAGINA
): T[] {
  const inicio = (pagina - 1) * tamano;
  return items.slice(inicio, inicio + tamano);
}

/** Un número de página, o el separador que resume las páginas intermedias. */
type Marca = number | 'puntos';

/**
 * Carril de paginación que acompaña a las tablas: indica en qué fragmento de
 * filas se está y permite saltar a otra página. Solo aparece cuando hay más de
 * una página, para no ensuciar las tablas cortas.
 */
@Component({
  selector: 'app-paginador',
  templateUrl: './paginador.component.html',
  styleUrl: './paginador.component.scss',
})
export class PaginadorComponent {
  readonly total = input.required<number>();
  readonly pagina = input.required<number>();
  readonly tamano = input<number>(TAMANO_PAGINA);
  /** Cómo se llaman las filas, para el texto "Mostrando 1-10 de 25 pacientes". */
  readonly sustantivo = input<string>('registros');

  readonly paginaCambia = output<number>();

  protected readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.tamano()))
  );

  protected readonly desde = computed(() =>
    this.total() === 0 ? 0 : (this.pagina() - 1) * this.tamano() + 1
  );

  protected readonly hasta = computed(() => Math.min(this.pagina() * this.tamano(), this.total()));

  /** Primeras, últimas y cercanas a la página actual; el resto se resume. */
  protected readonly marcas = computed<Marca[]>(() => {
    const totalPaginas = this.totalPaginas();
    const actual = this.pagina();

    if (totalPaginas <= 7) {
      return Array.from({ length: totalPaginas }, (_, indice) => indice + 1);
    }

    const inicio = Math.max(2, actual - 1);
    const fin = Math.min(totalPaginas - 1, actual + 1);
    const marcas: Marca[] = [1];
    if (inicio > 2) {
      marcas.push('puntos');
    }
    for (let numero = inicio; numero <= fin; numero += 1) {
      marcas.push(numero);
    }
    if (fin < totalPaginas - 1) {
      marcas.push('puntos');
    }
    marcas.push(totalPaginas);
    return marcas;
  });

  protected irAPagina(numero: number): void {
    const destino = Math.min(Math.max(1, numero), this.totalPaginas());
    if (destino !== this.pagina()) {
      this.paginaCambia.emit(destino);
    }
  }
}
