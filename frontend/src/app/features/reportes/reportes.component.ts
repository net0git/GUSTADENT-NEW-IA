import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import ApexCharts from 'apexcharts';
import Swal from 'sweetalert2';
import { errorApi } from '../../core/http/error-api';
import { Sucursal } from '../../core/models/catalogo.model';
import { ETIQUETAS_ESTADO_ATENCION } from '../../core/services/atenciones.service';
import { CatalogosService } from '../../core/services/catalogos.service';
import {
  FilaMensual,
  FilaProductividad,
  ReporteCuentasCobrar,
  ReporteSesiones,
  ResumenAtenciones,
} from '../../core/services/reportes.service';
import { ReportesService } from '../../core/services/reportes.service';
import { Odontologo, UsuariosService } from '../../core/services/usuarios.service';
import { GraficaApexComponent, SeriesGrafica } from '../../shared/componentes/grafica-apex/grafica-apex.component';
import {
  PaginadorComponent,
  TAMANO_PAGINA,
  rebanarPagina,
} from '../../shared/componentes/paginador/paginador.component';
import { hoyIso } from '../../shared/fechas/fechas';

type Pestana = 'atenciones' | 'ingresos' | 'productividad' | 'cuentas' | 'mensual';
type RangoRapido = 'mes' | 'ultimos30' | 'mesAnterior' | 'anio';
/** Cuando el usuario escribe fechas a mano, ningun atajo queda seleccionado. */
type RangoSeleccionado = RangoRapido | 'personalizado';

interface Rango {
  desde: string;
  hasta: string;
}

/** Una barra de la grafica. */
interface PuntoGrafica {
  etiqueta: string;
  total: number;
  atendidas: number;
}

/** A partir de este numero de dias la grafica agrupa por semana. */
const DIAS_POR_BARRA = 45;

const MESES = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Oct',
  'Nov',
  'Dic',
];

const ETIQUETAS_PERFIL: Record<string, string> = {
  administrador: 'Administrador',
  odontologo: 'Odontólogo',
  recepcion: 'Recepción',
};

@Component({
  selector: 'app-reportes',
  imports: [ReactiveFormsModule, RouterLink, GraficaApexComponent, PaginadorComponent],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.scss',
})
export class ReportesComponent implements OnInit {
  private readonly reportes = inject(ReportesService);
  private readonly catalogos = inject(CatalogosService);
  private readonly usuarios = inject(UsuariosService);

  protected readonly pestana = signal<Pestana>('atenciones');
  protected readonly rangoRapido = signal<RangoSeleccionado>('mes');
  protected readonly cargando = signal(true);

  protected readonly sucursales = signal<Sucursal[]>([]);
  protected readonly odontologos = signal<Odontologo[]>([]);

  protected readonly resumen = signal<ResumenAtenciones | null>(null);
  protected readonly ingresos = signal<ReporteSesiones | null>(null);
  protected readonly productividad = signal<FilaProductividad[]>([]);
  protected readonly cuentas = signal<ReporteCuentasCobrar | null>(null);
  protected readonly mensual = signal<FilaMensual[]>([]);

  /** Paciente desplegado para ver el detalle de sus atenciones con deuda. */
  protected readonly pacienteAbierto = signal<number | null>(null);

  /** Fragmento visible de cada tabla de reporte. */
  protected readonly paginaProductividad = signal(1);
  protected readonly paginaCuentas = signal(1);
  protected readonly paginaMensual = signal(1);
  protected readonly tamanoPagina = signal(TAMANO_PAGINA);

  protected readonly productividadPagina = computed(() =>
    rebanarPagina(this.productividad(), this.paginaProductividad(), this.tamanoPagina())
  );
  protected readonly cuentasPagina = computed(() =>
    rebanarPagina(this.cuentas()?.filas ?? [], this.paginaCuentas(), this.tamanoPagina())
  );
  protected readonly mensualPagina = computed(() =>
    rebanarPagina(this.mensual(), this.paginaMensual(), this.tamanoPagina())
  );

  protected readonly etiquetasEstado = ETIQUETAS_ESTADO_ATENCION;

  protected readonly formulario = new FormGroup({
    desde: new FormControl('', { nonNullable: true }),
    hasta: new FormControl('', { nonNullable: true }),
    sucursal: new FormControl<number | null>(null),
    medico: new FormControl<number | null>(null),
  });

  /** Cuentas por cobrar es una foto del estado actual: no usa el rango de fechas. */
  protected readonly usaRango = computed(() => this.pestana() !== 'cuentas');

  /**
   * Una barra por dia mientras el rango sea manejable; en rangos largos se
   * agrupan por semana para que la grafica siga siendo legible.
   */
  protected readonly puntosSesiones = computed<PuntoGrafica[]>(() => {
    const dias = this.ingresos()?.porDia ?? [];

    if (dias.length <= DIAS_POR_BARRA) {
      return dias.map((dia) => ({
        etiqueta: this.diaCorto(dia.fecha),
        total: dia.total,
        atendidas: dia.atendidas,
      }));
    }

    const porSemana = new Map<string, PuntoGrafica>();
    for (const dia of dias) {
      const semana = this.lunesDe(dia.fecha);
      const punto = porSemana.get(semana) ?? { etiqueta: this.diaCorto(semana), total: 0, atendidas: 0 };
      punto.total += dia.total;
      punto.atendidas += dia.atendidas;
      porSemana.set(semana, punto);
    }

    return [...porSemana.values()];
  });

