import { Component, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { errorApi } from '../../../core/http/error-api';
import { Sucursal } from '../../../core/models/catalogo.model';
import { CatalogosService } from '../../../core/services/catalogos.service';
import { AtencionesService } from '../../../core/services/atenciones.service';
import { AuthService } from '../../../core/services/auth.service';
import { Paciente, PacientesService } from '../../../core/services/pacientes.service';
import { UsuariosService } from '../../../core/services/usuarios.service';
import { dniONombre } from '../../../shared/formularios/validacion';
import { MiniCalendarioComponent } from '../../../shared/componentes/mini-calendario/mini-calendario.component';
import { SelectorHorarioComponent } from '../../../shared/componentes/selector-horario/selector-horario.component';
import { campoInvalido, mensajeDeError } from '../../../shared/formularios/validacion';
import { hoyIso } from '../../../shared/fechas/fechas';

interface Odontologo {
  id: number;
  nombreCompleto: string;
  especialidad: string | null;
}

@Component({
  selector: 'app-nueva-atencion',
  imports: [ReactiveFormsModule, RouterLink, MiniCalendarioComponent, SelectorHorarioComponent],
  templateUrl: './nueva-atencion.component.html',
  styleUrl: './nueva-atencion.component.scss',
})
export class NuevaAtencionComponent implements OnInit {
  private readonly atenciones = inject(AtencionesService);
  private readonly catalogos = inject(CatalogosService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly pacientesService = inject(PacientesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly mensajeCampo = mensajeDeError;
  protected readonly mostrarCampoInvalido = campoInvalido;
  protected readonly usuario = inject(AuthService).obtenerUsuario();

  protected readonly guardando = signal(false);
  protected readonly sucursales = signal<Sucursal[]>([]);
  protected readonly odontologos = signal<Odontologo[]>([]);
  protected readonly nombrePaciente = signal<string | null>(null);

  protected readonly buscadorAbierto = signal(false);
  protected readonly resultados = signal<Paciente[]>([]);
  protected readonly buscando = signal(false);
  protected readonly errorBusqueda = signal<string | null>(null);

  protected readonly formularioBusqueda = new FormGroup({
    termino: new FormControl('', { nonNullable: true, validators: [dniONombre()] }),
  });

  protected readonly formulario = new FormGroup({
    idPaciente: new FormControl<number | null>(null, Validators.required),
    idSucursal: new FormControl<number | null>(null, Validators.required),
    idUsuario: new FormControl<number | null>(null, Validators.required),
    fecha: new FormControl(hoyIso(), {
      nonNullable: true,
      validators: [Validators.required],
    }),
    hora: new FormControl('09:00', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^([01]\d|2[0-3]):[0-5]\d$/)],
    }),
    descripcion: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(2000)] }),
    costo: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)],
    }),
    descuento: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)],
    }),
  });

  ngOnInit(): void {
    this.catalogos.listarSucursales().subscribe({
      next: (sucursales) => {
        this.sucursales.set(sucursales);
        if (this.formulario.controls.idSucursal.value === null && sucursales.length > 0) {
          this.formulario.patchValue({ idSucursal: sucursales[0].id });
        }
      },
      error: () => this.sucursales.set([]),
    });

    this.usuariosService.listarOdontologos().subscribe({
      next: (odontologos) => {
        this.odontologos.set(odontologos);
        if (this.formulario.controls.idUsuario.value === null && odontologos.length > 0) {
          this.formulario.patchValue({ idUsuario: odontologos[0].id });
        }
      },
      error: () => this.odontologos.set([]),
    });

    this.leerPacienteDeLaUrl();
  }

  constructor() {
    // Llegar desde "Nueva cita" con otro paciente en la URL debe reiniciar el
    // formulario, no dejarlo con el anterior.
    this.route.queryParamMap
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.leerPacienteDeLaUrl());
  }

  private leerPacienteDeLaUrl(): void {
    const idPaciente = Number(this.route.snapshot.queryParamMap.get('paciente'));

    if (Number.isInteger(idPaciente) && idPaciente > 0) {
      this.formulario.patchValue({ idPaciente });
      this.cargarNombrePaciente(idPaciente);
      this.buscadorAbierto.set(false);
      return;
    }

    this.formulario.patchValue({ idPaciente: null });
    this.nombrePaciente.set('');
    this.buscadorAbierto.set(true);
  }

    protected elegirFechaDelCalendario(fecha: string): void {
    this.formulario.patchValue({ fecha });
  }

  protected fechaLegible(iso: string): string {
    const base = iso.length === 10 ? `${iso}T00:00:00` : iso;
    return new Date(base).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  protected elegirHorarioCita(hora: string): void {
    this.formulario.patchValue({ hora });
  }

  protected abrirBuscador(): void {
    this.buscadorAbierto.set(true);
    this.resultados.set([]);
    this.errorBusqueda.set(null);
  }

  protected cerrarBuscador(): void {
    this.buscadorAbierto.set(false);
    this.resultados.set([]);
    this.formularioBusqueda.reset({ termino: '' });
  }

  /** Busca por DNI completo o por nombre y apellidos. */
  protected buscarPaciente(): void {
    this.formularioBusqueda.markAllAsTouched();
    const termino = this.formularioBusqueda.controls.termino.value.trim();
    if (this.formularioBusqueda.invalid || termino === '') {
      this.errorBusqueda.set('Escribe un DNI de 8 dígitos o un nombre de al menos 3 letras');
      return;
    }

    this.buscando.set(true);
    this.errorBusqueda.set(null);

    this.pacientesService.listar(termino).subscribe({
      next: (pacientes) => {
        this.buscando.set(false);
        this.resultados.set(pacientes);
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

  protected elegirPaciente(paciente: Paciente): void {
    this.nombrePaciente.set(paciente.nombreCompleto);
    this.formulario.patchValue({ idPaciente: paciente.id });
    this.cerrarBuscador();
  }

  protected quitarPaciente(): void {
    this.nombrePaciente.set(null);
    this.formulario.patchValue({ idPaciente: null });
    this.cerrarBuscador();
  }

  protected iniciales(nombre: string): string {
    return nombre
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((parte) => parte.charAt(0).toUpperCase())
      .join('');
  }

  protected crear(): void {
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid || this.guardando()) {
      return;
    }

    const valores = this.formulario.getRawValue();
    if (valores.descuento > valores.costo) {
      Swal.fire({
        icon: 'error',
        title: 'Revisa los montos',
        text: 'El descuento no puede ser mayor que el costo',
        confirmButtonText: 'Entendido',
      });
      return;
    }

    this.guardando.set(true);
    this.atenciones
      .crear({
        idPaciente: valores.idPaciente as number,
        idSucursal: valores.idSucursal as number,
        idUsuario: valores.idUsuario as number,
        fecha: valores.fecha,
        hora: valores.hora,
        descripcion: valores.descripcion.trim() || null,
        costo: valores.costo,
        descuento: valores.descuento,
      })
      .subscribe({
        next: (atencion) => {
          this.guardando.set(false);
          this.atenciones.notificarCalendario();
          Swal.fire({
            icon: 'success',
            title: 'Atención creada',
            text: 'Ahora puedes registrar las sesiones del tratamiento.',
            confirmButtonText: 'Abrir atención',
          }).then(() => this.router.navigate(['/atenciones', atencion.id]));
        },
        error: (error: unknown) => {
          this.guardando.set(false);
          Swal.fire({
            icon: 'error',
            title: 'No se pudo crear la atención',
            text: errorApi(error).mensaje,
            confirmButtonText: 'Entendido',
          });
        },
      });
  }

  private cargarNombrePaciente(id: number): void {
    this.pacientesService.obtener(id).subscribe({
      next: (paciente) => this.nombrePaciente.set(paciente.nombreCompleto),
      error: () => this.nombrePaciente.set(null),
    });
  }
}