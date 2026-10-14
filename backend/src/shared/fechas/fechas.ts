/**
 * Fecha local del servidor en formato AAAA-MM-DD.
 *
 * No usar `toISOString()`: devuelve la fecha en UTC, que puede ser un dia
 * distinto al del reloj local y queda congelada al leer el valor.
 */
export function hoyIso(): string {
  const ahora = new Date();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${ahora.getFullYear()}-${mes}-${dia}`;
}

/** Primer dia del mes al que pertenece una fecha AAAA-MM-DD. */
export function primerDiaDelMesIso(fechaIso: string): string {
  return `${fechaIso.slice(0, 7)}-01`;
}

/** Dias que separan dos fechas AAAA-MM-DD. */
export function diasEntre(desde: string, hasta: string): number {
  const inicio = new Date(`${desde}T00:00:00`);
  const fin = new Date(`${hasta}T00:00:00`);
  return Math.round((fin.getTime() - inicio.getTime()) / 86_400_000);
}