  /** Escala de la grafica de barras: el dia mas alto del periodo. */
  protected readonly maximoDia = computed(() =>
    this.puntosSesiones().reduce((maximo, punto) => Math.max(maximo, punto.total), 0)
  );

  protected readonly tituloGraficaSesiones = computed(() => {
    const dias = this.ingresos()?.porDia.length ?? 0;
    return dias > DIAS_POR_BARRA ? 'Sesiones por semana' : 'Sesiones por día';
  });

  /** Cada punto se apila sobre el anterior: lo atendido va arriba de lo pendiente. */
  protected readonly seriesSesiones = computed<SeriesGrafica>(() => {
    const puntos = this.puntosSesiones();
    return [
      { name: 'Atendidas', data: puntos.map((punto) => punto.atendidas) },
      { name: 'Programadas', data: puntos.map((punto) => punto.total - punto.atendidas) },
    ];
  });

  protected readonly categoriasSesiones = computed(() =>
    this.puntosSesiones().map((punto) => punto.etiqueta)
  );

  protected readonly puntosMes = computed<PuntoGrafica[]>(() =>
    this.mensual().map((fila) => ({
      etiqueta: `${MESES[fila.mes - 1]} ${fila.anio}`,
      total: fila.sesiones,
      atendidas: fila.atendidas,
    }))
  );

  protected readonly seriesMes = computed<SeriesGrafica>(() => {
    const puntos = this.puntosMes();
    return [
      { name: 'Atendidas', data: puntos.map((punto) => punto.atendidas) },
      { name: 'Programadas', data: puntos.map((punto) => punto.total - punto.atendidas) },
    ];
  });

  protected readonly categoriasMes = computed(() => this.puntosMes().map((punto) => punto.etiqueta));

  protected readonly maximoMes = computed(() =>
    this.puntosMes().reduce((maximo, punto) => Math.max(maximo, punto.total), 0)
  );

  protected readonly totalMensualAtenciones = computed(() =>
    this.mensual().reduce((suma, fila) => suma + fila.atenciones, 0)
  );

  protected readonly totalMensualSesiones = computed(() =>
    this.mensual().reduce((suma, fila) => suma + fila.sesiones, 0)
  );

  ngOnInit(): void {
    const rango = this.rangoDe('mes');
    this.formulario.patchValue({ desde: rango.desde, hasta: rango.hasta });
    this.cargarCatalogos();
    this.cargar();
  }

  protected cambiarPestana(pestana: Pestana): void {
    this.pestana.set(pestana);
    this.pacienteAbierto.set(null);
    this.cargar();
  }

  protected aplicarRango(rango: RangoRapido): void {
    this.rangoRapido.set(rango);
    const fechas = this.rangoDe(rango);
    this.formulario.patchValue({ desde: fechas.desde, hasta: fechas.hasta });
    this.cargar();
  }

  protected filtrar(): void {
    const desde = this.formulario.controls.desde.value;
    const hasta = this.formulario.controls.hasta.value;

    if (desde === '' || hasta === '') {
      this.mostrarAviso('Completa el rango de fechas', 'Indica la fecha inicial y la final.');
      return;
    }

    if (desde > hasta) {
      this.mostrarAviso('Rango invertido', 'La fecha inicial no puede ser posterior a la final.');
      return;
    }

    this.rangoRapido.set('personalizado');
    this.cargar();
  }

  private mostrarAviso(titulo: string, texto: string): void {
    Swal.fire({
      icon: 'warning',
      title: titulo,
      text: texto,
      confirmButtonText: 'Entendido',
    });
  }

  protected alternarDetalle(idPaciente: number): void {
    this.pacienteAbierto.update((actual) => (actual === idPaciente ? null : idPaciente));
  }

  /** Al cambiar cuántas filas se ven, las tablas vuelven a la primera página. */
  protected cambiarTamanoPagina(tamano: number): void {
    this.tamanoPagina.set(tamano);
    this.paginaProductividad.set(1);
    this.paginaCuentas.set(1);
    this.paginaMensual.set(1);
  }

