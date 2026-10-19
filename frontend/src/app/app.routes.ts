import { Routes } from '@angular/router';
import {
  configuracionCompletadaGuard,
  configuracionPendienteGuard,
  sesionActivaGuard,
} from './core/guards/configuracion.guard';
import { perfilRequeridoGuard } from './core/guards/perfil.guard';

export const routes: Routes = [
  {
    path: 'configuracion-inicial',
    canActivate: [configuracionPendienteGuard],
    loadComponent: () =>
      import('./features/configuracion-inicial/configuracion-inicial.component').then(
        (m) => m.ConfiguracionInicialComponent
      ),
  },
  {
    path: 'modulo-config',
    canActivate: [configuracionCompletadaGuard],
    loadComponent: () =>
      import('./features/modulo-config/modulo-config.component').then(
        (m) => m.ModuloConfigComponent
      ),
  },
  {
    path: 'login',
    canActivate: [configuracionCompletadaGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [configuracionCompletadaGuard, sesionActivaGuard],
    loadComponent: () =>
      import('./features/layout/layout.component').then((m) => m.LayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      {
        path: 'inicio',
        data: { titulo: 'Inicio', subtitulo: 'Resumen general' },
        loadComponent: () =>
          import('./features/inicio/inicio.component').then((m) => m.InicioComponent),
      },
      {
        path: 'catalogos',
        canActivate: [perfilRequeridoGuard('administrador')],
        data: { titulo: 'Catálogos', subtitulo: 'Sucursales y procedencias' },
        loadComponent: () =>
          import('./features/catalogos/catalogos.component').then((m) => m.CatalogosComponent),
      },
      {
        path: 'mi-cuenta',
        data: { titulo: 'Mi cuenta', subtitulo: 'Datos de acceso' },
        loadComponent: () =>
          import('./features/auth/mi-cuenta/mi-cuenta.component').then((m) => m.MiCuentaComponent),
      },
      {
        path: 'atenciones',
        data: { titulo: 'Atenciones', subtitulo: 'Control de citas y tratamientos' },
        loadComponent: () =>
          import('./features/atenciones/atenciones-lista/atenciones-lista.component').then(
            (m) => m.AtencionesListaComponent
          ),
      },
      {
        path: 'atenciones/nueva',
        data: { titulo: 'Nueva cita', subtitulo: 'Registro de procedimiento y control clínico' },
        loadComponent: () =>
          import('./features/atenciones/nueva-atencion/nueva-atencion.component').then(
            (m) => m.NuevaAtencionComponent
          ),
      },
      {
        path: 'atenciones/:id',
        data: { titulo: 'Atención de Cita', subtitulo: 'Registro de procedimiento y control clínico' },
        loadComponent: () =>
          import('./features/atenciones/atencion-detalle/atencion-detalle.component').then(
            (m) => m.AtencionDetalleComponent
          ),
      },
      {
        path: 'reportes',
        canActivate: [perfilRequeridoGuard('administrador')],
        data: { titulo: 'Reportes', subtitulo: 'Atenciones, ingresos y cuentas por cobrar' },
        loadComponent: () =>
          import('./features/reportes/reportes.component').then((m) => m.ReportesComponent),
      },
      {
        path: 'pacientes',
        data: { titulo: 'Pacientes', subtitulo: 'Registro y búsqueda' },
        loadComponent: () =>
          import('./features/pacientes/pacientes-lista/pacientes-lista.component').then(
            (m) => m.PacientesListaComponent
          ),
      },
      {
        path: 'pacientes/nuevo',
        data: { titulo: 'Nuevo paciente', subtitulo: 'Registrar paciente' },
        loadComponent: () =>
          import('./features/pacientes/paciente-formulario/paciente-formulario.component').then(
            (m) => m.PacienteFormularioComponent
          ),
      },
      {
        path: 'pacientes/:id/editar',
        data: { titulo: 'Editar paciente', subtitulo: 'Actualizar datos del paciente' },
        loadComponent: () =>
          import('./features/pacientes/paciente-formulario/paciente-formulario.component').then(
            (m) => m.PacienteFormularioComponent
          ),
      },
      {
        path: 'usuarios',
        canActivate: [perfilRequeridoGuard('administrador')],
        data: { titulo: 'Usuarios', subtitulo: 'Personal de la clínica' },
        loadComponent: () =>
          import('./features/usuarios/usuarios-lista/usuarios-lista.component').then(
            (m) => m.UsuariosListaComponent
          ),
      },
      {
        path: 'usuarios/nuevo',
        canActivate: [perfilRequeridoGuard('administrador')],
        data: { titulo: 'Nuevo usuario', subtitulo: 'Registrar médico o personal' },
        loadComponent: () =>
          import('./features/usuarios/usuario-formulario/usuario-formulario.component').then(
            (m) => m.UsuarioFormularioComponent
          ),
      },
      {
        path: 'usuarios/:id/editar',
        canActivate: [perfilRequeridoGuard('administrador')],
        data: { titulo: 'Editar usuario', subtitulo: 'Actualizar datos y sucursales' },
        loadComponent: () =>
          import('./features/usuarios/usuario-formulario/usuario-formulario.component').then(
            (m) => m.UsuarioFormularioComponent
          ),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
