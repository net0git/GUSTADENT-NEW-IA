import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { errorApi } from '../../../core/http/error-api';
import { Sucursal } from '../../../core/models/catalogo.model';
import { CatalogosService } from '../../../core/services/catalogos.service';
import { PacientesService } from '../../../core/services/pacientes.service';
import {
  Atencion,
  AtencionesService,
  ETIQUETAS_ESTADO_ATENCION,
  EstadoSesion,
  SesionCita,
} from '../../../core/services/atenciones.service';
import {
  PaginadorComponent,
  TAMANO_PAGINA,
  rebanarPagina,
} from '../../../shared/componentes/paginador/paginador.component';
import { aIso, horaIso } from '../../../shared/fechas/fechas';

const ETIQUETAS_ESTADO_SESION: Record<EstadoSesion, string> = {
  programado: 'Programado',
  atendido: 'Atendido',
  cancelado: 'Cancelado',
};

const ESTADOS: (EstadoSesion | '')[] = ['', 'programado', 'atendido', 'cancelado'];

/** Una fila del listado: una sesion, que es la cita concreta del paciente. */
export interface FilaListado {
  clave: string;
  esPrimera: boolean;
  numeroSesion: number;
  idAtencion: number;
  nombreCompletoPaciente: string;
  dniPaciente: string;
  fecha: string;
  hora: string;
  sucursal: string;
  medico: string;
  estado: EstadoSesion;
}

export interface PacienteBuscado {
  id: number;
  nombreCompleto: string;
  dni: string;
}

@Component({
  selector: 'app-atenciones-lista',
  imports: [ReactiveFormsModule, RouterLink, PaginadorComponent],
  templateUrl: './atenciones-lista.component.html',
  styleUrl: './atenciones-lista.component.scss',
})
export class AtencionesListaComponent implements OnInit {
  private readonly atencionesService = inject(AtencionesService);
  private readonly catalogos = inject(CatalogosService);
  private readonly pacientesService = inject(PacientesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destruir = inject(DestroyRef);

  protected readonly etiquetasEstadoSesion = ETIQUETAS_ESTADO_SESION;
  protected readonly estados = ESTADOS;

  protected readonly filas = signal<FilaListado[]>([]);
  protected readonly sucursales = signal<Sucursal[]>([]);
  protected readonly cargando = signal(true);

  /** Fragmento de la tabla de citas que se está viendo. */
  protected readonly pagina = signal(1);
  protected readonly tamano = signal(TAMANO_PAGINA);
  protected readonly filasPagina = computed(() =>
    rebanarPagina(this.filas(), this.pagina(), this.tamano())
  );

  // Busqueda de atenciones por paciente: reemplaza la tabla por tarjetas.
  protected readonly resultadosPaciente = signal<PacienteBuscado[]>([]);
  protected readonly buscando = signal(false);
  protected readonly errorBusqueda = signal<string | null>(null);
  protected readonly pacienteElegido = signal<PacienteBuscado | null>(null);
  protected readonly atencionesPaciente = signal<Atencion[]>([]);
  protected readonly cargandoAtenciones = signal(false);

  protected readonly formularioBusqueda = new FormGroup({
    termino: new FormControl('', { nonNullable: true }),
  });

  protected readonly formulario = new FormGroup({
    fecha: new FormControl('', { nonNullable: true }),
    sucursal: new FormControl<number | ''>('', { nonNullable: true }),
    estado: new FormControl<EstadoSesion | ''>('', { nonNullable: true }),
  });

  ngOnInit(): void {
    this.catalogos.listarSucursales().subscribe({
      next: (sucursales) => this.sucursales.set(sucursales),
      error: () => this.sucursales.set([]),
    });

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destruir)).subscribe(() => {
      this.leerFiltrosDeLaUrl();
      this.cargar();
    });
  }

  protected filtrar(): void {
    this.sincronizarUrl();
    this.cargar();
  }

  protected buscarPaciente(): void {
    const termino = this.formularioBusqueda.controls.termino.value.trim();
    if (termino === '') {
      this.errorBusqueda.set('Escribe un nombre o DNI para buscar');
      return;
    }

    this.buscando.set(true);
    this.errorBusqueda.set(null);

    this.pacientesService.listar(termino).subscribe({
      next: (pacientes) => {
        this.buscando.set(false);
        this.resultadosPaciente.set(
          pacientes.map((paciente) => ({
            id: paciente.id,
            nombreCompleto: paciente.nombreCompleto,
            dni: paciente.dni,
          }))
        );
        if (pacientes.length === 0) {
          this.errorBusqueda.set('No se encontraron pacientes con ese dato');
        }
      },
      error: (error: unknown) => {
        this.buscando.set(false);
        this.errorBusqueda.set(errorApi(error).mensaje);
      },
    });
  }

  protected elegirPaciente(paciente: PacienteBuscado): void {
    this.pacienteElegido.set(paciente);
    this.resultadosPaciente.set([]);
    this.formularioBusqueda.reset({ termino: paciente.nombreCompleto });
    this.cargarAtencionesDelPaciente(paciente.id);
  }

  protected salirDeBusqueda(): void {
    this.pacienteElegido.set(null);
    this.atencionesPaciente.set([]);
    this.resultadosPaciente.set([]);
    this.errorBusqueda.set(null);
    this.formularioBusqueda.reset({ termino: '' });
  }

  protected iniciales(nombre: string): string {
    return nombre
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((parte) => parte.charAt(0).toUpperCase())
      .join('');
  }

  protected limpiarFiltros(): void {
    this.formulario.reset({ fecha: '', sucursal: '', estado: '' });
    this.sincronizarUrl();
    this.cargar();
  }

  /** Al cambiar cuántas filas se ven, se vuelve a la primera página. */
  protected cambiarTamano(tamano: number): void {
    this.tamano.set(tamano);
    this.pagina.set(1);
  }

  protected quitarFiltroFecha(): void {
    this.formulario.patchValue({ fecha: '' });
    this.sincronizarUrl();
    this.cargar();
  }

  protected etiquetasEstadoAtencion = ETIQUETAS_ESTADO_ATENCION;

