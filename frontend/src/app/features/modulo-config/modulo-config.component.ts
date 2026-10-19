import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { errorApi } from '../../core/http/error-api';
import { EmpresaSetup } from '../../core/models/setup.model';
import { SetupService } from '../../core/services/setup.service';
import { campoInvalido, mensajeDeError } from '../../shared/formularios/validacion';

const PATRON_SOLO_DIGITOS_11 = /^\d{11}$/;
/** Limite del data URL, por debajo del maximo del cuerpo JSON (1 MB). */
const MAXIMO_LOGO = 900_000;

@Component({
  selector: 'app-modulo-config',
  imports: [ReactiveFormsModule],
  templateUrl: './modulo-config.component.html',
  styleUrl: './modulo-config.component.scss',
})
export class ModuloConfigComponent implements OnInit {
  private readonly setup = inject(SetupService);

  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);
  protected readonly logoPreview = signal<string | null>(null);

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

  protected readonly mensajeCampo = mensajeDeError;
  protected readonly mostrarCampoInvalido = campoInvalido;

  ngOnInit(): void {
    this.setup.obtenerEmpresa().subscribe({
      next: (empresa) => this.volcarEnFormulario(empresa),
      error: (error: unknown) =>
        Swal.fire({
          icon: 'error',
          title: 'No se pudieron cargar los datos',
          text: errorApi(error).mensaje,
          confirmButtonText: 'Entendido',
        }),
      complete: () => this.cargando.set(false),
    });
  }

  protected onLogoChange(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];

    if (!archivo) {
      return;
    }

    if (!archivo.type.startsWith('image/')) {
      input.value = '';
      Swal.fire({
        icon: 'warning',
        title: 'Archivo no válido',
        text: 'Selecciona un archivo de imagen.',
        confirmButtonText: 'Entendido',
      });
      return;
    }

    const lector = new FileReader();
    lector.onload = () => {
      const dataUrl = typeof lector.result === 'string' ? lector.result : null;

      if (dataUrl && dataUrl.length > MAXIMO_LOGO) {
        input.value = '';
        Swal.fire({
          icon: 'warning',
          title: 'Imagen demasiado grande',
          text: 'Elige una imagen más liviana (menos de 600 KB).',
          confirmButtonText: 'Entendido',
        });
        return;
      }

      this.logoPreview.set(dataUrl);
    };
    lector.readAsDataURL(archivo);
  }

  protected quitarLogo(): void {
    this.logoPreview.set(null);
  }

  protected guardar(): void {
    this.empresaForm.markAllAsTouched();
    if (this.empresaForm.invalid) {
      return;
    }

    const valores = this.empresaForm.getRawValue();
    const datos: EmpresaSetup = {
      nombreEmpresa: valores.nombreEmpresa.trim(),
      ruc: valores.ruc.trim(),
      direccion: valores.direccion.trim() || null,
      telefono: valores.telefono.trim() || null,
      logo: this.logoPreview(),
    };

    this.guardando.set(true);
    this.setup.actualizarEmpresa(datos).subscribe({
      next: () => {
        this.guardando.set(false);
        Swal.fire({
          icon: 'success',
          title: 'Cambios guardados',
          text: 'Los datos de la empresa se actualizaron.',
          confirmButtonText: 'Entendido',
        });
      },
      error: (error: unknown) => {
        this.guardando.set(false);
        Swal.fire({
          icon: 'error',
          title: 'No se pudieron guardar los cambios',
          text: errorApi(error).mensaje,
          confirmButtonText: 'Entendido',
        });
      },
    });
  }

  private volcarEnFormulario(empresa: EmpresaSetup): void {
    this.empresaForm.setValue({
      nombreEmpresa: empresa.nombreEmpresa,
      ruc: empresa.ruc,
      direccion: empresa.direccion ?? '',
      telefono: empresa.telefono ?? '',
    });
    this.logoPreview.set(empresa.logo || null);
  }
}
