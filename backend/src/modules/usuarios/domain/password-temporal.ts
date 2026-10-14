import { randomInt } from 'crypto';

const LONGITUD = 10;
const MINIMO = 8;
const MAXIMO = 72;

/**
 * Contrasena temporal legible: evita caracteres que se confunden entre si
 * (0/O, 1/l/I) para que el administrador pueda comunicarla sin errores.
 */
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

export function generarPasswordTemporal(longitud = LONGITUD): string {
  const largo = Math.min(Math.max(longitud, MINIMO), MAXIMO);
  let resultado = '';

  for (let indice = 0; indice < largo; indice++) {
    resultado += ALFABETO[randomInt(0, ALFABETO.length)];
  }

  return resultado;
}