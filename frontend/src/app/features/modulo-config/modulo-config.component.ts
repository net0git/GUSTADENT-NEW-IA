import { Component, inject, signal } from '@angular/core';
import { SetupService } from '../../core/services/setup.service';
import { EmpresaSetup } from '../../core/models/setup.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-modulo-config',
  templateUrl: './modulo-config.component.html',
  styleUrl: './modulo-config.component.scss',
  imports: [FormsModule],
})
export class ModuloConfigComponent {
  private readonly setup = inject(SetupService);
  private readonly empresa = this.setup.obtenerEstado().pipe(takeUntilDestroyed());

  // Sin readonly para poder reasignar
  protected datosEmpresa: EmpresaSetup = {
    nombreEmpresa: '',
    ruc: '',
    direccion: '',
    telefono: '',
    logo: '',
  };

  protected mostrandoFormulario = false;
  protected logoPreview = '';

  ngOnInit(): void {
    // Suscribirse para obtener datos de empresa cuando el backend esté listo
    this.empresa.subscribe({
      next: (estado) => {
        // TODO: Descomentar cuando el endpoint /api/setup/empresa esté implementado
        // this.datosEmpresa = estado.empresa || this.datosEmpresa;
      },
    });
  }

  protected onLogoChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.logoPreview = e.target.result;
        this.datosEmpresa.logo = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  protected guardarEmpresa(): void {
    this.mostrandoFormulario = false;
    // TODO: Llamar a this.setup.registrarEmpresa(this.datosEmpresa, token);
    // Por ahora solo cerramos el formulario
    this.datosEmpresa = {
      nombreEmpresa: '',
      ruc: '',
      direccion: '',
      telefono: '',
      logo: '',
    };
    this.logoPreview = '';
  }
}