import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { errorApi } from '../../../core/http/error-api';
import { AuthService, UsuarioSesion } from '../../../core/services/auth.service';
import { campoInvalido, mensajeDeError } from '../../../shared/formularios/validacion';

const LONGITUD_MINIMA = 8;

const ETIQUETAS_PERFIL: Record<UsuarioSesion['perfil'], string> = {
  administrador: 'Administrador',
  odontologo: 'Odontólogo',
  recepcion: 'Recepción',
};

function noCoinciden(grupo: AbstractControl): ValidationErrors | null {
  const nueva = grupo.get('passwordNueva')?.value;
  const repetir = grupo.get('confirmarPassword')?.value;
  return nueva && repetir && nueva !== repetir ? { noCoinciden: true } : null;
}

@Component({
  selector: 'app-mi-cuenta',
  imports: [ReactiveFormsModule],
  templateUrl: './mi-cuenta.component.html',
  styleUrl: './mi-cuenta.component.scss',
})
export class MiCuentaComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly mensajeCampo = mensajeDeError;
  protected readonly mostrarCampoInvalido = campoInvalido;
  protected readonly usuario = this.auth.obtenerUsuario();
  protected readonly etiquetaPerfil = this.usuario ? ETIQUETAS_PERFIL[this.usuario.perfil] : '';
  protected readonly guardando = signal(false);

  protected readonly formulario = new FormGroup(
    {
      passwordActual: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      passwordNueva: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(LONGITUD_MINIMA), Validators.maxLength(72)],
      }),
      confirmarPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: [noCoinciden] }
  );

  protected iniciales(nombre: string): string {
    return nombre
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((parte) => parte.charAt(0).toUpperCase())
      .join('');
  }

  protected cambiarPassword(): void {
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid || this.guardando()) {
      return;
    }

    const valores = this.formulario.getRawValue();
    this.guardando.set(true);

    this.auth
      .cambiarPassword(valores.passwordActual, valores.passwordNueva)
      .subscribe({
        next: () => this.finalizar(),
        error: (error: unknown) => {
          this.guardando.set(false);
          Swal.fire({
            icon: 'error',
            title: 'No se pudo cambiar la contraseña',
            text: errorApi(error).mensaje,
            confirmButtonText: 'Entendido',
          });
        },
      });
  }

  /**
   * El cambio de contraseña cierra las sesiones abiertas, incluida esta.
   * Por eso se avisa y se vuelve al inicio de sesión.
   */
  private finalizar(): void {
    this.guardando.set(false);
    this.auth.limpiarSesion();

    Swal.fire({
      icon: 'success',
      title: 'Contraseña actualizada',
      text: 'Por seguridad, tus sesiones se cerraron. Inicia sesión de nuevo.',
      confirmButtonText: 'Ir al inicio de sesión',
      allowOutsideClick: false,
    }).then(() => this.router.navigateByUrl('/login'));
  }
}