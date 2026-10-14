import { HttpErrorResponse } from '@angular/common/http';

export interface ErrorApi {
  codigo: string;
  mensaje: string;
}

const ERROR_RED: ErrorApi = {
  codigo: 'ERROR_RED',
  mensaje: 'No se pudo conectar con el servidor',
};

export function errorApi(error: unknown): ErrorApi {
  if (error instanceof HttpErrorResponse && typeof error.error === 'object' && error.error !== null) {
    const cuerpo = error.error as Partial<ErrorApi>;
    if (typeof cuerpo.codigo === 'string' && typeof cuerpo.mensaje === 'string') {
      return { codigo: cuerpo.codigo, mensaje: cuerpo.mensaje };
    }
  }
  return ERROR_RED;
}
