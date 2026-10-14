import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { errorApi } from '../../../core/http/error-api';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly cargando = signal(false);

  protected readonly formulario = new FormGroup({
    username: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(20)],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(72)],
    }),
  });

  protected iniciarSesion(): void {
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid) {
      return;
    }

    const { username, password } = this.formulario.getRawValue();
    this.cargando.set(true);

    this.auth.iniciarSesion(username.trim(), password).subscribe({
      next: () => {
        this.cargando.set(false);
        this.router.navigateByUrl('/inicio');
      },
      error: (error: unknown) => {
        this.cargando.set(false);
        Swal.fire({
          icon: 'error',
          title: 'No se pudo iniciar sesión',
          text: errorApi(error).mensaje,
          confirmButtonText: 'Entendido',
        });
      },
    });
  }
}
