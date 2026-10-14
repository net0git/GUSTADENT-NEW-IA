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

const NOMBRES_DIAS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

function mismoDia(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function aIso(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

@Component({
  selector: 'app-mini-calendario',
  templateUrl: './mini-calendario.component.html',
  styleUrl: './mini-calendario.component.scss',
})
export class MiniCalendarioComponent {
  /** Fecha seleccionada en formato AAAA-MM-DD. Se escribe para reflejarla desde fuera. */
  readonly fechaSeleccionada = input<string | null>(null);
  readonly cambioFecha = output<string>();

  protected readonly nombresDias = NOMBRES_DIAS;
  protected readonly hoy = new Date();

  private readonly atenciones = inject(AtencionesService);
  private readonly seleccion = signal<Date>(new Date());
  protected readonly mes = signal(new Date(this.hoy.getFullYear(), this.hoy.getMonth(), 1));

  /** Citas pendientes por dia, guardadas una vez por cada mes visto. */
  private readonly citasPorRango = signal<Record<string, Record<string, number>>>({});

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

    // Al cambiar de mes se piden los dias con citas de la rejilla completa.
    effect(() => {
      const celdas = this.celdas();
      this.cargarCitas(aIso(celdas[0]), aIso(celdas[celdas.length - 1]));
    });

    // Tras un cambio se pide de nuevo el mes visible.
    this.atenciones
      .sesionesModificadas.pipe(takeUntilDestroyed())
      .subscribe(() => {
        const celdas = this.celdas();
        this.cargarCitas(aIso(celdas[0]), aIso(celdas[celdas.length - 1]), true);
      });
  }

  /** Todas las celdas del mes, incluidas las de los meses vecinos. */
  private readonly celdas = computed<Date[]>(() => {
    const primerDia = this.mes();
    const inicioSemana = primerDia.getDay();
    const diasDelMes = new Date(primerDia.getFullYear(), primerDia.getMonth() + 1, 0).getDate();
    const fechas: Date[] = [];

    for (let indice = inicioSemana; indice > 0; indice--) {
      fechas.push(new Date(primerDia.getFullYear(), primerDia.getMonth(), 1 - indice));
    }

    for (let numero = 1; numero <= diasDelMes; numero++) {
      fechas.push(new Date(primerDia.getFullYear(), primerDia.getMonth(), numero));
    }

    while (fechas.length % 7 !== 0) {
      const ultima = fechas[fechas.length - 1];
      fechas.push(new Date(ultima.getFullYear(), ultima.getMonth(), ultima.getDate() + 1));
    }

    return fechas;
  });

  private readonly desde = computed(() => this.celdas()[0]);
  private readonly hasta = computed(() => this.celdas()[this.celdas().length - 1]);

  private readonly claveRango = computed(() => `${aIso(this.desde())}|${aIso(this.hasta())}`);

  /** Las citas del mes que se esta viendo; si aun no se piden, no hay puntos. */
  private readonly citasPorDia = computed(() => this.citasPorRango()[this.claveRango()] ?? {});

  protected readonly tituloMes = computed(() => {
    const texto = this.mes().toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  });

  protected readonly dias = computed<DiaCalendario[]>(() => {
    const citas = this.citasPorDia();
    const mesVisible = this.mes();

    return this.celdas().map((fecha) => ({
      fecha,
      numero: fecha.getDate(),
      esDelMes: fecha.getMonth() === mesVisible.getMonth(),
      esHoy: mismoDia(fecha, this.hoy),
      esSeleccionado: mismoDia(fecha, this.seleccion()),
      citas: citas[aIso(fecha)] ?? 0,
    }));
  });

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
 * Cada mes se pide una sola vez y su respuesta se guarda aparte: al volver a un
 * mes ya visto se pintan sus puntos al instante, sin volver a consultar.
 */
  private cargarCitas(desde: string, hasta: string, forzar = false): void {
    const clave = `${desde}|${hasta}`;
    if (!forzar && this.citasPorRango()[clave]) {
      return;
    }

    this.atenciones.resumenCalendario(desde, hasta).subscribe({
      next: (resumen) => {
        const dias = Object.fromEntries(resumen.map((dia) => [dia.fecha, dia.total]));
        this.citasPorRango.update((rangos) => ({ ...rangos, [clave]: dias }));
      },
    });
  }
}