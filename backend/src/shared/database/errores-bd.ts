import { AppError } from '../errors/app-error';

const CODIGO_VIOLACION_UNICA = '23505';
const CODIGO_CLAVE_FORANEA = '23503';
const CODIGO_VIOLACION_CHECK = '23514';
const MARCA_DEUDA_NEGATIVA = 'DEUDA_NEGATIVA';

function codigoDeError(error: unknown): string | null {
  if (typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string') {
    return error.code;
  }
  return null;
}

function mensajeDeError(error: unknown): string | null {
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return null;
}

/**
 * Convierte errores de PostgreSQL en errores de aplicación comprensibles.
 * Cualquier otro error se devuelve sin cambios.
 */
export function traducirErrorBd(error: unknown, mensajeClaveForanea = 'Referencia inexistente'): unknown {
  const codigo = codigoDeError(error);

  if (codigo === CODIGO_VIOLACION_UNICA) {
    return new AppError(409, 'REGISTRO_DUPLICADO', 'Ya existe un registro con esos datos');
  }
  if (codigo === CODIGO_CLAVE_FORANEA) {
    return new AppError(400, 'REFERENCIA_INEXISTENTE', mensajeClaveForanea);
  }
  if (codigo === CODIGO_VIOLACION_CHECK) {
    return new AppError(409, 'MONTO_EXCEDE_TOTAL', mensajeDeViolacion(error));
  }
  return error;
}

/**
 * El mensaje del trigger trae la marca DEUDA_NEGATIVA y los montos. Se limpa
 * para mostrarlo como un mensaje normal de la aplicacion.
 */
function mensajeDeViolacion(error: unknown): string {
  const original = mensajeDeError(error) ?? '';
  const limpio = original.split(' - ')[0].replace(/^ERROR:\s*/i, '').trim();

  if (limpio === '' || !original.includes(MARCA_DEUDA_NEGATIVA)) {
    return 'El monto no es válido para esta operación';
  }

  return limpio;
}