protected monto(valor: number): string {
    return `S/ ${valor.toFixed(2)}`;
  }

  protected horaLegible(hora: string): string {
    const [horas, minutos] = hora.split(':').map(Number);
    const hora12 = horas % 12 === 0 ? 12 : horas % 12;
    return `${hora12}:${String(minutos).padStart(2, '0')} ${horas < 12 ? 'AM' : 'PM'}`;
  }

  /** Las sesiones llegan en ISO completo; se muestran en la hora local. */
  protected horaDeSesion(fechaIso: string): string {
    const fecha = new Date(fechaIso);
    const hora12 = fecha.getHours() % 12 === 0 ? 12 : fecha.getHours() % 12;
    const minuto = String(fecha.getMinutes()).padStart(2, '0');
    return `${hora12}:${minuto} ${fecha.getHours() < 12 ? 'AM' : 'PM'}`;
  }

  protected fechaLegible(iso: string): string {
    const base = iso.length === 10 ? `${iso}T00:00:00` : iso;
    return new Date(base).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  /** Mantiene el filtro de la pantalla alineado con la URL que usa el calendario. */
  private leerFiltrosDeLaUrl(): void {
    const parametros = this.route.snapshot.queryParamMap;
    const sucursal = parametros.get('sucursal');
    const estado = parametros.get('estado');

    this.formulario.patchValue({
      fecha: parametros.get('fecha') ?? '',
      sucursal: sucursal === null || sucursal === '' ? '' : Number(sucursal),
      estado: (estado as EstadoSesion | null) ?? '',
    });
  }

  private sincronizarUrl(): void {
    const valores = this.formulario.getRawValue();
    const parametros: Record<string, string> = {};
    if (valores.fecha) parametros['fecha'] = valores.fecha;
    if (valores.sucursal !== '') parametros['sucursal'] = String(valores.sucursal);
    if (valores.estado !== '') parametros['estado'] = valores.estado;
    this.router.navigate(['/atenciones'], { queryParams: parametros });
  }

  private cargar(): void {
    this.cargando.set(true);
    this.pagina.set(1);
    this.atencionesService.listarCitas({ fecha: this.formulario.controls.fecha.value || undefined }).subscribe({
      next: (citas) => {
        this.filas.set(this.aplicarFiltrosLocales(citas));
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.cargando.set(false);
        Swal.fire({
          icon: 'error',
          title: 'No se pudo cargar la lista',
          text: errorApi(error).mensaje,
          confirmButtonText: 'Entendido',
        });
      },
    });
  }

  private aplicarFiltrosLocales(citas: SesionCita[]): FilaListado[] {
    const { sucursal, estado } = this.formulario.getRawValue();
    const nombreSucursal =
      sucursal === '' ? null : this.sucursales().find((item) => item.id === sucursal)?.nombre ?? null;

    return citas
      .filter((cita) => (nombreSucursal ? cita.nombreSucursal === nombreSucursal : true))
      .filter((cita) => (estado === '' ? true : cita.estado === estado))
      .map((cita) => this.aFila(cita));
  }

  private cargarAtencionesDelPaciente(idPaciente: number): void {
    this.cargandoAtenciones.set(true);
    this.atencionesService.listar({ paciente: idPaciente }).subscribe({
      next: (atenciones) => {
        this.atencionesPaciente.set(atenciones);
        this.cargandoAtenciones.set(false);
      },
      error: (error: unknown) => {
        this.cargandoAtenciones.set(false);
        Swal.fire({
          icon: 'error',
          title: 'No se pudieron cargar las atenciones',
          text: errorApi(error).mensaje,
          confirmButtonText: 'Entendido',
        });
      },
    });
  }

  private aFila(cita: SesionCita): FilaListado {
    // El backend devuelve la hora en UTC; se convierte a la fecha local del usuario.
    const instante = new Date(cita.fechaHora);

    return {
      clave: `c-${cita.id}`,
      esPrimera: cita.tipo === 'primera',
      numeroSesion: cita.numero,
      idAtencion: cita.idTicket,
      nombreCompletoPaciente: cita.nombreCompletoPaciente,
      dniPaciente: cita.dniPaciente,
      fecha: aIso(instante),
      hora: horaIso(instante),
      sucursal: cita.nombreSucursal,
      medico: cita.nombreMedico,
      estado: cita.estado,
    };
  }
}