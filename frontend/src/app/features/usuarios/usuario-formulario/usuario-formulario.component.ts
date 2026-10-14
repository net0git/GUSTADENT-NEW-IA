import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, of, switchMap } from 'rxjs';
import Swal from 'sweetalert2';
import { errorApi } from '../../../core/http/error-api';
import {
  DatosUsuario,
  ETIQUETAS_PERFIL,
  Perfil,
  Usuario,
} from '../../../core/models/usuario.model';
import { Sucursal } from '../../../core/models/catalogo.model';
import { UsuariosService } from '../../../core/services/usuarios.service';
import { campoInvalido, mensajeDeError } from '../../../shared/formularios/validacion';

const PATRON_DNI = /^\d{8}$/;
const PATRON_USERNAME = /^[A-Za-z0-9._-]+$/;

function passwordsCoinciden(grupo: AbstractControl): ValidationErrors | null {
  const password = grupo.get('password')?.value;
  const confirmar = grupo.get('confirmarPassword')?.value;
  return password && confirmar && password !== confirmar ? { noCoinciden: true } : null;
}

@Component({
  selector: 'app-usuario-formulario',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './usuario-formulario.component.html',
  styleUrl: './usuario-formulario.component.scss',
})
export class UsuarioFormularioComponent implements OnInit {
  private readonly usuariosService = inject(UsuariosService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly mensajeCampo = mensajeDeError;
  protected readonly mostrarCampoInvalido = campoInvalido;
  protected readonly etiquetasPerfil = ETIQUETAS_PERFIL;
  protected readonly perfiles = Object.keys(ETIQUETAS_PERFIL) as Perfil[];

  private readonly idRuta = this.route.snapshot.paramMap.get('id');
  protected readonly idUsuario = this.idRuta ? Number(this.idRuta) : null;
  protected readonly esEdicion = this.idUsuario !== null;

  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);
  protected readonly sucursales = signal<Sucursal[]>([]);
  protected readonly sucursalesSeleccionadas = signal<number[]>([]);
  protected readonly sinSucursales = computed(() => !this.cargando() && this.sucursales().length === 0);

  private sucursalesOriginales: number[] = [];

  protected readonly formulario = new FormGroup(
    {
      nombreCompleto: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(80)],
      }),
      dni: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.pattern(PATRON_DNI)],
      }),
      especialidad: new FormControl('', {
        nonNullable: true,
        validators: [Validators.maxLength(25)],
      }),
      telefono: new FormControl('', {
        nonNullable: true,
        validators: [Validators.maxLength(16)],
      }),
      username: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(20), Validators.pattern(PATRON_USERNAME)],
      }),
      perfil: new FormControl<Perfil>('odontologo', {
        nonNullable: true,
        validators: [Validators.required],
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
    if (this.esEdicion) {
      this.formulario.controls.password.disable();
      this.formulario.controls.confirmarPassword.disable();
    }

    this.usuariosService.listarSucursales().subscribe({
      next: (sucursales) => {
        this.sucursales.set(sucursales.filter((sucursal) => sucursal.activo));
        if (!this.esEdicion) {
          this.cargando.set(false);
        }
      },
      error: (error: unknown) => this.finCargaConError(errorApi(error).mensaje),
    });

    if (this.esEdicion && this.idUsuario !== null) {
      this.usuariosService.obtener(this.idUsuario).subscribe({
        next: (usuario) => {
          this.cargarDatos(usuario);
          this.cargando.set(false);
        },
        error: (error: unknown) => this.finCargaConError(errorApi(error).mensaje),
      });
    }
  }

  protected alternarSucursal(id: number, marcada: boolean): void {
    this.sucursalesSeleccionadas.update((actuales) =>
      marcada ? [...actuales, id] : actuales.filter((existente) => existente !== id)
    );
  }

  protected estaSeleccionada(id: number): boolean {
    return this.sucursalesSeleccionadas().includes(id);
  }

  protected guardar(): void {
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid) {
      return;
    }

    this.guardando.set(true);
    const datos = this.datosFormulario();
    const peticion: Observable<Usuario> = this.esEdicion
      ? this.actualizar(datos)
      : this.usuariosService.crear({
          ...datos,
          password: this.formulario.controls.password.value,
          sucursales: this.sucursalesSeleccionadas(),
        });

    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        Swal.fire({
          icon: 'success',
          title: this.esEdicion ? 'Usuario actualizado' : 'Usuario creado',
          confirmButtonText: 'Aceptar',
        }).then(() => this.router.navigateByUrl('/usuarios'));
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

  private actualizar(datos: DatosUsuario): Observable<Usuario> {
    const id = this.idUsuario as number;
    const sucursalesCambiaron = !this.mismasSucursales(this.sucursalesSeleccionadas(), this.sucursalesOriginales);

    return this.usuariosService.actualizar(id, datos).pipe(
      switchMap(() =>
        sucursalesCambiaron
          ? this.usuariosService.asignarSucursales(id, this.sucursalesSeleccionadas())
          : of(null)
      ),
      switchMap(() => this.usuariosService.obtener(id))
    );
  }

  private datosFormulario(): DatosUsuario {
    const valores = this.formulario.getRawValue();
    return {
      dni: valores.dni.trim(),
      nombreCompleto: valores.nombreCompleto.trim(),
      especialidad: valores.especialidad.trim() || null,
      telefono: valores.telefono.trim() || null,
      username: valores.username.trim(),
      perfil: valores.perfil,
    };
  }

  private cargarDatos(usuario: Usuario): void {
    this.formulario.patchValue({
      nombreCompleto: usuario.nombreCompleto,
      dni: usuario.dni,
      especialidad: usuario.especialidad ?? '',
      telefono: usuario.telefono ?? '',
      username: usuario.username,
      perfil: usuario.perfil,
    });
    this.sucursalesOriginales = usuario.sucursales.map((sucursal) => sucursal.id);
    this.sucursalesSeleccionadas.set([...this.sucursalesOriginales]);
  }

  private mismasSucursales(a: number[], b: number[]): boolean {
    return a.length === b.length && [...a].sort().join() === [...b].sort().join();
  }

  private finCargaConError(mensaje: string): void {
    this.cargando.set(false);
    Swal.fire({ icon: 'error', title: 'No se pudo cargar', text: mensaje, confirmButtonText: 'Entendido' });
  }
}
