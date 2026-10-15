import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { errorApi } from '../../../core/http/error-api';
import { CondicionPaciente, PacientesService } from '../../../core/services/pacientes.service';
import { campoInvalido, mensajeDeError } from '../../../shared/formularios/validacion';

const LONGITUD_MAXIMA = 500;

/** Una fila de la lista, venga de la base o esté solo en pantalla. */
interface FilaCondicion {
  clave: string;
  texto: string;
  id: number | null;
  autor: string | null;
}

/**
 * Lista de condiciones del paciente. Se usa al crear o editar un paciente y
 * tambien dentro de cada atencion, donde se pueden agregar, corregir o quitar.
 *
 * Si todavia no hay id de paciente (estamos creandolo), las condiciones se
 * guardan en pantalla y se avisan al componente padre para que las registre
 * cuando el paciente exista.
 */
@Component({
  selector: 'app-condiciones-paciente',
  imports: [ReactiveFormsModule],
  templateUrl: './condiciones-paciente.component.html',
  styleUrl: './condiciones-paciente.component.scss',
})
export class CondicionesPacienteComponent implements OnInit {
  readonly idPaciente = input<number | null>(null);
  /** Si se pasa, las condiciones nuevas quedan vinculadas a esa cita. */
  readonly idAtencion = input<number | null>(null);

  /** Condiciones anotadas mientras se crea el paciente. */
  readonly condicionesPendientes = output<string[]>();

  protected readonly condiciones = signal<CondicionPaciente[]>([]);
  protected readonly locales = signal<string[]>([]);
  protected readonly cargando = signal(false);
  protected readonly editandoIndice = signal<number | null>(null);

  /** Agregar y editar usan formularios separados para no escribirse encima. */
  protected readonly formularioAgregar = new FormGroup({
    descripcion: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(LONGITUD_MAXIMA)],
    }),
  });

  protected readonly formularioEdicion = new FormGroup({
    descripcion: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(LONGITUD_MAXIMA)],
    }),
  });

  private readonly pacientes = inject(PacientesService);

  /** Sin id de paciente la lista todavia no se puede guardar en la base. */
  protected readonly esPendiente = computed(() => this.idPaciente() === null);

  protected readonly filas = computed<FilaCondicion[]>(() => {
    if (this.esPendiente()) {
      return this.locales().map((texto, indice) => ({
        clave: `local-${indice}`,
        texto,
        id: null,
        autor: null,
      }));
    }

    return this.condiciones().map((condicion) => ({
      clave: `base-${condicion.id}`,
      texto: condicion.descripcion,
      id: condicion.id,
      autor: condicion.nombreUsuario,
    }));
  });

  ngOnInit(): void {
    if (!this.esPendiente()) {
      this.cargar();
    }
  }

  protected mensajeCampo = mensajeDeError;
  protected mostrarCampoInvalido = campoInvalido;

  protected agregar(): void {
    this.formularioAgregar.markAllAsTouched();
    if (this.formularioAgregar.invalid) {
      return;
    }

    const texto = this.formularioAgregar.controls.descripcion.value.trim();

    if (this.esPendiente()) {
      this.locales.update((actuales) => [...actuales, texto]);
      this.condicionesPendientes.emit(this.locales());
      this.formularioAgregar.reset({ descripcion: '' });
      return;
    }

    const idPaciente = this.idPaciente();
    this.pacientes.crearCondicion(idPaciente as number, texto, this.idAtencion()).subscribe({
      next: () => {
        this.formularioAgregar.reset({ descripcion: '' });
        this.cargar();
      },
      error: (error: unknown) => this.mostrarError(error),
    });
  }

  protected editar(fila: FilaCondicion): void {
    this.editandoIndice.set(this.filas().indexOf(fila));
    this.formularioEdicion.reset({ descripcion: fila.texto });
  }

  protected guardarEdicion(fila: FilaCondicion): void {
    this.formularioEdicion.markAllAsTouched();
    if (this.formularioEdicion.invalid) {
      return;
    }

    const texto = this.formularioEdicion.controls.descripcion.value.trim();

    if (fila.id === null) {
      const indice = Number(fila.clave.replace('local-', ''));
      this.locales.update((actuales) =>
        actuales.map((actual, posicion) => (posicion === indice ? texto : actual))
      );
      this.condicionesPendientes.emit(this.locales());
      this.editandoIndice.set(null);
      this.formularioEdicion.reset({ descripcion: '' });
      return;
    }

    this.pacientes.actualizarCondicion(fila.id, texto).subscribe({
      next: () => {
        this.editandoIndice.set(null);
        this.formularioEdicion.reset({ descripcion: '' });
        this.cargar();
      },
      error: (error: unknown) => this.mostrarError(error),
    });
  }

  protected cancelarEdicion(): void {
    this.editandoIndice.set(null);
    this.formularioEdicion.reset({ descripcion: '' });
  }

  protected quitar(fila: FilaCondicion): void {
    if (fila.id === null) {
      const indice = Number(fila.clave.replace('local-', ''));
      this.locales.update((actuales) => actuales.filter((_, posicion) => posicion !== indice));
      this.condicionesPendientes.emit(this.locales());
      return;
    }

    this.pacientes.cambiarEstadoCondicion(fila.id, false).subscribe({
      next: () => this.cargar(),
      error: (error: unknown) => this.mostrarError(error),
    });
  }

  /** Está editando esta fila. */
  protected editando(fila: FilaCondicion): boolean {
    return this.editandoIndice() === this.filas().indexOf(fila);
  }

  private cargar(): void {
    const idPaciente = this.idPaciente();
    if (idPaciente === null) {
      return;
    }

    this.cargando.set(true);
    this.pacientes.condiciones(idPaciente).subscribe({
      next: (condiciones) => {
        this.condiciones.set(condiciones);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.cargando.set(false);
        this.mostrarError(error);
      },
    });
  }

  private mostrarError(error: unknown): void {
    Swal.fire({
      icon: 'error',
      title: 'No se pudo completar la acción',
      text: errorApi(error).mensaje,
      confirmButtonText: 'Entendido',
    });
  }
}