import { HttpInterceptorFn } from '@angular/common/http';

const CLAVE_TOKEN = 'gustadent.token';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem(CLAVE_TOKEN);

  if (!token || !req.url.startsWith('/api/')) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
