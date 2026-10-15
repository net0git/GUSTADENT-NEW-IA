import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AtencionesService } from '../../../core/services/atenciones.service';

interface DiaCalendario {
  fecha: Date;
  numero: number;
  esDelMes: boolean;
  esHoy: boolean;
  esSeleccionado: boolean;
  citas: number;
}

interface GrillaMes {
  base: Date;
  dias: DiaCalendario[];
}

const NOMBRES_DIAS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

function mismoDia(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function aIso(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

/** Celdas de un mes, incluidas las de los meses vecinos que completan las semanas. */
function celdasDe(base: Date): Date[] {
  const inicioSemana = base.getDay();
  const diasDelMes = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  const fechas: Date[] = [];

  for (let indice = inicioSemana; indice > 0; indice--) {
    fechas.push(new Date(base.getFullYear(), base.getMonth(), 1 - indice));
  }

  for (let numero = 1; numero <= diasDelMes; numero++) {
    fechas.push(new Date(base.getFullYear(), base.getMonth(), numero));
  }

  while (fechas.length % 7 !== 0) {
    const ultima = fechas[fechas.length - 1];
    fechas.push(new Date(ultima.getFullYear(), ultima.getMonth(), ultima.getDate() + 1));
  }

  return fechas;
}

function nombreMes(base: Date): string {
  const texto = base.toLocaleDateString('es-PE', { month: 'long' });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

@Component({
  selector: 'app-mini-calendario',
  templateUrl: './mini-calendario.component.html',
  styleUrl: './mini-calendario.component.scss',
})
export class MiniCalendarioComponent {
  /** Fecha seleccionada en formato AAAA-MM-DD. Se escribe para reflejarla desde fuera. */
  readonly fechaSeleccionada = input<string | null>(null);
  /** Cuantos meses seguidos se muestran. En la barra lateral es uno. */
  readonly mesesVisibles = input(1);
  readonly cambioFecha = output<string>();

  protected readonly nombresDias = NOMBRES_DIAS;
  protected readonly hoy = new Date();

  private readonly atenciones = inject(AtencionesService);
  private readonly seleccion = signal<Date>(new Date());
  /** Primer mes visible; los siguientes son consecutivos. */
  protected readonly mes = signal(new Date(this.hoy.getFullYear(), this.hoy.getMonth(), 1));

  /** Citas pendientes por dia, acumuladas de todos los rangos ya pedidos. */
  private readonly citas = signal<Record<string, number>>({});
  private readonly rangosCargados = new Set<string>();

  constructor() {
    effect(() => {
      const externa = this.fechaSeleccionada();
      if (!externa) {
        return;
      }
      const [anio, mes, dia] = externa.split('-').map(Number);
      if (!anio || !mes || !dia) {
        return;
      }
      const fecha = new Date(anio, mes - 1, dia);
      if (!mismoDia(fecha, this.seleccion())) {
        this.seleccion.set(fecha);
        this.mes.set(new Date(anio, mes - 1, 1));
      }
    });

    // Al cambiar de mes se piden los dias con citas de cada grilla visible.
    // Se pide por mes y no todo junto para no superar el limite del servidor.
    effect(() => {
      for (const grilla of this.grillas()) {
        const celdas = grilla.celdas;
        this.cargarCitas(aIso(celdas[0]), aIso(celdas[celdas.length - 1]));
      }
    });

    // Tras un cambio se piden de nuevo los meses visibles.
    this.atenciones
      .sesionesModificadas.pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.rangosCargados.clear();
        for (const grilla of this.grillas()) {
          const celdas = grilla.celdas;
          this.cargarCitas(aIso(celdas[0]), aIso(celdas[celdas.length - 1]), true);
        }
      });
  }

  /** Una grilla por cada mes visible, a partir del mes base. */
  private readonly grillas = computed(() => {
    const cantidad = Math.max(1, this.mesesVisibles());
    const base = this.mes();
    return Array.from({ length: cantidad }, (_, indice) => {
      const inicio = new Date(base.getFullYear(), base.getMonth() + indice, 1);
      return { base: inicio, celdas: celdasDe(inicio) };
    });
  });

  protected readonly tituloMeses = computed(() => {
    const grillas = this.grillas();
    const primera = grillas[0].base;
    const ultima = grillas[grillas.length - 1].base;

    if (primera.getMonth() === ultima.getMonth() && primera.getFullYear() === ultima.getFullYear()) {
      return `${nombreMes(primera)} de ${primera.getFullYear()}`;
    }
    if (primera.getFullYear() === ultima.getFullYear()) {
      return `${nombreMes(primera)} – ${nombreMes(ultima)} de ${primera.getFullYear()}`;
    }
    return `${nombreMes(primera)} de ${primera.getFullYear()} – ${nombreMes(ultima)} de ${ultima.getFullYear()}`;
  });

  protected readonly meses = computed<GrillaMes[]>(() => {
    const citas = this.citas();

    return this.grillas().map((grilla) => ({
      base: grilla.base,
      dias: grilla.celdas.map((fecha) => ({
        fecha,
        numero: fecha.getDate(),
        esDelMes: fecha.getMonth() === grilla.base.getMonth(),
        esHoy: mismoDia(fecha, this.hoy),
        esSeleccionado: mismoDia(fecha, this.seleccion()),
        citas: citas[aIso(fecha)] ?? 0,
      })),
    }));
  });

  protected nombreMes(base: Date): string {
    return nombreMes(base);
  }

  protected mesAnterior(): void {
    const actual = this.mes();
    this.mes.set(new Date(actual.getFullYear(), actual.getMonth() - 1, 1));
  }

  protected mesSiguiente(): void {
    const actual = this.mes();
    this.mes.set(new Date(actual.getFullYear(), actual.getMonth() + 1, 1));
  }

  protected seleccionar(dia: DiaCalendario): void {
    this.seleccion.set(dia.fecha);
    if (!dia.esDelMes) {
      this.mes.set(new Date(dia.fecha.getFullYear(), dia.fecha.getMonth(), 1));
    }
    this.cambioFecha.emit(aIso(dia.fecha));
  }

  /**
   * Cada rango se pide una sola vez y su respuesta se suma a las demas: al
   * volver a un mes ya visto se pintan sus puntos al instante.
   */
  private cargarCitas(desde: string, hasta: string, forzar = false): void {
    const clave = `${desde}|${hasta}`;
    if (!forzar && this.rangosCargados.has(clave)) {
      return;
    }
    this.rangosCargados.add(clave);

    this.atenciones.resumenCalendario(desde, hasta).subscribe({
      next: (resumen) => {
        const dias = Object.fromEntries(resumen.map((dia) => [dia.fecha, dia.total]));
        this.citas.update((actuales) => ({ ...actuales, ...dias }));
      },
      error: () => this.rangosCargados.delete(clave),
    });
  }
}
