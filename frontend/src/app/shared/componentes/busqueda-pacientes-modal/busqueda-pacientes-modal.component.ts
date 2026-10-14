import { Component, OnDestroy, OnInit, effect, inject, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { errorApi } from '../../../core/http/error-api';
import { Paciente, PacientesService } from '../../../core/services/pacientes.service';
import { campoInvalido } from '../../../shared/formularios/validacion';

const TIEMPO_CONFIRMACION_MS = 2000;

@Component({
  selector: 'app-busqueda-pacientes-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './busqueda-pacientes-modal.component.html',
  styleUrl: './busqueda-pacientes-modal.component.scss',
})
export class BusquedaPacientesModalComponent implements OnInit, OnDestroy {
  private readonly pacientesService = inject(PacientesService);

  readonly abierto = input.required<boolean>();
  readonly cerrado = output<void>();
  readonly nuevaCitaSolicitada = output<Paciente>();

  protected readonly mostrarCampoInvalido = campoInvalido;
  protected readonly pacientes = signal<Paciente[]>([]);
  protected readonly cargando = signal(false);
  protected readonly buscados = signal(false);
  protected readonly mensajeError = signal<string | null>(null);
  protected readonly dniCopiado = signal<number | null>(null);

  protected readonly formulario = new FormGroup({
    termino: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    effect(() => {
      if (this.abierto()) {
        this.reiniciar();
      }
    });
  }

  ngOnInit(): void {
    document.addEventListener('keydown', this.alPulsarEscape);
  }

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.alPulsarEscape);
  }

  protected buscar(): void {
    const termino = this.formulario.controls.termino.value.trim();
    if (termino === '') {
      this.mensajeError.set('Escribe un DNI, nombre o apellido para buscar');
      return;
    }

    this.cargando.set(true);
    this.mensajeError.set(null);

    this.pacientesService.listar(termino).subscribe({
      next: (pacientes) => {
        this.pacientes.set(pacientes);
        this.buscados.set(true);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.cargando.set(false);
        this.mensajeError.set(errorApi(error).mensaje);
      },
    });
  }

  protected copiarDni(paciente: Paciente): void {
    this.escribirEnPortapapeles(paciente.dni);
    this.dniCopiado.set(paciente.id);
    window.setTimeout(() => {
      if (this.dniCopiado() === paciente.id) {
        this.dniCopiado.set(null);
      }
    }, TIEMPO_CONFIRMACION_MS);
  }

  protected nuevaCita(paciente: Paciente): void {
    this.nuevaCitaSolicitada.emit(paciente);
  }

  protected iniciales(paciente: Paciente): string {
    return `${paciente.nombres} ${paciente.apPaterno}`
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((parte) => parte.charAt(0).toUpperCase())
      .join('');
  }

  protected fechaNacimiento(paciente: Paciente): string {
    if (!paciente.fechaNacimiento) {
      return 'Sin fecha de nacimiento';
    }
    const [anio, mes, dia] = paciente.fechaNacimiento.split('-');
    return `${dia}/${mes}/${anio}`;
  }

  /**
   * Usa la API estandar del navegador y, si no esta disponible,
   * recurre al metodo antiguo.
   */
  private escribirEnPortapapeles(texto: string): void {
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(texto);
      return;
    }

    const auxiliar = document.createElement('textarea');
    auxiliar.value = texto;
    auxiliar.setAttribute('readonly', '');
    auxiliar.style.position = 'fixed';
    auxiliar.style.opacity = '0';
    document.body.appendChild(auxiliar);
    auxiliar.select();
    document.execCommand('copy');
    document.body.removeChild(auxiliar);
  }

  private readonly alPulsarEscape = (evento: KeyboardEvent): void => {
    if (evento.key === 'Escape' && this.abierto()) {
      this.cerrado.emit();
    }
  };

  private reiniciar(): void {
    this.formulario.reset({ termino: '' });
    this.pacientes.set([]);
    this.buscados.set(false);
    this.cargando.set(false);
    this.mensajeError.set(null);
    this.dniCopiado.set(null);
  }
}