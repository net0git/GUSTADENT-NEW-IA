import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { errorApi } from '../../../core/http/error-api';
import { ETIQUETAS_PERFIL, Perfil, Usuario } from '../../../core/models/usuario.model';
import { AuthService } from '../../../core/services/auth.service';
import { UsuariosService } from '../../../core/services/usuarios.service';

type FiltroEstado = '' | 'true' | 'false';

@Component({
  selector: 'app-usuarios-lista',
  imports: [RouterLink],
  templateUrl: './usuarios-lista.component.html',
  styleUrl: './usuarios-lista.component.scss',
})
export class UsuariosListaComponent implements OnInit {
  private readonly usuariosService = inject(UsuariosService);
  private readonly auth = inject(AuthService);

  protected readonly etiquetasPerfil = ETIQUETAS_PERFIL;
  protected readonly perfiles = Object.keys(ETIQUETAS_PERFIL) as Perfil[];
  protected readonly idActual = this.auth.obtenerUsuario()?.id;

  protected readonly usuarios = signal<Usuario[]>([]);
  protected readonly cargando = signal(true);
  protected readonly filtroPerfil = signal<Perfil | ''>('');
  protected readonly filtroEstado = signal<FiltroEstado>('');
  protected readonly enProceso = signal<number | null>(null);

  ngOnInit(): void {
    this.cargar();
  }

  protected cambiarFiltroPerfil(valor: string): void {
    this.filtroPerfil.set(valor as Perfil | '');
    this.cargar();
  }

  protected cambiarFiltroEstado(valor: string): void {
    this.filtroEstado.set(valor as FiltroEstado);
    this.cargar();
  }

  protected alternarEstado(usuario: Usuario): void {
    if (!usuario.activo) {
      this.aplicarEstado(usuario, true);
      return;
    }

    Swal.fire({
      icon: 'warning',
      title: '¿Desactivar usuario?',
      text: `${usuario.nombreCompleto} no podrá iniciar sesión hasta que lo reactives.`,
      showCancelButton: true,
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar',
    }).then((resultado) => {
      if (resultado.isConfirmed) {
        this.aplicarEstado(usuario, false);
      }
    });
  }

  protected pedirResetearPassword(usuario: Usuario): void {
    Swal.fire({
      icon: 'warning',
      title: `¿Resetear la contraseña de ${usuario.nombreCompleto}?`,
      text: 'Se generará una contraseña temporal y se cerrarán las sesiones activas del usuario.',
      showCancelButton: true,
      confirmButtonText: 'Sí, resetear',
      cancelButtonText: 'Cancelar',
    }).then((resultado) => {
      if (resultado.isConfirmed) {
        this.resetearPassword(usuario);
      }
    });
  }

protected copiarAlPortapapeles(texto: string): void {
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(texto);
    }
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Contraseña copiada',
      showConfirmButton: false,
      timer: 1800,
    });
  }

protected sucursalesDe(usuario: Usuario): string {
    return usuario.sucursales.map((sucursal) => sucursal.nombre).join(', ') || 'Sin asignar';
  }

  protected esUsuarioActual(usuario: Usuario): boolean {
    return usuario.id === this.idActual;
  }

  private cargar(): void {
    const estado = this.filtroEstado();
    this.cargando.set(true);
    this.usuariosService
      .listar({
        perfil: this.filtroPerfil() || undefined,
        activo: estado === '' ? undefined : estado === 'true',
      })
      .subscribe({
        next: (usuarios) => {
          this.usuarios.set(usuarios);
          this.cargando.set(false);
        },
        error: (error: unknown) => {
          this.cargando.set(false);
          this.mostrarError(errorApi(error).mensaje);
        },
      });
  }

  private resetearPassword(usuario: Usuario): void {
    this.usuariosService.resetearPassword(usuario.id).subscribe({
      next: ({ passwordTemporal, username }) => {
        void this.mostrarPasswordTemporal(username, passwordTemporal);
        this.cargar();
      },
      error: (error: unknown) => {
        Swal.fire({
          icon: 'error',
          title: 'No se pudo resetear la contraseña',
          text: errorApi(error).mensaje,
          confirmButtonText: 'Entendido',
        });
      },
    });
  }

  /**
   * La contrasena temporal solo se muestra una vez: despues solo queda el
   * hash en la base de datos.
   */
  private async mostrarPasswordTemporal(username: string, passwordTemporal: string): Promise<void> {
    await Swal.fire({
      icon: 'success',
      title: 'Contraseña reseteada',
      html: `
        <p style="text-align:left">Comunicá esta contraseña temporal al usuario
        <strong>${username}</strong>. Solo se muestra ahora.</p>
        <input id="password-temporal" class="swal2-input" readonly value="${passwordTemporal}">
        <p style="text-align:left;font-size:0.85rem;color:#64748b;margin-top:0.75rem">
          Las sesiones activas del usuario se cerraron.
        </p>`,
      showConfirmButton: true,
      confirmButtonText: 'Copiar y cerrar',
      didOpen: () => {
        const campo = document.getElementById('password-temporal') as HTMLInputElement | null;
        campo?.select();
      },
    }).then(() => this.copiarAlPortapapeles(passwordTemporal));
  }

private aplicarEstado(usuario: Usuario, activo: boolean): void {
    this.enProceso.set(usuario.id);
    this.usuariosService.cambiarEstado(usuario.id, activo).subscribe({
      next: () => {
        this.enProceso.set(null);
        this.cargar();
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: activo ? 'Usuario activado' : 'Usuario desactivado',
          showConfirmButton: false,
          timer: 2000,
        });
      },
      error: (error: unknown) => {
        this.enProceso.set(null);
        this.mostrarError(errorApi(error).mensaje);
      },
    });
  }

  private mostrarError(mensaje: string): void {
    Swal.fire({ icon: 'error', title: 'No se pudo completar la acción', text: mensaje, confirmButtonText: 'Entendido' });
  }
}
