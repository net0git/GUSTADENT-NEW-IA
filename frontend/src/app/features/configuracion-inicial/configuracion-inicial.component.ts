import { Component, OnInit, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import Swal from 'sweetalert2';
import { errorApi } from '../../core/http/error-api';
import { EstadoSetup } from '../../core/models/setup.model';
import { SetupService } from '../../core/services/setup.service';
import { campoInvalido, mensajeDeError } from '../../shared/formularios/validacion';

type Paso = 1 | 2 | 3;

const PATRON_SOLO_DIGITOS_8 = /^\d{8}$/;
const PATRON_SOLO_DIGITOS_11 = /^\d{11}$/;
const PATRON_USERNAME = /^[A-Za-z0-9._-]+$/;

function passwordsCoinciden(grupo: AbstractControl): ValidationErrors | null {
  const password = grupo.get('password')?.value;
  const confirmar = grupo.get('confirmarPassword')?.value;
  return password && confirmar && password !== confirmar ? { noCoinciden: true } : null;
}

@Component({
  selector: 'app-configuracion-inicial',
  imports: [ReactiveFormsModule],
  templateUrl: './configuracion-inicial.component.html',
  styleUrl: './configuracion-inicial.component.scss',
})
export class ConfiguracionInicialComponent implements OnInit {
  private readonly setup = inject(SetupService);
  private readonly router = inject(Router);

  protected readonly pasos: { numero: Paso; titulo: string }[] = [
    { numero: 1, titulo: 'Empresa' },
    { numero: 2, titulo: 'Sucursal' },
    { numero: 3, titulo: 'Administrador' },
  ];

  protected readonly pasoActual = signal<Paso>(1);
  protected readonly cargando = signal(false);
  protected readonly cargandoEstado = signal(true);

  protected readonly tokenControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });

  protected readonly empresaForm = new FormGroup({
    nombreEmpresa: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(50)],
    }),
    ruc: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(PATRON_SOLO_DIGITOS_11)],
    }),
    direccion: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(80)],
    }),
    telefono: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(16)],
    }),
  });

  protected readonly sucursalForm = new FormGroup({
    nombre: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(20)],
    }),
    direccion: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(80)],
    }),
  });

  protected readonly administradorForm = new FormGroup(
    {
      nombreCompleto: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(80)],
      }),
      dni: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.pattern(PATRON_SOLO_DIGITOS_8)],
      }),
      username: new FormControl('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.maxLength(20),
          Validators.pattern(PATRON_USERNAME),
        ],
      }),
      password: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(8), Validators.maxLength(72)],
      }),
      confirmarPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: [passwordsCoinciden] }
  );

  ngOnInit(): void {
    this.setup.obtenerEstado().subscribe({
      next: (estado) => {
        this.cargandoEstado.set(false);
        if (estado.configurado) {
          this.router.navigateByUrl('/login');
          return;
        }
        this.pasoActual.set(this.primerPasoPendiente(estado));
      },
      error: (error: unknown) => {
        this.cargandoEstado.set(false);
        this.mostrarError(errorApi(error).mensaje);
      },
    });
  }

  protected guardarEmpresa(): void {
    if (!this.validarFormularios(this.empresaForm)) {
      return;
    }
    const valores = this.empresaForm.getRawValue();
    this.ejecutarPaso(
      this.setup.registrarEmpresa(
        {
          nombreEmpresa: valores.nombreEmpresa.trim(),
          ruc: valores.ruc,
          direccion: valores.direccion.trim() || null,
          telefono: valores.telefono.trim() || null,
          logo: '', // Campo añadido por el nuevo modelo EmpresaSetup
        },
        this.tokenControl.value
      ),
      2
    );
  }

  protected guardarSucursal(): void {
    if (!this.validarFormularios(this.sucursalForm)) {
      return;
    }
    const valores = this.sucursalForm.getRawValue();
    this.ejecutarPaso(
      this.setup.registrarSucursal(
        {
          nombre: valores.nombre.trim(),
          direccion: valores.direccion.trim() || null,
        },
        this.tokenControl.value
      ),
      3
    );
  }

  protected guardarAdministrador(): void {
    if (!this.validarFormularios(this.administradorForm)) {
      return;
    }
    const valores = this.administradorForm.getRawValue();
    this.ejecutarPaso(
      this.setup.registrarAdministrador(
        {
          username: valores.username.trim(),
          password: valores.password,
          dni: valores.dni,
          nombreCompleto: valores.nombreCompleto.trim(),
        },
        this.tokenControl.value
      ),
      'final'
    );
  }

  protected readonly mensajeCampo = mensajeDeError;
  protected readonly mostrarCampoInvalido = campoInvalido;

  private ejecutarPaso(peticion: Observable<EstadoSetup>, siguiente: Paso | 'final'): void {
    this.cargando.set(true);
    peticion.subscribe({
      next: () => {
        this.cargando.set(false);
        this.avanzar(siguiente);
      },
      error: (error: unknown) => {
        this.cargando.set(false);
        this.tratarError(error, siguiente);
      },
    });
  }

  private tratarError(error: unknown, siguiente: Paso | 'final'): void {
    const { codigo, mensaje } = errorApi(error);

    if (codigo === 'PASO_YA_CONFIGURADO') {
      this.avanzar(siguiente);
      return;
    }

    if (codigo === 'SETUP_TOKEN_INVALIDO') {
      this.tokenControl.markAsTouched();
      this.mostrarError(mensaje);
      return;
    }

    this.mostrarError(mensaje);
  }

  private avanzar(siguiente: Paso | 'final'): void {
    if (siguiente === 'final') {
      Swal.fire({
        icon: 'success',
        title: 'Configuración completada',
        text: 'Ahora puedes iniciar sesión con el administrador creado.',
        confirmButtonText: 'Ir al inicio de sesión',
      }).then(() => this.router.navigateByUrl('/login'));
      return;
    }
    this.pasoActual.set(siguiente);
  }

  private primerPasoPendiente(estado: EstadoSetup): Paso {
    if (!estado.empresa) return 1;
    if (!estado.sucursal) return 2;
    return 3;
  }

  private validarFormularios(formulario: FormGroup): boolean {
    this.tokenControl.markAsTouched();
    if (this.tokenControl.invalid) {
      this.mostrarError('Ingresa el token de configuración');
      return false;
    }

    formulario.markAllAsTouched();
    if (formulario.invalid) {
      return false;
    }
    return true;
  }

  private mostrarError(mensaje: string): void {
    Swal.fire({ icon: 'error', title: 'No se pudo continuar', text: mensaje, confirmButtonText: 'Entendido' });
  }
}
