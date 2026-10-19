import { Component } from '@angular/core';
import { SetupService } from '../../core/services/setup.service';
import { EmpresaSetup } from '../../core/models/setup.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-modulo-config',
  templateUrl: './modulo-config.component.html',
  styleUrl: './modulo-config.component.scss',
})
export class ModuloConfigComponent {
  private readonly setup = inject(SetupService);
  private readonly empresa = this.setup.obtenerEstado().pipe(takeUntilDestroyed());

  protected readonly empresaData = this.empresa.pipe(
    takeUntilDestroyed(),
    // Por ahora usaremos datos estáticos hasta que el backend proporcione la ruta completa
    // En un futuro: mergeMap(estado => this.setup.obtenerEmpresa()) 
  );

  // Datos de empresa para el formulario (se cargarán del servicio o localStorage)
  protected readonly datosEmpresa: EmpresaSetup = {
    nombreEmpresa: '',
    ruc: '',
    direccion: '',
    telefono: '',
    logo: '',
  };

  protected readonly mostrandoFormulario = false;
  protected readonly logoPreview = '';

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