import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { errorApi } from '../../../core/http/error-api';
import { Paciente, PacientesService } from '../../../core/services/pacientes.service';
import {
  PaginadorComponent,
  TAMANO_PAGINA,
  rebanarPagina,
} from '../../../shared/componentes/paginador/paginador.component';

@Component({
  selector: 'app-pacientes-lista',
  imports: [ReactiveFormsModule, RouterLink, PaginadorComponent],
  templateUrl: './pacientes-lista.component.html',
  styleUrl: './pacientes-lista.component.scss',
})
export class PacientesListaComponent implements OnInit {
  private readonly pacientesService = inject(PacientesService);

  protected readonly formularioBusqueda = new FormGroup({
    termino: new FormControl('', { nonNullable: true }),
  });
  protected readonly pacientes = signal<Paciente[]>([]);
  protected readonly cargando = signal(true);
  protected readonly hayBusqueda = signal(false);

  /** Fragmento de la tabla que se está viendo. */
  protected readonly pagina = signal(1);
  protected readonly tamano = signal(TAMANO_PAGINA);
  protected readonly pacientesPagina = computed(() =>
    rebanarPagina(this.pacientes(), this.pagina(), this.tamano())
  );

  ngOnInit(): void {
    this.cargar();
  }

  protected buscar(): void {
    const termino = this.terminoBusqueda();
    this.hayBusqueda.set(termino !== '');
    this.cargar();
  }

  protected limpiarBusqueda(): void {
    this.formularioBusqueda.reset({ termino: '' });
    this.hayBusqueda.set(false);
    this.cargar();
  }

  protected terminoBusqueda(): string {
    return this.formularioBusqueda.controls.termino.value.trim();
  }

  /** Al cambiar cuántas filas se ven, se vuelve a la primera página. */
  protected cambiarTamano(tamano: number): void {
    this.tamano.set(tamano);
    this.pagina.set(1);
  }

  protected iniciales(paciente: Paciente): string {
    const partes = `${paciente.nombres} ${paciente.apPaterno}`.trim().split(/\s+/);
    return partes
      .slice(0, 2)
      .map((parte) => parte.charAt(0).toUpperCase())
      .join('');
  }

  protected edad(paciente: Paciente): string {
    if (!paciente.fechaNacimiento) {
      return 'Sin fecha';
    }
    const nacimiento = new Date(`${paciente.fechaNacimiento}T00:00:00`);
    const hoy = new Date();
    let anios = hoy.getFullYear() - nacimiento.getFullYear();
    const mesActual = hoy.getMonth();
    const mesNacimiento = nacimiento.getMonth();
    if (mesActual < mesNacimiento || (mesActual === mesNacimiento && hoy.getDate() < nacimiento.getDate())) {
      anios -= 1;
    }
    return anios >= 0 && anios < 130 ? `${anios} años` : 'Sin fecha';
  }

  private cargar(): void {
    this.cargando.set(true);
    this.pagina.set(1);
    this.pacientesService.listar(this.hayBusqueda() ? this.terminoBusqueda() : null).subscribe({
      next: (pacientes) => {
        this.pacientes.set(pacientes);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.cargando.set(false);
        Swal.fire({
          icon: 'error',
          title: 'No se pudo cargar la lista',
          text: errorApi(error).mensaje,
          confirmButtonText: 'Entendido',
        });
      },
    });
  }
}