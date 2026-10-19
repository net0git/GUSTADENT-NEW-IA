import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService, UsuarioSesion } from '../../core/services/auth.service';
import { puedeVer } from '../../core/permisos';
import { Paciente } from '../../core/services/pacientes.service';
import { SetupService } from '../../core/services/setup.service';
import { BusquedaPacientesModalComponent } from '../../shared/componentes/busqueda-pacientes-modal/busqueda-pacientes-modal.component';
import { MiniCalendarioComponent } from '../../shared/componentes/mini-calendario/mini-calendario.component';

const ETIQUETAS_PERFIL: Record<UsuarioSesion['perfil'], string> = {
  administrador: 'Administrador',
  odontologo: 'Odontólogo',
  recepcion: 'Recepción',
};

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MiniCalendarioComponent, BusquedaPacientesModalComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly setup = inject(SetupService);
  private readonly destruir = inject(DestroyRef);

  protected readonly usuario = this.auth.obtenerUsuario();
  protected readonly iniciales = this.calcularIniciales(this.usuario?.nombreCompleto ?? '');
  protected readonly etiquetaPerfil = this.usuario ? ETIQUETAS_PERFIL[this.usuario.perfil] : '';

  private readonly perfil = this.usuario?.perfil ?? null;
  protected readonly esAdministrador = this.perfil === 'administrador';
  protected readonly puedeVerCatalogos = puedeVer(this.perfil, 'catalogos');
  protected readonly puedeVerUsuarios = puedeVer(this.perfil, 'usuarios');

  protected readonly titulo = signal('');
  protected readonly subtitulo = signal('');
  protected readonly menuAbierto = signal(false);
  protected readonly cerrando = signal(false);
  protected readonly busquedaPacienteAbierta = signal(false);
  protected readonly fechaActiva = signal<string | null>(null);
  protected readonly empresa = this.setup.empresa;

  constructor() {
    this.router.events
      .pipe(filter((evento) => evento instanceof NavigationEnd), takeUntilDestroyed(this.destruir))
      .subscribe(() => {
        this.actualizarCabecera();
        this.leerFechaDeLaRuta();
      });
    this.leerFechaDeLaRuta();
    this.cargarEmpresa();
  }

  protected alternarMenu(): void {
    this.menuAbierto.update((abierto) => !abierto);
  }

  /** El calendario filtra el control de atenciones por el día elegido. */
  protected filtrarPorFecha(fecha: string): void {
    this.menuAbierto.set(false);
    this.router.navigate(['/atenciones'], { queryParams: { fecha } });
  }

  protected abrirBusquedaPaciente(): void {
    this.menuAbierto.set(false);
    this.busquedaPacienteAbierta.set(true);
  }

  protected cerrarBusquedaPaciente(): void {
    this.busquedaPacienteAbierta.set(false);
  }

  /** "Nueva cita" abre el formulario; el paciente se elige dentro de la pantalla. */
  protected nuevaCita(): void {
    this.menuAbierto.set(false);
    this.router.navigate(['/atenciones/nueva']);
  }

  protected crearCita(paciente: Paciente): void {
    this.busquedaPacienteAbierta.set(false);
    this.router.navigate(['/atenciones/nueva'], { queryParams: { paciente: paciente.id } });
  }

  protected cerrarSesion(): void {
    this.cerrando.set(true);
    this.auth.cerrarSesion().subscribe({
      complete: () => this.irAlLogin(),
      error: () => this.irAlLogin(),
    });
  }

  private irAlLogin(): void {
    this.menuAbierto.set(false);
    this.router.navigateByUrl('/login');
  }

  private leerFechaDeLaRuta(): void {
    const fecha = this.router.routerState.snapshot.root.queryParamMap.get('fecha');
    this.fechaActiva.set(fecha);
  }

  private actualizarCabecera(): void {
    let ruta = this.router.routerState.snapshot.root;
    while (ruta.firstChild) {
      ruta = ruta.firstChild;
    }
    this.titulo.set(ruta.data['titulo'] ?? '');
    this.subtitulo.set(ruta.data['subtitulo'] ?? '');
    this.menuAbierto.set(false);
  }

  private calcularIniciales(nombreCompleto: string): string {
    const partes = nombreCompleto.trim().split(/\s+/).filter(Boolean);
    const primeras = partes.slice(0, 2).map((parte) => parte.charAt(0).toUpperCase());
    return primeras.join('') || '?';
  }

  private cargarEmpresa(): void {
    if (this.empresa()) {
      return;
    }
    this.setup.cargarEmpresa().subscribe();
  }
}
