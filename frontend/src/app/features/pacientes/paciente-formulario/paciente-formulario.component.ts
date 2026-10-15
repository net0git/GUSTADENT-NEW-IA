import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { errorApi } from '../../../core/http/error-api';
import { Procedencia } from '../../../core/models/catalogo.model';
import { CatalogosService } from '../../../core/services/catalogos.service';
import { DatosPaciente, Paciente, PacientesService } from '../../../core/services/pacientes.service';
import { campoInvalido, mensajeDeError } from '../../../shared/formularios/validacion';
import { hoyIso } from '../../../shared/fechas/fechas';
import { CondicionesPacienteComponent } from '../../../shared/componentes/condiciones-paciente/condiciones-paciente.component';

const PATRON_DNI = /^\d{8}$/;
const FECHA_MAXIMA = hoyIso();

@Component({
  selector: 'app-paciente-formulario',
  imports: [ReactiveFormsModule, RouterLink, CondicionesPacienteComponent],
  templateUrl: './paciente-formulario.component.html',
  styleUrl: './paciente-formulario.component.scss',
})
export class PacienteFormularioComponent implements OnInit {
  private readonly pacientesService = inject(PacientesService);
  private readonly catalogos = inject(CatalogosService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly mensajeCampo = mensajeDeError;
  protected readonly mostrarCampoInvalido = campoInvalido;

  private readonly idRuta = this.route.snapshot.paramMap.get('id');
  protected readonly id = this.idRuta ? Number(this.idRuta) : null;
  protected readonly esEdicion = this.id !== null;

  /** Condiciones anotadas antes de que el paciente exista en la base. */
  protected readonly condicionesPendientes = signal<string[]>([]);

  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);
  protected readonly procedencias = signal<Procedencia[]>([]);
  protected readonly fechaMaxima = FECHA_MAXIMA;

  protected readonly formulario = new FormGroup({
    dni: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(PATRON_DNI)],
    }),
    nombres: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(40)],
    }),
    apPaterno: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(20)],
    }),
    apMaterno: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(20)],
    }),
    fechaNacimiento: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(/^\d{4}-\d{2}-\d{2}$/)],
    }),
    sexo: new FormControl<'M' | 'F' | ''>('', { nonNullable: true }),
    telefono: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(16)],
    }),
    idProcedencia: new FormControl<number | null>(null),
  });

  ngOnInit(): void {
    this.catalogos.listarProcedencias().subscribe({
      next: (procedencias) => {
        this.procedencias.set(procedencias);
        this.cargarPaciente();
      },
      error: (error: unknown) => this.finCargaConError(errorApi(error).mensaje),
    });
  }

  protected guardar(): void {
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid || this.guardando()) {
      return;
    }

    const id = this.id;
    const peticion = id === null ? this.crear() : this.pacientesService.actualizar(id, this.datos());

    this.guardando.set(true);
    peticion.subscribe({
      next: (paciente) => {
        this.guardando.set(false);

        // Las condiciones anotadas antes de crear el paciente se registran ahora
        // que ya existe su id.
        const pendientes = this.condicionesPendientes();
        if (id === null && pendientes.length > 0) {
          this.guardarCondiciones(paciente.id, pendientes);
          return;
        }

        this.avisarGuardado(id === null);
      },
      error: (error: unknown) => {
        this.guardando.set(false);
        Swal.fire({
          icon: 'error',
          title: 'No se pudo guardar',
          text: errorApi(error).mensaje,
          confirmButtonText: 'Entendido',
        });
      },
    });
  }

  private crear() {
    return this.pacientesService.crear(this.datos());
  }

  /** Registra una por una las condiciones que se anotaron antes de crear. */
  private guardarCondiciones(idPaciente: number, descripciones: string[]): void {
    const pendientes = [...descripciones];

    const siguiente = (): void => {
      const descripcion = pendientes.shift();
      if (descripcion === undefined) {
        this.avisarGuardado(true);
        return;
      }

      this.pacientesService.crearCondicion(idPaciente, descripcion).subscribe({
        next: siguiente,
        error: (error: unknown) => this.finCargaConError(errorApi(error).mensaje),
      });
    };

    siguiente();
  }

  private avisarGuardado(esNuevo: boolean): void {
    Swal.fire({
      icon: 'success',
      title: esNuevo ? 'Paciente registrado' : 'Paciente actualizado',
      confirmButtonText: 'Aceptar',
    }).then(() => this.router.navigateByUrl('/pacientes'));
  }

  private datos(): DatosPaciente {
    const valores = this.formulario.getRawValue();
    return {
      dni: valores.dni.trim(),
      nombres: valores.nombres.trim(),
      apPaterno: valores.apPaterno.trim(),
      apMaterno: valores.apMaterno.trim() || null,
      fechaNacimiento: valores.fechaNacimiento || null,
      sexo: valores.sexo === '' ? null : valores.sexo,
      telefono: valores.telefono.trim() || null,
      idProcedencia: valores.idProcedencia,
    };
  }

  private cargarPaciente(): void {
    const id = this.id;
    if (id === null) {
      this.cargando.set(false);
      return;
    }

    this.pacientesService.obtener(id).subscribe({
      next: (paciente) => {
        this.cargarDatos(paciente);
        this.cargando.set(false);
      },
      error: (error: unknown) => this.finCargaConError(errorApi(error).mensaje),
    });
  }

  private cargarDatos(paciente: Paciente): void {
    this.formulario.patchValue({
      dni: paciente.dni,
      nombres: paciente.nombres,
      apPaterno: paciente.apPaterno,
      apMaterno: paciente.apMaterno ?? '',
      fechaNacimiento: paciente.fechaNacimiento ?? '',
      sexo: paciente.sexo ?? '',
      telefono: paciente.telefono ?? '',
      idProcedencia: paciente.idProcedencia,
    });
  }

  private finCargaConError(mensaje: string): void {
    this.cargando.set(false);
    Swal.fire({ icon: 'error', title: 'No se pudo cargar', text: mensaje, confirmButtonText: 'Entendido' });
  }
}