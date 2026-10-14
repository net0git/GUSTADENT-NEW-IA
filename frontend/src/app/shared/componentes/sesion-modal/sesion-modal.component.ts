import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatosSesion, Sesion } from '../../../core/services/atenciones.service';
import { aIso, horaIso } from '../../../shared/fechas/fechas';
import { campoInvalido, mensajeDeError, montoDentroDelTotal } from '../../../shared/formularios/validacion';
import { SelectorHorarioComponent } from '../selector-horario/selector-horario.component';

/** Al editar, se recibe la sesion; al crear, solo la fecha sugerida. */
@Component({
  selector: 'app-sesion-modal',
  imports: [ReactiveFormsModule, SelectorHorarioComponent],
  templateUrl: './sesion-modal.component.html',
  styleUrl: './sesion-modal.component.scss',
})
export class SesionModalComponent {
  readonly visible = input.required<boolean>();
  readonly sesion = input<Sesion | null>(null);
  readonly fechaSugerida = input<string | null>(null);
  readonly numSesiones = input<number>(0);
  /** Cuánto puede llevar esta sesión sin pasar del total indicado. */
  readonly limite = input<number | null>(null);

  readonly cerrado = output<void>();
  readonly guardado = output<DatosSesion>();

  protected readonly mensajeCampo = mensajeDeError;
  protected readonly mostrarCampoInvalido = campoInvalido;
  protected readonly guardando = signal(false);

  protected readonly formulario = new FormGroup({
    fecha: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    hora: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    monto: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0), montoDentroDelTotal(() => this.limite())],
    }),
    observaciones: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(2000)],
    }),
  });

  private static readonly HORARIO_POR_DEFECTO = '09:00';

  constructor() {
    effect(() => {
      if (this.visible()) {
        this.cargarDatos();
      }
    });
  }

  protected esEdicion(): boolean {
    return this.sesion() !== null;
  }

  protected titulo(): string {
    const sesion = this.sesion();
    return sesion ? `Editar sesión ${sesion.numero}` : `Nueva sesión ${this.numSesiones() + 1}`;
  }

  protected enviar(): void {
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid || this.guardando()) {
      return;
    }

    const valores = this.formulario.getRawValue();
    this.guardado.emit({
      fechaHora: `${valores.fecha}T${valores.hora}:00`,
      observaciones: valores.observaciones.trim() || null,
      monto: valores.monto,
    });
  }

  protected pedirCierre(): void {
    if (!this.guardando()) {
      this.cerrado.emit();
    }
  }

  private cargarDatos(): void {
    const sesion = this.sesion();
    if (sesion) {
      const instante = new Date(sesion.fechaHora);
      this.formulario.reset({
        fecha: aIso(instante),
        hora: horaIso(instante),
        monto: sesion.monto,
        observaciones: sesion.observaciones ?? '',
      });
      return;
    }

    this.formulario.reset({
      fecha: this.fechaSugerida() ?? '',
      hora: SesionModalComponent.HORARIO_POR_DEFECTO,
      monto: 0,
      observaciones: '',
    });
  }
}