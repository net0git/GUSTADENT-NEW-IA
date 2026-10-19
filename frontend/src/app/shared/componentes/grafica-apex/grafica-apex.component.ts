import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  effect,
  input,
} from '@angular/core';
import ApexCharts from 'apexcharts';

/** Tipos que expone la libreria, para no repetirlos en cada componente. */
export type TipoGrafica = NonNullable<ApexCharts.ApexOptions['chart']>['type'];
export type SeriesGrafica = ApexCharts.ApexAxisChartSeries;

/**
 * Envoltura de ApexCharts. Recibe los datos y se encarga de crear, refrescar y
 * destruir la grafica, para que los componentes no repitan esa logica.
 */
@Component({
  selector: 'app-grafica-apex',
  template: '<div #contenedor class="grafica-apex"></div>',
  styles: [
    `
      :host {
        display: block;
      }

      .grafica-apex {
        width: 100%;
      }
    `,
  ],
})
export class GraficaApexComponent implements AfterViewInit, OnDestroy {
  /** Tipo de grafica de ApexCharts: bar, line, area, donut... */
  readonly tipo = input<TipoGrafica>('bar');
  readonly series = input<SeriesGrafica>([]);
  readonly categorias = input<string[]>([]);
  /** Alto en pixeles del area del grafico. */
  readonly alto = input<number>(320);
  /** Apila las series una sobre otra en vez de mostrarlas en paralelo. */
  readonly apilado = input<boolean>(true);
  /**
   * Fuerza ticks enteros en el eje Y. ApexCharts por defecto reparte el eje en
   * fracciones, lo que produce marcas como 2.5 en un conteo de sesiones.
   */
  readonly ejeEntero = input<boolean>(true);
  readonly colores = input<string[]>(['#16a34a', '#61d6e6']);
  /** Da formato a los valores del eje y del tooltip; si es null van sin formato. */
  readonly formatoValor = input<((valor: number) => string) | null>(null);

  @ViewChild('contenedor', { static: true })
  private readonly contenedor!: ElementRef<HTMLDivElement>;

  private grafica: ApexCharts | null = null;

  constructor() {
    // Los datos llegan despues de crear la grafica, asi que cada cambio
    // refresca el dibujo en lugar de reconstruirlo.
    effect(() => {
      const opciones = this.construirOpciones();
      if (this.grafica) {
        void this.grafica.updateOptions(opciones, true, true);
      }
    });
  }

  ngAfterViewInit(): void {
    this.grafica = new ApexCharts(this.contenedor.nativeElement, this.construirOpciones());
    void this.grafica.render();
  }

  ngOnDestroy(): void {
    this.grafica?.destroy();
    this.grafica = null;
  }

  private construirOpciones(): ApexCharts.ApexOptions {
    const formato = this.formatoValor();
    const categorias = this.categorias();
    const muchasCategorias = categorias.length > 20;
    /* Con pocas barras, un ancho del 60% deja un bloque enorme; se angosta. */
    const pocasCategorias = categorias.length > 0 && categorias.length <= 4;
    const eje = this.ejeEntero() ? this.escalaEntera() : {};

    return {
      chart: {
        type: this.tipo(),
        height: this.alto(),
        fontFamily: 'inherit',
        stacked: this.apilado(),
        toolbar: { show: false },
        animations: { enabled: true, speed: 400 },
      },
      series: this.series(),
      colors: this.colores(),
      plotOptions: {
        bar: {
          columnWidth: pocasCategorias ? '32%' : '60%',
          borderRadius: 3,
          borderRadiusApplication: 'end',
        },
      },
      /* Un borde blanco separa los tramos de la barra apilada. */
      stroke: { width: 1, colors: ['#ffffff'] },
      dataLabels: { enabled: false },
      legend: {
        position: 'top',
        horizontalAlign: 'left',
        fontSize: '0.78rem',
        markers: { size: 8 },
        itemMargin: { horizontal: 12, vertical: 2 },
      },
      grid: {
        borderColor: '#e8f1f4',
        strokeDashArray: 4,
        padding: { left: 4, right: 8 },
      },
      xaxis: {
        categories: categorias,
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          rotate: muchasCategorias ? -45 : 0,
          hideOverlappingLabels: true,
          style: { colors: '#64748b', fontSize: '11px' },
        },
        tooltip: { enabled: false },
      },
      yaxis: {
        ...eje,
        labels: {
          formatter: (valor: number) => (formato ? formato(valor) : String(valor)),
        },
      },
      tooltip: {
        theme: 'light',
        shared: true,
        intersect: false,
        y: {
          formatter: (valor: number) => (formato ? formato(valor) : String(valor)),
        },
      },
    };
  }

  /**
   * Min, tope y cantidad de ticks para que el eje caiga en numeros enteros:
   * se elige un paso de unas 5 divisiones y se redondea el tope a ese paso.
   */
  private escalaEntera(): { min: number; max: number; tickAmount: number } | Record<string, never> {
    // Cada punto puede venir como numero simple o como { x, y }.
    const aNumero = (punto: unknown): number =>
      typeof punto === 'number' ? punto : typeof punto === 'object' && punto !== null && 'y' in punto ? Number((punto as { y: unknown }).y) : 0;

    const valores = this.series()
      .flatMap((serie) => (Array.isArray(serie.data) ? serie.data.map(aNumero) : []))
      .filter((valor) => Number.isFinite(valor));

    const maximo = valores.length ? Math.max(...valores) : 0;

    if (maximo <= 0 || !Number.isInteger(maximo)) {
      return {};
    }

    const paso = Math.max(1, Math.ceil(maximo / 5));
    const divisiones = Math.ceil(maximo / paso);

    return { min: 0, max: paso * divisiones, tickAmount: divisiones };
  }
}