  protected monto(valor: number): string {
    return `S/ ${valor.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  protected diaCorto(fecha: string): string {
    const partes = fecha.split('-');
    return `${partes[2]}/${partes[1]}`;
  }

  /** Lunes de la semana a la que pertenece una fecha AAAA-MM-DD. */
  private lunesDe(fechaIso: string): string {
    const fecha = new Date(`${fechaIso}T00:00:00`);
    const dia = fecha.getDay() === 0 ? 7 : fecha.getDay();
    fecha.setDate(fecha.getDate() - (dia - 1));
    return this.aIso(fecha);
  }

  protected etiquetaMes(fila: FilaMensual): string {
    return `${MESES[fila.mes - 1]} ${fila.anio}`;
  }

  protected etiquetaPerfil(perfil: string): string {
    return ETIQUETAS_PERFIL[perfil] ?? perfil;
  }

  protected iniciales(nombre: string): string {
    return nombre
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((parte) => parte.charAt(0).toUpperCase())
      .join('');
  }

  protected textoResumen(): string {
    const desde = this.formulario.controls.desde.value;
    const hasta = this.formulario.controls.hasta.value;
    const partes: string[] = [];

    if (this.usaRango()) {
      partes.push(`${desde} al ${hasta}`);
    }
    const sucursal = this.formulario.controls.sucursal.value;
    if (sucursal) {
      partes.push(this.nombreSucursal(sucursal));
    }
    const medico = this.formulario.controls.medico.value;
    if (medico) {
      partes.push(this.nombreOdontologo(medico));
    }

    return partes.length === 0 ? 'Todos los registros' : partes.join(' · ');
  }

  /** Rango de fechas segun la opcion elegida; el mes en curso por defecto. */
  private rangoDe(rango: RangoRapido): Rango {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = hoy.getMonth();

    switch (rango) {
      case 'ultimos30': {
        const inicio = new Date(anio, mes, hoy.getDate() - 29);
        return { desde: this.aIso(inicio), hasta: hoyIso() };
      }
      case 'mesAnterior':
        // El dia 0 de un mes es el ultimo dia del mes anterior; el constructor
        // de Date ajusta solo el dia y el anio cuando el mes se sale de rango.
        return {
          desde: this.aIso(new Date(anio, mes - 1, 1)),
          hasta: this.aIso(new Date(anio, mes, 0)),
        };
      case 'anio':
        return { desde: `${anio}-01-01`, hasta: `${anio}-12-31` };
      case 'mes':
      default:
        return { desde: this.aIso(new Date(anio, mes, 1)), hasta: hoyIso() };
    }
  }

  private aIso(fecha: Date): string {
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${fecha.getFullYear()}-${mes}-${dia}`;
  }

  private nombreSucursal(id: number): string {
    return this.sucursales().find((sucursal) => sucursal.id === id)?.nombre ?? `Sucursal ${id}`;
  }

  private nombreOdontologo(id: number): string {
    return this.odontologos().find((medico) => medico.id === id)?.nombreCompleto ?? `Médico ${id}`;
  }

  private cargarCatalogos(): void {
    this.catalogos.listarSucursales(false).subscribe({
      next: (sucursales) => this.sucursales.set(sucursales),
      error: () => this.sucursales.set([]),
    });

    this.usuarios.listarOdontologos().subscribe({
      next: (odontologos) => this.odontologos.set(odontologos),
      error: () => this.odontologos.set([]),
    });
  }

  private cargar(): void {
    this.cargando.set(true);
    this.paginaProductividad.set(1);
    this.paginaCuentas.set(1);
    this.paginaMensual.set(1);

    if (this.pestana() === 'cuentas') {
      this.cargarCuentas();
      return;
    }

    const filtros = {
      desde: this.formulario.controls.desde.value,
      hasta: this.formulario.controls.hasta.value,
      sucursal: this.formulario.controls.sucursal.value ?? undefined,
      medico: this.formulario.controls.medico.value ?? undefined,
    };

    switch (this.pestana()) {
      case 'ingresos':
        this.reportes.ingresosPorSesion(filtros).subscribe({
          next: (datos) => {
            this.ingresos.set(datos);
            this.cargando.set(false);
          },
          error: (error: unknown) => this.finCargaConError(error),
        });
        break;
      case 'productividad':
        this.reportes.productividad(filtros).subscribe({
          next: (datos) => {
            this.productividad.set(datos);
            this.cargando.set(false);
          },
          error: (error: unknown) => this.finCargaConError(error),
        });
        break;
      case 'mensual':
        this.reportes.atencionesPorMes(filtros).subscribe({
          next: (datos) => {
            this.mensual.set(datos);
            this.cargando.set(false);
          },
          error: (error: unknown) => this.finCargaConError(error),
        });
        break;
      default:
        this.reportes.resumenAtenciones(filtros).subscribe({
          next: (datos) => {
            this.resumen.set(datos);
            this.cargando.set(false);
          },
          error: (error: unknown) => this.finCargaConError(error),
        });
    }
  }

  private cargarCuentas(): void {
    const sucursal = this.formulario.controls.sucursal.value ?? undefined;

    this.reportes.cuentasPorCobrar(sucursal).subscribe({
      next: (datos) => {
        this.cuentas.set(datos);
        this.cargando.set(false);
      },
      error: (error: unknown) => this.finCargaConError(error),
    });
  }

  private finCargaConError(error: unknown): void {
    this.cargando.set(false);
    Swal.fire({
      icon: 'error',
      title: 'No se pudo cargar el reporte',
      text: errorApi(error).mensaje,
      confirmButtonText: 'Entendido',
    });
  }
}