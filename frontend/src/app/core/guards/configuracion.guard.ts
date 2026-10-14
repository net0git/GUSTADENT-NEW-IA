import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { SetupService } from '../services/setup.service';
import { AuthService } from '../services/auth.service';

export const configuracionPendienteGuard: CanActivateFn = () => {
  const setup = inject(SetupService);
  const router = inject(Router);

  return setup.obtenerEstado().pipe(
    map((estado) => (estado.configurado ? router.createUrlTree(['/login']) : true))
  );
};

export const configuracionCompletadaGuard: CanActivateFn = () => {
  const setup = inject(SetupService);
  const router = inject(Router);

  return setup.obtenerEstado().pipe(
    map((estado) => (estado.configurado ? true : router.createUrlTree(['/configuracion-inicial'])))
  );
};

export const sesionActivaGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.obtenerToken() ? true : router.createUrlTree(['/login']);
};
