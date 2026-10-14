import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, UsuarioSesion } from '../services/auth.service';

export function perfilRequeridoGuard(...perfilesPermitidos: UsuarioSesion['perfil'][]): CanActivateFn {
  return () => {
    const usuario = inject(AuthService).obtenerUsuario();
    const router = inject(Router);

    if (usuario && perfilesPermitidos.includes(usuario.perfil)) {
      return true;
    }
    return router.createUrlTree(['/inicio']);
  };
}
